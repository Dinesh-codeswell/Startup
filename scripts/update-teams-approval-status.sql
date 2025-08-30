-- =====================================================
-- UPDATE EXISTING TEAMS APPROVAL STATUS
-- =====================================================
-- This script updates all existing teams with 'pending' approval_status to 'team_formed'
-- since teams that are already created and in use should be considered as formed teams

-- Update existing teams from 'pending' to 'team_formed'
UPDATE teams 
SET 
  approval_status = 'team_formed',
  updated_at = NOW()
WHERE approval_status = 'pending';

-- Display the number of updated teams
SELECT 
  COUNT(*) as teams_updated,
  'Teams approval status updated from pending to team_formed' as message
FROM teams 
WHERE approval_status = 'team_formed';

-- Verify the update by showing current approval status distribution
SELECT 
  approval_status,
  COUNT(*) as team_count
FROM teams 
GROUP BY approval_status
ORDER BY approval_status;