-- FINAL SQL SETUP FOR SEP POINT SYSTEM
-- Run these commands in your Supabase SQL Editor in this exact order

-- ============================================
-- STEP 1: Update schema for new features
-- ============================================

-- Add support for draft events and custom event rules
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_rules JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS selected_members JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_reverted BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_draft ON events(is_draft);
CREATE INDEX IF NOT EXISTS idx_events_reverted ON events(is_reverted);

-- ============================================
-- STEP 2: Clear existing members and insert updated list
-- ============================================

-- Delete all existing members to start fresh
DELETE FROM members;

-- Insert all 48 active members (starting with 100 points each)
INSERT INTO members (name, points, status) VALUES
  ('Allie Young', 100, 'active'),
  ('Eden Tan', 100, 'active'),
  ('Lindsey Lee', 100, 'active'),
  ('Giancarlo Novelli', 100, 'active'),
  ('Jayson Tian', 100, 'active'),
  ('Mark Lin', 100, 'active'),
  ('Sean Chan', 100, 'active'),
  ('Sidney Muntean', 100, 'active'),
  ('Abby Kearny', 100, 'active'),
  ('Anish Thalamati', 100, 'active'),
  ('Anusha Chatterjee', 100, 'active'),
  ('Quinn Kiefer', 100, 'active'),
  ('Valerie Fan', 100, 'active'),
  ('Arushi Gupta', 100, 'active'),
  ('Mahi Ghia', 100, 'active'),
  ('Sophie Liu', 100, 'active'),
  ('Anirudh Chatterjee', 100, 'active'),
  ('Charlotte Chiang', 100, 'active'),
  ('Huixi Lee', 100, 'active'),
  ('Ash Barrett', 100, 'active'),
  ('Leilani Pradis', 100, 'active'),
  ('Ming Lo', 100, 'active'),
  ('Layla AlGhamdi', 100, 'active'),
  ('Brandon Bao', 100, 'active'),
  ('Dilnar Yu', 100, 'active'),
  ('Jonathan Gossaye', 100, 'active'),
  ('Elise Wu', 100, 'active'),
  ('Samantha Waugh', 100, 'active'),
  ('Natalie Tan', 100, 'active'),
  ('Yashas Shashidhara', 100, 'active'),
  ('Saathvik Pai', 100, 'active'),
  ('Kit He', 100, 'active'),
  ('Rahul Nanda', 100, 'active'),
  ('Sonali Vaid', 100, 'active'),
  ('Barima Adusei-Poku', 100, 'active'),
  ('Ruhaan Mahindru', 100, 'active'),
  ('Fiona Macleitch', 100, 'active'),
  ('Kera Chang', 100, 'active'),
  ('Sharan Subramanian', 100, 'active'),
  ('Kevin He', 100, 'active'),
  ('Armaan Bassi', 100, 'active'),
  ('Joanna Bui', 100, 'active'),
  ('Beck Peterson', 100, 'active'),
  ('Elijah Bautista', 100, 'active'),
  ('Joseph Wang', 100, 'active'),
  ('Gary Li', 100, 'active'),
  ('Edward Ke', 100, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Verify setup
-- ============================================

-- Check member count
SELECT COUNT(*) as total_active_members FROM members WHERE status = 'active';

-- You should see: total_active_members = 48

-- ============================================
-- DONE! Your database is ready to use.
-- ============================================
