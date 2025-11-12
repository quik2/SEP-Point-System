-- Clear all rank changes (set to 0)
-- Run this in your Supabase SQL Editor

UPDATE members
SET rank_change = 0;

-- Verify all rank changes are cleared
SELECT name, points, rank_change
FROM members
ORDER BY points DESC, name ASC;
