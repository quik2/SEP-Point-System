# Airtable Integration - Setup & Usage Guide

## Overview

This integration automatically syncs events from your Airtable to the SEP Point System admin dashboard, creating draft events with real-time attendance updates as responses flow in.

## Setup Instructions

### Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mxhswvqdxjqzrkjtyrpf
2. Click **"SQL Editor"** in the left sidebar
3. Open `/migrations/add-airtable-integration.sql` from this project
4. Copy and paste the entire SQL code into the editor
5. Click **"Run"** to execute the migration

This will:
- Add `notes` column to `attendance_records` table for storing excuses
- Add `airtable_event_id` to `events` table for tracking synced events
- Create `airtable_member_mapping` table for name matching

### Step 2: Test the Integration

#### Option A: Using curl (Command Line)

1. **Detect new events in Airtable:**
   ```bash
   curl http://localhost:3000/api/airtable/detect-events
   ```

2. **Create draft for the 2025_11_13 meeting:**
   ```bash
   curl -X POST http://localhost:3000/api/airtable/create-draft \
     -H "Content-Type: application/json" \
     -d '{"eventId": "meeting_is_tonight_at_8pm_2025_11_13"}'
   ```

3. **Sync latest responses for an event:**
   ```bash
   curl -X POST http://localhost:3000/api/airtable/sync-responses \
     -H "Content-Type: application/json" \
     -d '{"eventId": "YOUR_EVENT_ID_HERE"}'
   ```

#### Option B: Using the Browser

1. Open http://localhost:3000/api/airtable/detect-events in your browser
2. You'll see a JSON response with all detected events
3. Note the `eventId` for the event you want to create
4. Use a tool like Postman or the browser console to make POST requests

## How It Works

### Event Detection

The system scans your Airtable for column patterns like:
- `{event_name}_Question_{date}`
- `{event_name}_Response_{date}`
- `{event_name}_Notes_{date}`

Example: `meeting_is_tonight_at_8pm_Question_2025_11_13`

### Draft Creation

When you create a draft from an Airtable event:

1. Event name is parsed from the column name
   - `meeting_is_tonight_at_8pm` → "Meeting Is Tonight At 8pm"

2. All active members are initialized as "Present"

3. Members who responded "No" are marked as "Excused Absent"
   - Their excuse/reason is pulled from the Notes column

4. Event stays in **draft state** until you manually submit it

### Real-Time Sync

While an event is in draft state:

1. As people respond to the Airtable form, their responses update
2. Call `/api/airtable/sync-responses` with the event ID to refresh
3. New "No" responses will be added as excused absences
4. Notes/excuses are automatically populated

### Name Matching

The system flexibly matches Airtable person names to members:
- Case-insensitive matching
- Partial name matching (e.g., "quinn" → "Quinn Kiefer")
- First name matching (e.g., "Ash" → "Ash Barrett")
- Automatic mapping table creation for faster future lookups

## API Endpoints

### GET /api/airtable/detect-events

Scans Airtable and returns all events not yet synced.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "new": 1,
    "events": [
      {
        "eventId": "meeting_is_tonight_at_8pm_2025_11_13",
        "eventName": "Meeting Is Tonight At 8pm",
        "date": "2025-11-13",
        "questionColumn": "meeting_is_tonight_at_8pm_Question_2025_11_13",
        "responseColumn": "meeting_is_tonight_at_8pm_Response_2025_11_13",
        "notesColumn": "meeting_is_tonight_at_8pm_Notes_2025_11_13"
      }
    ]
  }
}
```

### POST /api/airtable/create-draft

Creates a draft event from an Airtable event.

**Request Body:**
```json
{
  "eventId": "meeting_is_tonight_at_8pm_2025_11_13"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Draft event 'Meeting Is Tonight At 8pm' created successfully",
  "data": {
    "eventId": "uuid-here",
    "airtableEventId": "meeting_is_tonight_at_8pm_2025_11_13",
    "name": "Meeting Is Tonight At 8pm",
    "date": "2025-11-13",
    "attendanceCount": 48,
    "excusedAbsences": 2
  }
}
```

### POST /api/airtable/sync-responses

Syncs latest responses from Airtable for a draft event.

**Request Body:**
```json
{
  "eventId": "uuid-of-your-event"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 48 attendance records",
  "data": {
    "eventId": "uuid-here",
    "eventName": "Meeting Is Tonight At 8pm",
    "totalRecords": 48,
    "updatedRecords": 48,
    "excusedAbsences": 2,
    "updates": [
      {
        "member": "Sonali Patel",
        "status": "excused_absent",
        "notes": "have a midterm i need to cram for"
      }
    ]
  }
}
```

## Admin Dashboard Changes

### New Features

1. **Notes/Excuse Column**: A new column appears in the attendance table
   - Only shows for "Excused Absent" and "Excused Late" statuses
   - Text input field to enter or edit excuses
   - Auto-populated from Airtable sync

2. **Airtable-Linked Events**: Events created from Airtable are tagged
   - Draft events can be synced with latest responses
   - Submit when ready to apply points

## Workflow Example

1. **Event Created in Airtable**: You send out a meeting attendance question
2. **Detect Event**: System finds the new event columns
3. **Create Draft**: Create draft event via API
   - All members start as "Present"
   - People who said "No" are "Excused Absent" with their excuse

4. **Responses Flow In**: As people respond throughout the day
   - Call sync endpoint to update draft
   - New excuses are added

5. **Review & Submit**: When ready
   - Go to Admin Dashboard
   - Review all excuses
   - Manually change status if excuse is invalid
   - Submit event to apply points

## Troubleshooting

### "Event already exists" error
The event has already been synced. Check the admin dashboard for existing drafts.

### Names not matching
If Airtable person names don't match member names:
1. Check the `airtable_member_mapping` table in Supabase
2. Manually add mappings if needed
3. Or update member names to match Airtable format

### No excuses showing
Make sure:
1. The Notes column exists in Airtable
2. The migration was run successfully
3. The notes field is populated in Airtable

## Next Steps

### Automatic Polling (Future Enhancement)

To make this fully automatic, you could:

1. Add a server-side cron job that runs every 10 minutes
2. Automatically detect new events and create drafts
3. Auto-sync responses for all draft events
4. Notify you when new events are ready for review

For now, you can manually trigger the API endpoints as needed.

---

**Questions?** Check the code in:
- `/lib/airtableClient.ts` - Airtable API logic
- `/lib/airtableMapping.ts` - Name matching logic
- `/app/api/airtable/*` - API endpoints
- `/components/AttendanceGrid.tsx` - Admin UI with notes field
