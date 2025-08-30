-- =====================================================
-- TEAM MATCHING SUBMISSIONS STATUS UPDATE TRIGGER
-- =====================================================
-- This script creates a trigger that automatically updates
-- team_matching_submissions status to 'team_formed' when
-- members are added to teams

-- =====================================================
-- TRIGGER FUNCTION FOR SUBMISSION STATUS UPDATE
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
            updated_at = NOW()
        WHERE id = NEW.submission_id
          AND status != 'team_formed'; -- Only update if not already set
        
        -- Log the status update
        RAISE NOTICE 'Updated submission % status to team_formed for team %', NEW.submission_id, NEW.team_id;
        
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
            -- If not part of any other team, revert status to 'pending'
            UPDATE team_matching_submissions 
            SET 
                status = 'pending',
                updated_at = NOW()
            WHERE id = OLD.submission_id;
            
            RAISE NOTICE 'Reverted submission % status to pending (removed from team %)', OLD.submission_id, OLD.team_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;

-- Create trigger on team_members table for both INSERT and DELETE
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

-- =====================================================
-- BATCH STATUS UPDATE FUNCTION
-- =====================================================
-- Function to update status for all existing team members
-- This can be called manually to fix existing data

CREATE OR REPLACE FUNCTION fix_existing_submission_statuses()
RETURNS TABLE(
    submission_id UUID,
    old_status TEXT,
    new_status TEXT,
    team_id UUID,
    updated BOOLEAN
) AS $$
DECLARE
    member_record RECORD;
BEGIN
    -- Loop through all team members and update their submission status
    FOR member_record IN 
        SELECT 
            tm.submission_id,
            tm.team_id,
            tms.status as current_status
        FROM team_members tm
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id
        WHERE tms.status != 'team_formed'
    LOOP
        BEGIN
            -- Update the submission status
            UPDATE team_matching_submissions 
            SET 
                status = 'team_formed',
                updated_at = NOW()
            WHERE id = member_record.submission_id;
            
            -- Return result
            submission_id := member_record.submission_id;
            old_status := member_record.current_status;
            new_status := 'team_formed';
            team_id := member_record.team_id;
            updated := TRUE;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Return error result
                submission_id := member_record.submission_id;
                old_status := member_record.current_status;
                new_status := 'error';
                team_id := member_record.team_id;
                updated := FALSE;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION update_submission_status_on_team_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_submission_statuses() TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to check submission statuses
/*
SELECT 
    tms.id as submission_id,
    tms.status,
    tms.name,
    tm.team_id,
    t.team_name
FROM team_matching_submissions tms
LEFT JOIN team_members tm ON tms.id = tm.submission_id
LEFT JOIN teams t ON tm.team_id = t.id
ORDER BY tms.created_at DESC;
*/

-- Query to find submissions that should be 'team_formed' but aren't
/*
SELECT 
    tms.id as submission_id,
    tms.status as current_status,
    tms.name,
    tm.team_id,
    t.team_name
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
JOIN teams t ON tm.team_id = t.id
WHERE tms.status != 'team_formed'
ORDER BY t.created_at DESC;
*/

-- Query to test the fix function
/*
SELECT * FROM fix_existing_submission_statuses();
*/

COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Submission Status Trigger Setup Complete!';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - trigger_update_submission_status (team_members table)';
    RAISE NOTICE 'Functions available:';
    RAISE NOTICE '  - update_submission_status_on_team_assignment()';
    RAISE NOTICE '  - fix_existing_submission_statuses()';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Submission status will now be automatically updated when:';
    RAISE NOTICE '  - Team members are added to teams (status -> team_formed)';
    RAISE NOTICE '  - Team members are removed from teams (status -> pending)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 To fix existing submission statuses, run:';
    RAISE NOTICE '  SELECT * FROM fix_existing_submission_statuses();';
END $$;