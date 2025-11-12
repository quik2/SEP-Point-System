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

  useEffect(() => {
    fetchMembers();
    loadDrafts();
    fetchDraftEvents();
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
        const dbDrafts = data.data.filter((e: any) => e.is_draft === true || e.is_draft === 'true');
        // Merge with localStorage drafts (localStorage takes priority)
        const localDraftIds = draftEvents.map(d => d.id).filter(Boolean);
        const newDbDrafts = dbDrafts.filter((e: any) => !localDraftIds.includes(e.id));
        // TODO: Convert DB events to DraftEvent format if needed
      }
    } catch (error) {
      console.error('Failed to fetch draft events');
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

  const deleteDraft = (draftId: string) => {
    setDraftEvents(draftEvents.filter(d => d.id !== draftId));
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
  useEffect(() => {
    if (currentDraft && allMembers.length > 0) {
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
          <h2 className="text-xl font-semibold">Event Configuration</h2>
          <button
            onClick={() => setCurrentDraft(null)}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {membersToShow.map((member) => {
                  const status = currentDraft.attendance?.[member.id] || 'present';
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
