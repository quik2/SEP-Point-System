-- Migration: Add Airtable integration support
-- Description: Adds columns and tables needed for real-time Airtable event syncing

-- 1. Add notes column to attendance_records table for storing excuse reasons
ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add airtable_event_id to events table for tracking which Airtable event this syncs with
ALTER TABLE events
ADD COLUMN IF NOT EXISTS airtable_event_id TEXT UNIQUE;

-- 3. Create airtable_member_mapping table for mapping Airtable person names to member IDs
CREATE TABLE IF NOT EXISTS airtable_member_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_person_name TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_airtable_member_mapping_person_name
ON airtable_member_mapping(airtable_person_name);

-- Create index for Airtable event ID lookups
CREATE INDEX IF NOT EXISTS idx_events_airtable_event_id
ON events(airtable_event_id) WHERE airtable_event_id IS NOT NULL;
