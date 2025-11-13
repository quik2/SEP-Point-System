import { NextResponse } from 'next/server';
import { fetchAllAirtableRecords, detectEventsInRecords } from '@/lib/airtableClient';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * GET /api/airtable/detect-events
 *
 * Scans Airtable for new events and returns ones not yet synced
 */
export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // Fetch all records from Airtable
    const records = await fetchAllAirtableRecords();

    // Detect all events in the records
    const detectedEvents = detectEventsInRecords(records);

    // Fetch existing Airtable event IDs from our database
    const { data: existingEvents } = await supabase
      .from('events')
      .select('airtable_event_id')
      .not('airtable_event_id', 'is', null);

    const existingEventIds = new Set(
      existingEvents?.map(e => e.airtable_event_id) || []
    );

    // Filter out events that are already synced
    const newEvents = detectedEvents.filter(
      event => !existingEventIds.has(event.eventId)
    );

    return NextResponse.json({
      success: true,
      data: {
        total: detectedEvents.length,
        new: newEvents.length,
        events: newEvents,
      },
    });
  } catch (error: any) {
    console.error('Error detecting Airtable events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to detect events',
      },
      { status: 500 }
    );
  }
}
