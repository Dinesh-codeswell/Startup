-- =====================================================
-- FIX TEAM DELETION ENUM ISSUE
-- =====================================================
-- This script fixes the enum value mismatch that causes
-- "invalid input value for enum submission_status: 'pending'"
-- when deleting teams.

-- The issue: Some triggers try to set submission_status to 'pending'
-- but the enum only accepts 'pending_match', 'matched', 'team_formed', 'inactive'

-- =====================================================
-- STEP 1: FIX THE TRIGGER FUNCTION
-- =====================================================

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
          AND status != 'team_formed'; -- Only update if not already set
        
        RETURN NEW;
    END IF;
    
    -- When a team member is deleted, revert submission status
    IF TG_OP = 'DELETE' THEN
        -- Check if this submission is still part of any other team
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE submission_id = OLD.submission_id 
              AND team_id != OLD.team_id
        ) THEN
            -- If not part of any other team, revert status to 'pending_match' (NOT 'pending'!)
            UPDATE team_matching_submissions 
            SET status = 'pending_match'  -- FIXED: Use correct enum value
            WHERE id = OLD.submission_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: RECREATE THE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;

-- Create trigger on team_members table for both INSERT and DELETE
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

-- =====================================================
-- STEP 3: VERIFY ENUM VALUES
-- =====================================================

-- Show the correct enum values for reference
SELECT 
    'submission_status enum values:' as info,
    unnest(enum_range(NULL::submission_status)) as valid_values;

SELECT 
    'approval_status enum values:' as info,
    unnest(enum_range(NULL::approval_status)) as valid_values;

-- =====================================================
-- STEP 4: TEST THE FIX
-- =====================================================

-- Check current status distribution
SELECT 
    'Current submission status distribution:' as info,
    status,
    COUNT(*) as count
FROM team_matching_submissions 
GROUP BY status
ORDER BY status;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Team deletion enum issue fix completed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Fixed issues:';
    RAISE NOTICE '  - Trigger now uses "pending_match" instead of "pending"';
    RAISE NOTICE '  - Team deletion should now work without enum errors';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Valid submission_status enum values:';
    RAISE NOTICE '  - pending_match (for new submissions)';
    RAISE NOTICE '  - matched (when matched but team not formed)';
    RAISE NOTICE '  - team_formed (when added to a team)';
    RAISE NOTICE '  - inactive (when deactivated)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Valid approval_status enum values:';
    RAISE NOTICE '  - pending (awaiting approval)';
    RAISE NOTICE '  - approved (team approved)';
    RAISE NOTICE '  - rejected (team rejected)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 You can now delete teams without enum errors!';
END $$;