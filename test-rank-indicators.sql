-- TESTING RANK CHANGE INDICATORS
-- Run this AFTER you've inserted all members and want to test the arrows

-- Set some example rank changes so you can see the arrows working
-- (These are just examples - in real use, the system calculates these automatically)

-- Give Quinn a positive rank change (moved up 3 positions)
UPDATE members SET rank_change = 3 WHERE name = 'Quinn Kiefer';

-- Give someone a negative rank change (dropped 2 positions)
UPDATE members SET rank_change = -2 WHERE name = 'Valerie Fan';

-- Give Mahi a positive change
UPDATE members SET rank_change = 1 WHERE name = 'Mahi Ghia';

-- Give someone else a drop
UPDATE members SET rank_change = -1 WHERE name = 'Jayson Tian';

-- Check the results
SELECT name, points, rank_change FROM members WHERE rank_change != 0 ORDER BY points DESC;

-- Now refresh the leaderboard and you should see:
-- - Green ▲ with numbers for members with positive rank_change
-- - Red ▼ with numbers for members with negative rank_change
