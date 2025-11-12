import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import type { PointAdjustment } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body: PointAdjustment = await request.json();
    const { memberId, pointsChange, reason } = body;

    // Get all active members with current ranks
    const { data: allMembers } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('points', { ascending: false });

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

    // Get current member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const newPoints = member.points + pointsChange;

    // Update member points
    const { error: updateError } = await supabase
      .from('members')
      .update({ points: newPoints })
      .eq('id', memberId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update points' },
        { status: 500 }
      );
    }

    // Create point history record
    await supabase.from('point_history').insert({
      member_id: memberId,
      event_id: null,
      points_change: pointsChange,
      reason,
      new_total: newPoints,
    });

    // Recalculate ranks for all active members
    const updatedMember = allMembers.find(m => m.id === memberId);
    if (updatedMember) {
      updatedMember.points = newPoints;
    }

    const activeMembers = allMembers.filter(m => m.status === 'active');
    activeMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name); // Alphabetical for ties
    });

    // Update rank changes for all members
    for (let i = 0; i < activeMembers.length; i++) {
      const m = activeMembers[i];
      const newRank = i + 1;
      const oldRank = oldRanks.get(m.id) || newRank;
      const rankChange = oldRank - newRank;

      await supabase
        .from('members')
        .update({ rank_change: rankChange })
        .eq('id', m.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Points adjusted successfully',
      newPoints,
    });
  } catch (error) {
    console.error('Adjust points API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
