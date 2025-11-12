-- SEP Point System Database Schema
-- Run this in your Supabase SQL Editor

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  rank_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused_absent', 'excused_late', 'inactive')),
  points_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Point history table
CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  new_total INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_points ON members(points DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_point_history_member ON point_history(member_id);
CREATE INDEX IF NOT EXISTS idx_point_history_timestamp ON point_history(timestamp DESC);

-- Function to update member's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial members (all start with 100 points)
INSERT INTO members (name, status) VALUES
  ('Allie Young', 'active'),
  ('Eden Tant', 'active'),
  ('Lindsey Lee', 'active'),
  ('Clinton Valencia', 'inactive'),
  ('Giancarlo Novelli', 'active'),
  ('Jayson Tian', 'active'),
  ('Mark Lin', 'active'),
  ('Sean Chan', 'active'),
  ('Sidney Muntean', 'active'),
  ('Abby Kearny', 'active'),
  ('Anish Thalamati', 'active'),
  ('Anusha Chatterjee', 'active'),
  ('Franco Cachay', 'inactive'),
  ('Kareena Gupta', 'active'),
  ('Sofia Barajas', 'inactive'),
  ('Theo Luu', 'inactive'),
  ('Tushaar Mohta', 'inactive'),
  ('Valerie Fan', 'active'),
  ('Arushi Gupta', 'active'),
  ('Mahi Ghia', 'active'),
  ('Sophie Liu', 'active'),
  ('Anirudh Chatterjee', 'active'),
  ('Annika Danne', 'inactive'),
  ('Charlotte Chiang', 'active'),
  ('Ash Barrett', 'active'),
  ('Leilani Pradis', 'active'),
  ('Ming Lo', 'active'),
  ('Layla AlGhamdi', 'active'),
  ('Cheryl Wu', 'inactive'),
  ('Huixi Lee', 'active'),
  ('Martinez', 'inactive'),
  ('Quinn Kiefer', 'active')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to members (for leaderboard)
CREATE POLICY "Allow public read access to members"
  ON members FOR SELECT
  USING (true);

-- Allow public read access to point history
CREATE POLICY "Allow public read access to point history"
  ON point_history FOR SELECT
  USING (true);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything on members"
  ON members FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on events"
  ON events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on attendance"
  ON attendance_records FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on history"
  ON point_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON members TO anon;
GRANT SELECT ON point_history TO anon;
