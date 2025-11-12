-- Reset all members back to 100 points and clear rank changes
-- Run this in your Supabase SQL Editor

UPDATE members
SET
  points = 100,
  rank_change = 0
WHERE status = 'active';

-- Verify the reset
SELECT name, points, rank_change, status
FROM members
ORDER BY name;

-- Optionally, also clear all event and point history (UNCOMMENT if you want to delete everything)
-- DELETE FROM point_history;
-- DELETE FROM attendance_records;
-- DELETE FROM events;
