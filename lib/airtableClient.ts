// Airtable API client for fetching event and attendance data

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME!;

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, any>;
}

export interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface AirtableEvent {
  eventId: string;  // e.g., "meeting_is_tonight_at_8pm_2025_11_13"
  eventName: string; // Parsed name e.g., "Meeting Is Tonight At 8pm"
  date: string; // e.g., "2025_11_13"
  questionColumn: string;
  responseColumn: string;
  notesColumn: string;
}

export interface AttendanceResponse {
  person: string;
  response: string | null; // "Yes", "No", or null
  notes: string | null;
}

/**
 * Fetch all records from Airtable table
 */
export async function fetchAllAirtableRecords(): Promise<AirtableRecord[]> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }

  const data: AirtableResponse = await response.json();
  return data.records;
}

/**
 * Parse event name from column name
 * Example: "meeting_is_tonight_at_8pm" → "Meeting Is Tonight At 8pm"
 */
export function parseEventName(eventId: string): string {
  // Remove date suffix (e.g., "_2025_11_13")
  const withoutDate = eventId.replace(/_\d{4}_\d{2}_\d{2}$/, '');

  // Split on underscore and capitalize each word
  return withoutDate
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract date from event ID
 * Example: "meeting_is_tonight_at_8pm_2025_11_13" → "2025-11-13"
 */
export function extractEventDate(eventId: string): string {
  const match = eventId.match(/_(\d{4})_(\d{2})_(\d{2})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return new Date().toISOString().split('T')[0]; // Default to today
}

/**
 * Detect all events in Airtable by scanning column names
 * Supports two patterns:
 * 1. Original: "{event_name}_Question_{YYYY_MM_DD}"
 * 2. Poll format: "POLL_Q_{id}" (e.g., "POLL_Q_2.3")
 */
export function detectEventsInRecords(records: AirtableRecord[]): AirtableEvent[] {
  if (records.length === 0) return [];

  // Get all column names from first record
  const sampleRecord = records[0];
  const columnNames = Object.keys(sampleRecord.fields);

  const events: AirtableEvent[] = [];

  // Pattern 1: Original format - columns ending with "_Question_{date}"
  const questionColumns = columnNames.filter(col =>
    col.match(/_Question_\d{4}_\d{2}_\d{2}$/)
  );

  questionColumns.forEach(questionCol => {
    const eventId = questionCol.replace(/_Question_\d{4}_\d{2}_\d{2}$/, '');
    const dateSuffix = questionCol.match(/_(\d{4}_\d{2}_\d{2})$/)?.[1] || '';
    const fullEventId = dateSuffix ? `${eventId}_${dateSuffix}` : eventId;

    events.push({
      eventId: fullEventId,
      eventName: parseEventName(eventId),
      date: extractEventDate(fullEventId),
      questionColumn: questionCol,
      responseColumn: questionCol.replace('_Question_', '_Response_'),
      notesColumn: questionCol.replace('_Question_', '_Notes_'),
    });
  });

  // Pattern 2: Poll format - columns starting with "POLL_Q_"
  const pollColumns = columnNames.filter(col =>
    col.match(/^POLL_Q_/)
  );

  pollColumns.forEach(pollCol => {
    const pollId = pollCol.replace(/^POLL_Q_/, '');
    const eventId = `POLL_${pollId}`;

    events.push({
      eventId: eventId,
      eventName: `Poll ${pollId}`,
      date: new Date().toISOString().split('T')[0], // Use current date
      questionColumn: pollCol,
      responseColumn: `POLL_R_${pollId}`,
      notesColumn: `POLL_N_${pollId}`,
    });
  });

  return events;
}

/**
 * Get attendance responses for a specific event
 */
export function getAttendanceForEvent(
  records: AirtableRecord[],
  event: AirtableEvent
): AttendanceResponse[] {
  return records
    .map(record => {
      const person = record.fields['Person'] as string;
      if (!person) return null;

      const response = record.fields[event.responseColumn] as string | undefined;
      const notes = record.fields[event.notesColumn] as string | undefined;

      return {
        person,
        response: response || null,
        notes: notes || null,
      };
    })
    .filter((r): r is AttendanceResponse => r !== null);
}

/**
 * Get all persons (unique names) from Airtable
 */
export function getAllPersons(records: AirtableRecord[]): string[] {
  const persons = records
    .map(r => r.fields['Person'] as string)
    .filter(Boolean);

  return Array.from(new Set(persons));
}
