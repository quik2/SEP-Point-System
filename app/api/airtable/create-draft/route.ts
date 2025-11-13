import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllAirtableRecords,
  detectEventsInRecords,
  getAttendanceForEvent,
  parseEventName,
  extractEventDate,
} from '@/lib/airtableClient';
import { findMemberIdForAirtablePerson } from '@/lib/airtableMapping';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * POST /api/airtable/create-draft
 *
 * Creates a draft event from an Airtable event
 *
 * Body: { eventId: string }
 * Example: { eventId: "meeting_is_tonight_at_8pm_2025_11_13" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Fetch Airtable records
    const records = await fetchAllAirtableRecords();
    const events = detectEventsInRecords(records);

    // Find the requested event
    const event = events.find(e => e.eventId === eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: `Event ${eventId} not found in Airtable` },
        { status: 404 }
      );
    }

    // Check if this event already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('airtable_event_id', eventId)
      .single();

    if (existingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event already exists',
          eventId: existingEvent.id,
        },
        { status: 409 }
      );
    }

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name')
      .eq('status', 'active');

    if (membersError || !members) {
      throw new Error('Failed to fetch members');
    }

    // Create the draft event
    const eventName = parseEventName(event.eventId);
    const eventDate = extractEventDate(event.eventId);

    const { data: createdEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        name: eventName,
        event_type: 'Active Meeting',
        date: new Date(eventDate).toISOString(),
        is_draft: true,
        airtable_event_id: eventId,
      })
      .select()
      .single();

    if (eventError || !createdEvent) {
      throw new Error(`Failed to create event: ${eventError?.message}`);
    }

    // Get attendance responses from Airtable
    const attendanceResponses = getAttendanceForEvent(records, event);

    // Create attendance records for all members
    const attendanceRecords = [];

    for (const member of members) {
      // Find if this member has a response in Airtable
      const airtableResponse = attendanceResponses.find(resp => {
        // Try to match Airtable person to member name
        return (
          resp.person.toLowerCase() === member.name.toLowerCase() ||
          member.name.toLowerCase().includes(resp.person.toLowerCase())
        );
      });

      let status = 'absent'; // Default to absent - mark present when they show up
      let notes = null;

      // If they responded "No", mark as excused_absent with their notes
      if (airtableResponse && airtableResponse.response?.toLowerCase() === 'no') {
        status = 'excused_absent';
        notes = airtableResponse.notes || 'No reason provided';
      }

      attendanceRecords.push({
        event_id: createdEvent.id,
        member_id: member.id,
        status,
        points_change: 0, // No points for draft events
        notes,
      });
    }

    // Insert all attendance records
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords);

    if (attendanceError) {
      // Rollback: delete the event if attendance creation failed
      await supabase.from('events').delete().eq('id', createdEvent.id);
      throw new Error(`Failed to create attendance records: ${attendanceError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Draft event "${eventName}" created successfully`,
      data: {
        eventId: createdEvent.id,
        airtableEventId: eventId,
        name: eventName,
        date: eventDate,
        attendanceCount: attendanceRecords.length,
        excusedAbsences: attendanceRecords.filter(r => r.status === 'excused_absent').length,
      },
    });
  } catch (error: any) {
    console.error('Error creating draft from Airtable:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create draft event',
      },
      { status: 500 }
    );
  }
}
