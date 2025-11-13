'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, X, Users } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/pointRules';
import { filterExecMembers } from '@/lib/execMembers';
import { sortMembersByCustomOrder } from '@/lib/memberOrder';
import type { Member, AttendanceStatus, Event } from '@/types';

type EventCategory = 'active_meeting' | 'exec_meeting' | 'social' | 'custom';

interface DraftEvent {
  id?: string;
  name: string;
  category: EventCategory;
  customEventType?: string;
  attendance?: Record<string, AttendanceStatus>;
  notes?: Record<string, string>; // Member ID -> notes/excuse
  selectedMembers?: string[];
  socialPoints?: number;
  customRules?: Partial<Record<AttendanceStatus, number>>;
}

const statusOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused_absent', label: 'Excused Absent' },
  { value: 'excused_late', label: 'Excused Late' },
];

export default function AttendanceGrid() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DraftEvent | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newAirtableEvents, setNewAirtableEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMembers();
    loadDrafts();
    fetchDraftEvents();
    checkForNewAirtableEvents();
  }, []);

  // Auto-save drafts
  useEffect(() => {
    if (draftEvents.length > 0) {
      localStorage.setItem('event-drafts', JSON.stringify(draftEvents));
    }
  }, [draftEvents]);

  const loadDrafts = () => {
    const saved = localStorage.getItem('event-drafts');
    if (saved) {
      try {
        setDraftEvents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load drafts');
      }
    }
  };

  const fetchDraftEvents = async () => {
    try {
      const response = await fetch('/api/events?includeDrafts=true');
      const data = await response.json();
      if (data.success) {
        // Get only draft events from the database
        const dbDrafts = data.data.filter((e: any) => e.is_draft === true);

        // Convert database drafts to DraftEvent format
        const convertedDbDrafts: DraftEvent[] = await Promise.all(
          dbDrafts.map(async (dbEvent: any) => {
            // Fetch attendance records for this event
            const attendanceRes = await fetch(`/api/events/${dbEvent.id}/attendance`);
            const attendanceData = await attendanceRes.json();

            const attendance: Record<string, AttendanceStatus> = {};
            const notes: Record<string, string> = {};

            if (attendanceData.success && attendanceData.data) {
              attendanceData.data.forEach((record: any) => {
                attendance[record.member_id] = record.status;
                if (record.notes) {
                  notes[record.member_id] = record.notes;
                }
              });
              console.log(`Loaded ${dbEvent.name}: ${attendanceData.data.length} attendance records, ${Object.keys(notes).length} with notes`);
              const excusedCount = attendanceData.data.filter((r: any) => r.status === 'excused_absent').length;
              console.log(`  - ${excusedCount} excused absences`);
            }

            // Determine category from event_type
            let category: EventCategory = 'active_meeting';
            if (dbEvent.event_type === 'Exec Meeting') category = 'exec_meeting';
            else if (dbEvent.event_type === 'Social Event') category = 'social';
            else if (dbEvent.event_type !== 'Active Meeting') category = 'custom';

            return {
              id: dbEvent.id,
              name: dbEvent.name,
              category,
              customEventType: category === 'custom' ? dbEvent.event_type : undefined,
              attendance,
              notes,
              selectedMembers: dbEvent.selected_members || [],
              customRules: dbEvent.custom_rules || undefined,
            };
          })
        );

        // Merge with localStorage drafts
        const localDrafts = JSON.parse(localStorage.getItem('event-drafts') || '[]');
        const localDraftIds = localDrafts.map((d: DraftEvent) => d.id).filter(Boolean);
        const newDbDrafts = convertedDbDrafts.filter(d => !localDraftIds.includes(d.id));

        setDraftEvents([...localDrafts, ...newDbDrafts]);
      }
    } catch (error) {
      console.error('Failed to fetch draft events:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?includeInactive=false');
      const data = await response.json();
      if (data.success) {
        const activeMembers: Member[] = data.data.filter((m: Member) => m.status === 'active');
        const sortedMembers = sortMembersByCustomOrder<Member>(activeMembers);
        setAllMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const checkForNewAirtableEvents = async () => {
    try {
      const response = await fetch('/api/airtable/detect-events');
      const data = await response.json();
      if (data.success && data.data.new > 0) {
        setNewAirtableEvents(data.data.events);
      }
    } catch (error) {
      console.error('Failed to check for new Airtable events:', error);
    }
  };

  const importAirtableEvent = async (eventId: string) => {
    try {
      setMessage({ text: 'Importing event from Airtable...', type: 'success' });

      const response = await fetch('/api/airtable/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: `Event "${data.data.name}" imported!`, type: 'success' });
        setNewAirtableEvents(newAirtableEvents.filter(e => e.eventId !== eventId));
        await fetchDraftEvents(); // Reload drafts

        // Start auto-syncing if we just imported
        if (currentDraft?.id === data.data.eventId) {
          startLiveSync(data.data.eventId);
        }
      } else {
        setMessage({ text: `Failed to import: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error importing event', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startLiveSync = (eventId: string) => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    setIsSyncing(true);

    // Sync immediately
    syncEventResponses(eventId);

    // Then sync every 30 seconds
    const interval = setInterval(() => {
      syncEventResponses(eventId);
    }, 30000);

    setSyncInterval(interval);
  };

  const stopLiveSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
    }
    setIsSyncing(false);
  };

  const syncEventResponses = async (eventId: string) => {
    try {
      const response = await fetch('/api/airtable/sync-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`Synced ${data.data.updatedRecords} attendance records`);
        // Reload the draft to show updated data
        await fetchDraftEvents();

        // If this draft is currently open, reload it
        if (currentDraft?.id === eventId) {
          const updatedDraft = draftEvents.find(d => d.id === eventId);
          if (updatedDraft) {
            setCurrentDraft(updatedDraft);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing responses:', error);
    }
  };

  const createNewEvent = () => {
    const newDraft: DraftEvent = {
      name: '',
      category: 'active_meeting',
      attendance: {},
      selectedMembers: [],
    };
    setCurrentDraft(newDraft);
  };

  const saveDraft = () => {
    if (!currentDraft || !currentDraft.name.trim()) {
      setMessage({ text: 'Please enter an event name', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const updatedDrafts = [...draftEvents];
    const existingIndex = updatedDrafts.findIndex(d => d.id === currentDraft.id);

    const draftToSave = { ...currentDraft, id: currentDraft.id || Date.now().toString() };

    if (existingIndex >= 0) {
      updatedDrafts[existingIndex] = draftToSave;
    } else {
      updatedDrafts.push(draftToSave);
    }

    setDraftEvents(updatedDrafts);
    setCurrentDraft(null);
    setMessage({ text: 'Draft saved!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadDraft = (draft: DraftEvent) => {
    setCurrentDraft(draft);
  };

  const deleteDraft = async (draftId: string) => {
    try {
      // If the draft has an ID (from database), delete it from the database
      const draft = draftEvents.find(d => d.id === draftId);
      if (draft && draftId && draftId.length > 20) { // UUIDs are longer than 20 chars
        const response = await fetch(`/api/events/${draftId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('Failed to delete draft from database');
        }
      }

      // Remove from local state and localStorage
      const updatedDrafts = draftEvents.filter(d => d.id !== draftId);
      setDraftEvents(updatedDrafts);
      localStorage.setItem('event-drafts', JSON.stringify(updatedDrafts.filter(d => !d.id || d.id.length <= 20)));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const submitEvent = async () => {
    if (!currentDraft || !currentDraft.name.trim()) {
      setMessage({ text: 'Please enter an event name', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSubmitting(true);
    setMessage({ text: 'Submitting event...', type: 'success' });

    try {
      console.log('Submitting event:', currentDraft);

      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDraft),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setMessage({ text: 'Event submitted! Points updated.', type: 'success' });
        // Remove from drafts
        if (currentDraft.id) {
          setDraftEvents(draftEvents.filter(d => d.id !== currentDraft.id));
          localStorage.setItem('event-drafts', JSON.stringify(draftEvents.filter(d => d.id !== currentDraft.id)));
        }
        setCurrentDraft(null);
        await fetchMembers();
      } else {
        setMessage({ text: `Failed to submit event: ${data.error || 'Unknown error'}`, type: 'error' });
        console.error('Submission failed:', data);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ text: `Error submitting event: ${error}`, type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getMembersForEvent = () => {
    if (!currentDraft) return [];

    switch (currentDraft.category) {
      case 'exec_meeting':
        return filterExecMembers(allMembers);
      case 'social':
        return allMembers.filter(m => currentDraft.selectedMembers?.includes(m.id));
      default:
        return allMembers;
    }
  };

  // Initialize attendance for members when they're loaded or category changes
  // Skip this for drafts loaded from database (they already have attendance set)
  useEffect(() => {
    if (currentDraft && allMembers.length > 0) {
      console.log('useEffect triggered for draft:', currentDraft.name, 'has ID:', !!currentDraft.id);

      if (!currentDraft.id) {
        // Only initialize for NEW drafts (no ID means not from database)
        console.log('  Initializing attendance for new draft');
        const members = getMembersForEvent();
        const newAttendance = { ...currentDraft.attendance };

        members.forEach(member => {
          if (!newAttendance[member.id]) {
            newAttendance[member.id] = 'present';
          }
        });

        if (Object.keys(newAttendance).length !== Object.keys(currentDraft.attendance || {}).length) {
          setCurrentDraft({ ...currentDraft, attendance: newAttendance });
        }
      } else {
        console.log('  Skipping initialization - draft from database');
        console.log('  Current attendance records:', Object.keys(currentDraft.attendance || {}).length);
        console.log('  Current notes:', Object.keys(currentDraft.notes || {}).length);
      }
    }
  }, [currentDraft?.category, allMembers.length]);

  const toggleSocialMember = (memberId: string) => {
    if (!currentDraft) return;

    const current = currentDraft.selectedMembers || [];
    const updated = current.includes(memberId)
      ? current.filter(id => id !== memberId)
      : [...current, memberId];

    setCurrentDraft({ ...currentDraft, selectedMembers: updated });
  };

  if (!currentDraft) {
    return (
      <div className="space-y-6">
        {/* New Airtable Events Notification */}
        {newAirtableEvents.length > 0 && (
          <div className="bg-blue-950/30 border border-blue-500/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              🆕 New Events from Airtable ({newAirtableEvents.length})
            </h3>
            <div className="space-y-2">
              {newAirtableEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <div>
                    <p className="font-semibold">{event.eventName}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <button
                    onClick={() => importAirtableEvent(event.eventId)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Import Event
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft Events Grid */}
        {draftEvents.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Saved Drafts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftEvents.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  <div className="mb-3">
                    <p className="font-semibold text-base mb-1">{draft.name || 'Untitled Event'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{draft.category.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadDraft(draft)}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id!)}
                      className="px-3 py-2 bg-destructive/20 text-destructive rounded-md hover:bg-destructive/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Event Button */}
        <button
          onClick={createNewEvent}
          className="w-full flex items-center justify-center gap-2 p-6 bg-card border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Event</span>
        </button>
      </div>
    );
  }

  const membersToShow = getMembersForEvent();

  return (
    <div className="space-y-6">
      {/* Event Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Event Configuration</h2>
            {/* Live Sync Controls - only show for Airtable-linked drafts */}
            {currentDraft.id && currentDraft.id.length > 20 && (
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Live syncing
                    </div>
                    <button
                      onClick={stopLiveSync}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      Stop Sync
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => currentDraft.id && startLiveSync(currentDraft.id)}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Start Live Sync
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              stopLiveSync();
              setCurrentDraft(null);
            }}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name</label>
            <input
              type="text"
              value={currentDraft.name}
              onChange={(e) => setCurrentDraft({ ...currentDraft, name: e.target.value })}
              placeholder="e.g., Week 2, Fall Mixer"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={currentDraft.category}
              onChange={(e) => setCurrentDraft({ ...currentDraft, category: e.target.value as EventCategory })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active_meeting">Active Meeting</option>
              <option value="exec_meeting">Exec Meeting</option>
              <option value="social">Social Event</option>
              <option value="custom">Custom Event</option>
            </select>
          </div>

          {currentDraft.category === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom Event Type</label>
              <input
                type="text"
                value={currentDraft.customEventType || ''}
                onChange={(e) => setCurrentDraft({ ...currentDraft, customEventType: e.target.value })}
                placeholder="Enter event type name"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {currentDraft.category === 'social' && (
            <div>
              <label className="block text-sm font-medium mb-2">Points to Award</label>
              <input
                type="number"
                value={currentDraft.socialPoints || 0}
                onChange={(e) => setCurrentDraft({ ...currentDraft, socialPoints: parseInt(e.target.value) })}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Social Event Member Selection */}
      {currentDraft.category === 'social' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Select Members</h2>
            <span className="text-sm text-muted-foreground">
              ({currentDraft.selectedMembers?.length || 0} selected)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allMembers.map((member) => {
              const isSelected = currentDraft.selectedMembers?.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => toggleSocialMember(member.id)}
                  className={`p-2 text-sm rounded-lg border transition-colors text-left ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-secondary/30 border-border hover:border-primary/50'
                  }`}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Event Rules */}
      {currentDraft.category === 'custom' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Define Point Rules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statusOptions.map((status) => (
              <div key={status.value}>
                <label className="block text-sm font-medium mb-2">{status.label}</label>
                <input
                  type="number"
                  value={currentDraft.customRules?.[status.value] || 0}
                  onChange={(e) => setCurrentDraft({
                    ...currentDraft,
                    customRules: {
                      ...currentDraft.customRules,
                      [status.value]: parseInt(e.target.value) || 0,
                    }
                  })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Table (for Active Meeting, Exec Meeting, Custom) */}
      {(currentDraft.category === 'active_meeting' || currentDraft.category === 'exec_meeting' || currentDraft.category === 'custom') && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mark Attendance</h2>
            <span className="text-sm text-muted-foreground">{membersToShow.length} members</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Current Points</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Notes/Excuse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {membersToShow.map((member) => {
                  const status = currentDraft.attendance?.[member.id] || 'present';
                  const notes = currentDraft.notes?.[member.id] || '';
                  const showNotes = status === 'excused_absent' || status === 'excused_late';

                  return (
                    <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.points}</td>
                      <td className="px-4 py-3">
                        <select
                          value={status}
                          onChange={(e) => setCurrentDraft({
                            ...currentDraft,
                            attendance: {
                              ...currentDraft.attendance,
                              [member.id]: e.target.value as AttendanceStatus,
                            }
                          })}
                          className={`px-3 py-1.5 text-sm rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-primary [&>option]:bg-background [&>option]:text-foreground ${getStatusColor(status)}`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {showNotes && (
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setCurrentDraft({
                              ...currentDraft,
                              notes: {
                                ...currentDraft.notes,
                                [member.id]: e.target.value,
                              }
                            })}
                            placeholder="Enter excuse/reason..."
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveDraft}
          className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>

        <button
          onClick={submitEvent}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Event'}
        </button>

        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );

  function getStatusColor(status: AttendanceStatus) {
    switch (status) {
      case 'present': return 'bg-green-950/30 text-green-400 border-green-900/50';
      case 'absent': return 'bg-red-950/30 text-red-400 border-red-900/50';
      case 'late': return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
      case 'excused_absent': return 'bg-yellow-950/30 text-yellow-400 border-yellow-900/50';
      case 'excused_late': return 'bg-yellow-950/30 text-yellow-400 border-yellow-900/50';
      default: return 'bg-secondary';
    }
  }
}
