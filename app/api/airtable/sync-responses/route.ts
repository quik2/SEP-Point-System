import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllAirtableRecords,
  detectEventsInRecords,
  getAttendanceForEvent,
} from '@/lib/airtableClient';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * POST /api/airtable/sync-responses
 *
 * Syncs attendance responses from Airtable for a specific event
 * Updates existing attendance records with latest responses
 *
 * Body: { eventId: string } (SEP database event ID, not Airtable event ID)
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

    // Fetch the event from database
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, airtable_event_id, name, is_draft')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.airtable_event_id) {
      return NextResponse.json(
        { success: false, error: 'Event is not linked to Airtable' },
        { status: 400 }
      );
    }

    if (!event.is_draft) {
      return NextResponse.json(
        { success: false, error: 'Cannot sync submitted events. Event must be in draft state.' },
        { status: 400 }
      );
    }

    // Fetch Airtable records
    const records = await fetchAllAirtableRecords();
    const airtableEvents = detectEventsInRecords(records);

    // Find the corresponding Airtable event
    const airtableEvent = airtableEvents.find(
      e => e.eventId === event.airtable_event_id
    );

    if (!airtableEvent) {
      return NextResponse.json(
        { success: false, error: 'Airtable event not found' },
        { status: 404 }
      );
    }

    // Get attendance responses from Airtable
    const attendanceResponses = getAttendanceForEvent(records, airtableEvent);

    // Fetch existing attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, member_id, members(name)')
      .eq('event_id', eventId);

    if (attendanceError || !attendanceRecords) {
      throw new Error('Failed to fetch attendance records');
    }

    // Update each attendance record based on Airtable responses
    const updates = [];
    let updatedCount = 0;

    for (const record of attendanceRecords) {
      const memberName = (record.members as any)?.name;
      if (!memberName) continue;

      // Find matching Airtable response
      const airtableResponse = attendanceResponses.find(resp => {
        return (
          resp.person.toLowerCase() === memberName.toLowerCase() ||
          memberName.toLowerCase().includes(resp.person.toLowerCase()) ||
          resp.person.toLowerCase().includes(memberName.split(' ')[0].toLowerCase())
        );
      });

      let newStatus = 'absent'; // Default to absent
      let newNotes = null;

      if (airtableResponse) {
        const response = airtableResponse.response?.toLowerCase();

        if (response === 'no') {
          newStatus = 'excused_absent';
          newNotes = airtableResponse.notes || 'No reason provided';
        } else if (response === 'yes') {
          newStatus = 'present';
          newNotes = null;
        }
        // If no response yet, keep as absent (default)
      }

      // Update the attendance record
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          status: newStatus,
          notes: newNotes,
        })
        .eq('id', record.id);

      if (!updateError) {
        updatedCount++;
        if (newStatus === 'excused_absent') {
          updates.push({
            member: memberName,
            status: newStatus,
            notes: newNotes,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} attendance records`,
      data: {
        eventId,
        eventName: event.name,
        totalRecords: attendanceRecords.length,
        updatedRecords: updatedCount,
        excusedAbsences: updates.length,
        updates,
      },
    });
  } catch (error: any) {
    console.error('Error syncing Airtable responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync responses',
      },
      { status: 500 }
    );
  }
}
