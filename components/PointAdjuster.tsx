'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Search, RefreshCw } from 'lucide-react';
import { sortMembersByCustomOrder } from '@/lib/memberOrder';
import type { Member } from '@/types';

export default function PointAdjuster() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?includeInactive=false');
      const data = await response.json();
      if (data.success) {
        const activeMembers: Member[] = data.data.filter((m: Member) => m.status === 'active');
        const sortedMembers = sortMembersByCustomOrder<Member>(activeMembers);
        setMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const adjustPoints = async (memberId: string, memberName: string, change: number) => {
    try {
      // Optimistically update the UI immediately
      setMembers(prev => prev.map(m =>
        m.id === memberId
          ? { ...m, points: m.points + change }
          : m
      ));

      const response = await fetch('/api/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          pointsChange: change,
          reason: `Manual ${change > 0 ? 'addition' : 'deduction'} of ${Math.abs(change)} points`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          text: `${memberName}: ${change > 0 ? '+' : ''}${change} points (New total: ${data.newPoints})`,
          type: 'success'
        });
        // Don't fetch members - keep the current order until manual refresh
      } else {
        setMessage({ text: 'Failed to adjust points', type: 'error' });
        // Revert the optimistic update on failure
        fetchMembers();
      }
    } catch (error) {
      setMessage({ text: 'Error adjusting points', type: 'error' });
      // Revert the optimistic update on error
      fetchMembers();
    }
  };

  const handleRefreshRankings = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/recalculate-ranks', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          text: 'Rankings refreshed successfully!',
          type: 'success'
        });
        // Fetch updated member data to show new rankings
        await fetchMembers();
      } else {
        setMessage({ text: 'Failed to refresh rankings', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error refreshing rankings', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Leaderboard Rankings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              After adjusting points, click refresh to recalculate rankings
            </p>
          </div>
          <button
            onClick={handleRefreshRankings}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Rankings'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Quick Point Adjustment</h2>
          <p className="text-sm text-muted-foreground mt-1">Click +/- to adjust points by 1, or the larger buttons for 5</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Current Points</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.status}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${member.points >= 80 ? 'text-foreground' : 'text-destructive'}`}>
                      {member.points}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* -5 button */}
                      <button
                        onClick={() => adjustPoints(member.id, member.name, -5)}
                        className="w-10 h-10 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg font-bold transition-colors flex items-center justify-center"
                        title="Remove 5 points"
                      >
                        -5
                      </button>

                      {/* -1 button */}
                      <button
                        onClick={() => adjustPoints(member.id, member.name, -1)}
                        className="w-10 h-10 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-800/50 rounded-lg transition-colors flex items-center justify-center"
                        title="Remove 1 point"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      {/* +1 button */}
                      <button
                        onClick={() => adjustPoints(member.id, member.name, 1)}
                        className="w-10 h-10 bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-800/50 rounded-lg transition-colors flex items-center justify-center"
                        title="Add 1 point"
                      >
                        <Plus className="w-5 h-5" />
                      </button>

                      {/* +5 button */}
                      <button
                        onClick={() => adjustPoints(member.id, member.name, 5)}
                        className="w-10 h-10 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800/50 rounded-lg font-bold transition-colors flex items-center justify-center"
                        title="Add 5 points"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success/Error Message */}
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
