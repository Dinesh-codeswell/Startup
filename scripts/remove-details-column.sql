-- =====================================================
-- REMOVE DETAILS COLUMN FROM TEAM_CHANGE_REQUESTS TABLE
-- This script removes the 'details' column from the team_change_requests table
-- to simplify the team change request form to only include the reason field
-- =====================================================

-- Remove the details column from team_change_requests table
ALTER TABLE team_change_requests DROP COLUMN IF EXISTS details;

-- Verify the column has been removed (optional - for confirmation)
-- You can run this query after the ALTER statement to confirm the column is gone:
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'team_change_requests' 
-- AND table_schema = 'public';

-- Note: This operation is irreversible. Make sure to backup your data if needed.
-- All existing data in the 'details' column will be permanently lost.