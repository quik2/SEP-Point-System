import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { calculatePointChange } from '@/lib/pointRules';
import type { AttendanceSubmission, AttendanceStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body: AttendanceSubmission = await request.json();
    const { eventName, eventType, attendance } = body;

    // Get all active members with their current ranks
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

    // Create a map of current ranks (position in leaderboard)
    const oldRanks = new Map<string, number>();
    allMembers.forEach((member, index) => {
      oldRanks.set(member.id, index + 1);
    });

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name: eventName,
        event_type: eventType,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Failed to create event' },
        { status: 500 }
      );
    }

    // Process each attendance record and update points
    const attendanceRecords = [];
    const pointHistoryRecords = [];

    for (const record of attendance) {
      const { memberId, status } = record;
      const pointsChange = calculatePointChange(eventType, status);

      const member = allMembers.find(m => m.id === memberId);
      if (!member) continue;

      const newPoints = member.points + pointsChange;
      const newStatus = status === 'inactive' ? 'inactive' : member.status;

      // Update the member in our local array
      member.points = newPoints;
      member.status = newStatus;

      // Create attendance record
      attendanceRecords.push({
        event_id: event.id,
        member_id: memberId,
        status,
        points_change: pointsChange,
      });

      // Create point history record
      if (pointsChange !== 0 || status === 'inactive') {
        pointHistoryRecords.push({
          member_id: memberId,
          event_id: event.id,
          points_change: pointsChange,
          reason: `${eventName} - ${status.replace('_', ' ')}`,
          new_total: newPoints,
        });
      }
    }

    // Insert attendance records
    if (attendanceRecords.length > 0) {
      await supabase.from('attendance_records').insert(attendanceRecords);
    }

    // Insert point history records
    if (pointHistoryRecords.length > 0) {
      await supabase.from('point_history').insert(pointHistoryRecords);
    }

    // Calculate new ranks after point changes
    const activeMembers = allMembers.filter(m => m.status === 'active');
    activeMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name); // Alphabetical for ties
    });

    // Update all members with new points and rank changes
    for (let i = 0; i < activeMembers.length; i++) {
      const member = activeMembers[i];
      const newRank = i + 1;
      const oldRank = oldRanks.get(member.id) || newRank;
      const rankChange = oldRank - newRank; // Positive means moved up, negative means moved down

      await supabase
        .from('members')
        .update({
          points: member.points,
          status: member.status,
          rank_change: rankChange,
        })
        .eq('id', member.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      eventId: event.id,
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
