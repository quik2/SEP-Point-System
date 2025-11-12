import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { POINT_RULES, EVENT_TYPES } from '@/lib/pointRules';
import type { AttendanceStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { name, category, customEventType, attendance, selectedMembers, socialPoints, customRules } = body;

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

    // Determine event type name
    let eventTypeName = '';
    switch (category) {
      case 'active_meeting':
        eventTypeName = EVENT_TYPES.ACTIVE_MEETING;
        break;
      case 'exec_meeting':
        eventTypeName = EVENT_TYPES.EXEC_MEETING;
        break;
      case 'social':
        eventTypeName = EVENT_TYPES.SOCIAL_EVENT;
        break;
      case 'custom':
        eventTypeName = customEventType || EVENT_TYPES.CUSTOM;
        break;
    }

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name,
        event_type: eventTypeName,
        date: new Date().toISOString(),
        is_draft: false,
        custom_rules: customRules || null,
        selected_members: selectedMembers || null,
      })
      .select()
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Failed to create event' },
        { status: 500 }
      );
    }

    const attendanceRecords = [];
    const pointHistoryRecords = [];

    // Handle different event types
    if (category === 'social') {
      // Social event - give points to selected members
      const points = socialPoints || 0;
      for (const memberId of selectedMembers || []) {
        const member = allMembers.find(m => m.id === memberId);
        if (!member) continue;

        const newPoints = member.points + points;
        member.points = newPoints;

        attendanceRecords.push({
          event_id: event.id,
          member_id: memberId,
          status: 'present' as AttendanceStatus,
          points_change: points,
        });

        pointHistoryRecords.push({
          member_id: memberId,
          event_id: event.id,
          points_change: points,
          reason: `${name} - Social Event`,
          new_total: newPoints,
        });
      }
    } else {
      // Active Meeting, Exec Meeting, or Custom - use attendance rules
      const rules = customRules || POINT_RULES[eventTypeName] || POINT_RULES[EVENT_TYPES.ACTIVE_MEETING];

      for (const [memberId, status] of Object.entries(attendance || {})) {
        const member = allMembers.find(m => m.id === memberId);
        if (!member) continue;

        const pointsChange = rules[status as AttendanceStatus] || 0;
        const newPoints = member.points + pointsChange;
        member.points = newPoints;

        attendanceRecords.push({
          event_id: event.id,
          member_id: memberId,
          status: status as AttendanceStatus,
          points_change: pointsChange,
        });

        if (pointsChange !== 0) {
          pointHistoryRecords.push({
            member_id: memberId,
            event_id: event.id,
            points_change: pointsChange,
            reason: `${name} - ${(status as string).replace('_', ' ')}`,
            new_total: newPoints,
          });
        }
      }
    }

    // Insert records
    if (attendanceRecords.length > 0) {
      await supabase.from('attendance_records').insert(attendanceRecords);
    }

    if (pointHistoryRecords.length > 0) {
      await supabase.from('point_history').insert(pointHistoryRecords);
    }

    // Recalculate ranks
    const activeMembers = allMembers.filter(m => m.status === 'active');
    activeMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name); // Alphabetical for ties
    });

    console.log('Recalculating ranks for', activeMembers.length, 'members');

    for (let i = 0; i < activeMembers.length; i++) {
      const member = activeMembers[i];
      const newRank = i + 1;
      const oldRank = oldRanks.get(member.id) || newRank;
      const rankChange = oldRank - newRank;

      console.log(`${member.name}: oldRank=${oldRank}, newRank=${newRank}, change=${rankChange}`);

      await supabase
        .from('members')
        .update({
          points: member.points,
          rank_change: rankChange,
        })
        .eq('id', member.id);
    }

    console.log('Rank recalculation complete');

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      eventId: event.id,
    });
  } catch (error) {
    console.error('Submit event API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
