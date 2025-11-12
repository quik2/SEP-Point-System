-- Add support for draft events and custom event rules
-- Run this in your Supabase SQL Editor

-- Add columns to events table for draft support and custom rules
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_rules JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS selected_members JSONB;

-- Create index for draft events
CREATE INDEX IF NOT EXISTS idx_events_draft ON events(is_draft);

-- Add a column to track if an event has been reverted
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_reverted BOOLEAN DEFAULT false;
