-- =====================================================
-- COMPLETE FIX FOR SUBMISSION STATUS AND TRIGGERS
-- =====================================================
-- This script provides a complete solution for:
-- 1. Installing missing triggers
-- 2. Fixing existing submission statuses
-- 3. Enabling automatic team analysis
-- 4. Verifying everything works

-- =====================================================
-- STEP 1: INSTALL SUBMISSION STATUS TRIGGER
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
            updated_at = NOW(),
            matched_at = COALESCE(matched_at, NOW())
        WHERE id = NEW.submission_id
          AND status != 'team_formed'; -- Only update if not already set
        
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;
DROP TRIGGER IF EXISTS update_submission_on_team_join ON team_members;

-- Create trigger on team_members table for both INSERT and DELETE
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

RAISE NOTICE '✅ Submission status trigger installed!';

-- =====================================================
-- STEP 2: FIX EXISTING SUBMISSION STATUSES
-- =====================================================

-- Function to fix existing submission statuses
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
                updated_at = NOW(),
                matched_at = COALESCE(matched_at, NOW())
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

-- Run the fix function
RAISE NOTICE '🔧 Fixing existing submission statuses...';
SELECT * FROM fix_existing_submission_statuses();

-- =====================================================
-- STEP 3: INSTALL TEAM ANALYSIS TRIGGER (IF FUNCTION EXISTS)
-- =====================================================

DO $$
BEGIN
    -- Check if team analysis function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_and_store_team_analysis') THEN
        
        -- Create team analysis trigger function
        CREATE OR REPLACE FUNCTION auto_calculate_team_analysis()
        RETURNS TRIGGER AS $trigger$
        DECLARE
            team_member_count INTEGER;
            analysis_id UUID;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                -- Check if the team has members with 'team_formed' status
                SELECT COUNT(*) INTO team_member_count
                FROM team_members tm
                JOIN team_matching_submissions tms ON tm.submission_id = tms.id
                WHERE tm.team_id = NEW.team_id
                  AND tms.status = 'team_formed';
                  
                -- Only calculate analysis if team has members
                IF team_member_count > 0 THEN
                    BEGIN
                        -- Calculate and store team analysis
                        SELECT calculate_and_store_team_analysis(NEW.team_id) INTO analysis_id;
                        
                        RAISE NOTICE 'Team analysis calculated for team_id: %, analysis_id: %', NEW.team_id, analysis_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE WARNING 'Failed to calculate team analysis for team_id: %. Error: %', NEW.team_id, SQLERRM;
                    END;
                END IF;
            END IF;
            
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS trigger_auto_team_analysis ON team_members;
        
        -- Create trigger to calculate team analysis
        CREATE TRIGGER trigger_auto_team_analysis
            AFTER INSERT ON team_members
            FOR EACH ROW
            EXECUTE FUNCTION auto_calculate_team_analysis();
            
        RAISE NOTICE '✅ Team analysis trigger installed!';
        
        -- Try to recalculate existing team analysis
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalculate_all_team_analysis') THEN
            RAISE NOTICE '🔄 Running team analysis recalculation...';
            PERFORM recalculate_all_team_analysis();
            RAISE NOTICE '✅ Team analysis recalculation completed!';
        END IF;
        
    ELSE
        RAISE NOTICE '⚠️  Team analysis function not found. Skipping team analysis trigger installation.';
        RAISE NOTICE 'To enable automatic team analysis, run: scripts/create-team-strengths-analysis-table.sql';
    END IF;
END $$;

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION update_submission_status_on_team_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_submission_statuses() TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_calculate_team_analysis') THEN
        GRANT EXECUTE ON FUNCTION auto_calculate_team_analysis() TO authenticated;
    END IF;
END $$;

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Check triggers
SELECT 
    '🔍 Checking installed triggers...' as step;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%submission%' OR trigger_name LIKE '%team_analysis%'
  AND event_object_table = 'team_members';

-- Check submission statuses
SELECT 
    '📊 Current submission status distribution:' as step;

SELECT 
    status,
    COUNT(*) as count
FROM team_matching_submissions
GROUP BY status
ORDER BY count DESC;

-- Check teams ready for analysis
SELECT 
    '🎯 Teams ready for analysis:' as step;

SELECT 
    t.team_name,
    COUNT(tm.submission_id) as member_count,
    COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END) as team_formed_count,
    CASE 
        WHEN COUNT(tm.submission_id) = COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END) 
        THEN '✅ Ready'
        ELSE '❌ Status mismatch'
    END as status
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
WHERE t.status = 'active'
GROUP BY t.id, t.team_name
ORDER BY t.created_at DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETE FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Submission status trigger installed';
    RAISE NOTICE '✅ Existing submission statuses fixed';
    RAISE NOTICE '✅ Team analysis trigger installed (if function available)';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 From now on:';
    RAISE NOTICE '  • New team members will automatically update submission status';
    RAISE NOTICE '  • Team analysis will be calculated automatically (if enabled)';
    RAISE NOTICE '  • Recalculation functions should work properly';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your admin dashboard team formation should now work correctly!';
END $$;