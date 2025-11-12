import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = getServiceRoleClient();

    // Get all active members with current ranks
    const { data: allMembers } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('points', { ascending: false })
      .order('name', { ascending: true }); // Secondary sort by name

    if (!allMembers) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Create a map of current ranks
    const oldRanks = new Map<string, number>();
    allMembers.forEach((member, index) => {
      oldRanks.set(member.id, index + 1);
    });

    // Sort by points to get new ranks
    const activeMembers = allMembers.filter(m => m.status === 'active');
    activeMembers.sort((a, b) => b.points - a.points);

    // Sort consistently by points then name
    activeMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name);
    });

    // Prepare all updates in a single batch using upsert
    const updates = activeMembers.map((m, i) => {
      const newRank = i + 1;
      const oldRank = oldRanks.get(m.id) || newRank;
      const rankChange = oldRank - newRank;

      return {
        id: m.id,
        rank_change: rankChange,
        // Include all existing fields to prevent data loss during upsert
        name: m.name,
        points: m.points,
        status: m.status,
        created_at: m.created_at
      };
    });

    // Execute a single bulk upsert operation - much faster than individual updates
    const { error: upsertError } = await supabase
      .from('members')
      .upsert(updates, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to update rankings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rankings recalculated successfully',
      membersUpdated: activeMembers.length,
    });
  } catch (error) {
    console.error('Recalculate ranks API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
