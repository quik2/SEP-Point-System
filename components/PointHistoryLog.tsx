'use client';

import { useState, useEffect } from 'react';
import { Download, Search, ArrowUp, ArrowDown, Undo2 } from 'lucide-react';
import type { Member, Event } from '@/types';

export default function PointHistoryLog() {
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events?includeDrafts=false');
      const data = await response.json();
      console.log('Events API response:', data);
      if (data.success) {
        console.log('Setting events:', data.data);
        setEvents(data.data || []);
      } else {
        console.error('Events API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?includeInactive=true');
      const data = await response.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const revertEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to revert "${eventName}"? This will undo all point changes from this event.`)) {
      return;
    }

    try {
      const response = await fetch('/api/events/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: `Event "${eventName}" reverted successfully`, type: 'success' });
        fetchEvents();
      } else {
        setMessage({ text: 'Failed to revert event', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error reverting event', type: 'error' });
    }
  };

  const exportToCSV = () => {
    const headers = ['Event Name', 'Event Type', 'Date', 'Status'];
    const rows = filteredEvents.map((event) => [
      event.name,
      event.event_type,
      new Date(event.date).toLocaleString(),
      event.is_reverted ? 'Reverted' : 'Active',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-history-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setMessage({ text: 'CSV exported successfully', type: 'success' });
  };

  const filteredEvents = events.filter((event) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.name.toLowerCase().includes(searchLower) ||
      event.event_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Events</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by event name or type..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold">Event History</h2>
          <span className="text-sm text-muted-foreground">{filteredEvents.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Event Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className={`hover:bg-secondary/20 transition-colors ${event.is_reverted ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{event.name}</td>
                    <td className="px-4 py-3 text-sm">{event.event_type}</td>
                    <td className="px-4 py-3 text-center">
                      {event.is_reverted ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Reverted
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!event.is_reverted && (
                        <button
                          onClick={() => revertEvent(event.id, event.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-md transition-colors text-sm"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
