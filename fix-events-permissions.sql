-- FIX: Allow read access to events table
-- The events table has RLS enabled but no read policy for anon users

-- Allow public read access to events (for event history display)
CREATE POLICY "Allow public read access to events"
  ON events FOR SELECT
  USING (true);

-- Also allow anon to read attendance_records (might be needed later)
CREATE POLICY "Allow public read access to attendance_records"
  ON attendance_records FOR SELECT
  USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('events', 'attendance_records');
