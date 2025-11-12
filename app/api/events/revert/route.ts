import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { eventId } = await request.json();

    // Get all attendance records for this event
    const { data: attendanceRecords } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('event_id', eventId);

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No attendance records found' },
        { status: 404 }
      );
    }

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

    // Reverse the point changes
    for (const record of attendanceRecords) {
      const member = allMembers.find(m => m.id === record.member_id);
      if (!member) continue;

      const revertedPoints = member.points - record.points_change;
      member.points = revertedPoints;

      // Update member points
      await supabase
        .from('members')
        .update({ points: revertedPoints })
        .eq('id', record.member_id);

      // Add reversal to point history
      await supabase.from('point_history').insert({
        member_id: record.member_id,
        event_id: eventId,
        points_change: -record.points_change,
        reason: 'Event reverted',
        new_total: revertedPoints,
      });
    }

    // Mark event as reverted AND convert back to draft
    await supabase
      .from('events')
      .update({
        is_reverted: true,
        is_draft: true
      })
      .eq('id', eventId);

    // Recalculate ranks
    const activeMembers = allMembers.filter(m => m.status === 'active');
    activeMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name); // Alphabetical for ties
    });

    for (let i = 0; i < activeMembers.length; i++) {
      const member = activeMembers[i];
      const newRank = i + 1;
      const oldRank = oldRanks.get(member.id) || newRank;
      const rankChange = oldRank - newRank;

      await supabase
        .from('members')
        .update({ rank_change: rankChange })
        .eq('id', member.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Event reverted successfully',
    });
  } catch (error) {
    console.error('Revert event API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
