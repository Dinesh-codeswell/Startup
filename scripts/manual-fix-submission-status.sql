-- =====================================================
-- MANUAL FIX FOR SUBMISSION STATUS ISSUE
-- =====================================================
-- This script fixes the issue where team_matching_submissions
-- status remains "pending_match" instead of "team_formed"
-- when teams are created through the admin dashboard.
--
-- INSTRUCTIONS:
-- 1. Copy and paste this entire script into Supabase SQL Editor
-- 2. Run the script
-- 3. Verify the results
-- =====================================================

-- Step 1: Check current status distribution
SELECT 
  'BEFORE FIX - Current Status Distribution' as step,
  status,
  COUNT(*) as count
FROM team_matching_submissions 
GROUP BY status
ORDER BY status;

-- Step 2: Show submissions that need fixing
SELECT 
  'SUBMISSIONS NEEDING FIX' as step,
  tms.full_name,
  tms.status as current_status,
  t.team_name,
  t.id as team_id
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
JOIN teams t ON tm.team_id = t.id
WHERE tms.status != 'team_formed'
ORDER BY t.team_name, tms.full_name;

-- Step 3: Temporarily disable the problematic trigger
DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;

-- Step 4: Update submission statuses to 'team_formed' for all submissions that have team members
UPDATE team_matching_submissions 
SET 
  status = 'team_formed',
  matched_at = COALESCE(matched_at, NOW())
WHERE id IN (
  SELECT DISTINCT tm.submission_id 
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tms.status != 'team_formed'
);

-- Step 5: Show the update results
SELECT 
  'UPDATE RESULTS' as step,
  tms.full_name,
  tms.status as new_status,
  t.team_name,
  tms.matched_at
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
JOIN teams t ON tm.team_id = t.id
WHERE tms.status = 'team_formed'
ORDER BY t.team_name, tms.full_name;

-- Step 6: Recreate the trigger with a safer version
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Safely update the updated_at column
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_team_matching_submissions_updated_at
  BEFORE UPDATE ON team_matching_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Install the proper trigger for automatic status updates on team formation
CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- When a team member is inserted, update the corresponding submission status
    IF TG_OP = 'INSERT' THEN
        -- Update the submission status to 'team_formed'
        UPDATE team_matching_submissions 
        SET 
            status = 'team_formed',
            matched_at = COALESCE(matched_at, NOW())
        WHERE id = NEW.submission_id
          AND status != 'team_formed';
        
        RETURN NEW;
    END IF;
    
    -- When a team member is deleted, optionally revert submission status
    IF TG_OP = 'DELETE' THEN
        -- Check if this submission is still part of any other team
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE submission_id = OLD.submission_id 
              AND team_id != OLD.team_id
        ) THEN
            -- If not part of any other team, revert status to 'pending_match'
            UPDATE team_matching_submissions 
            SET status = 'pending_match'
            WHERE id = OLD.submission_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;

-- Create trigger on team_members table for both INSERT and DELETE
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

-- Step 8: Final verification - Check status distribution after fix
SELECT 
  'AFTER FIX - Final Status Distribution' as step,
  status,
  COUNT(*) as count
FROM team_matching_submissions 
GROUP BY status
ORDER BY status;

-- Step 9: Verify that all team members have 'team_formed' status
SELECT 
  'VERIFICATION - Team Members with Correct Status' as step,
  COUNT(*) as total_team_members,
  COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END) as team_formed_status,
  COUNT(CASE WHEN tms.status != 'team_formed' THEN 1 END) as incorrect_status
FROM team_members tm
JOIN team_matching_submissions tms ON tm.submission_id = tms.id;

-- Step 10: Show any remaining issues (should be empty)
SELECT 
  'REMAINING ISSUES (should be empty)' as step,
  tms.full_name,
  tms.status as current_status,
  t.team_name
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
JOIN teams t ON tm.team_id = t.id
WHERE tms.status != 'team_formed'
ORDER BY t.team_name, tms.full_name;

-- Success message
SELECT 
  'SUCCESS!' as step,
  'Submission status fix completed. Team analysis recalculation should now work properly.' as message;