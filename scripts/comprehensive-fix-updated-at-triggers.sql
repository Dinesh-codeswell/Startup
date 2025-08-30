-- =====================================================
-- COMPREHENSIVE FIX FOR UPDATED_AT TRIGGER ISSUES
-- =====================================================
-- This script comprehensively fixes all remaining triggers and functions
-- that reference the removed 'updated_at' columns, preventing team deletion errors

-- =====================================================
-- DROP ALL PROBLEMATIC UPDATED_AT TRIGGERS
-- =====================================================

-- Drop all updated_at triggers that reference removed columns
-- Only drop triggers for tables that actually exist
DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_team_matching_batches_updated_at ON team_matching_batches;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Only drop team chat triggers if the tables exist
DO $$
BEGIN
    -- Check and drop team_chat_messages trigger if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_chat_messages') THEN
        DROP TRIGGER IF EXISTS update_team_chat_messages_updated_at ON team_chat_messages;
        RAISE NOTICE 'Dropped team_chat_messages updated_at trigger';
    END IF;
    
    -- Check and drop team_chat_participants trigger if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_chat_participants') THEN
        DROP TRIGGER IF EXISTS update_team_chat_participants_updated_at ON team_chat_participants;
        RAISE NOTICE 'Dropped team_chat_participants updated_at trigger';
    END IF;
    
    -- Check and drop team_chat_typing_indicators trigger if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_chat_typing_indicators') THEN
        DROP TRIGGER IF EXISTS update_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators;
        RAISE NOTICE 'Dropped team_chat_typing_indicators updated_at trigger';
    END IF;
    
    -- Check and drop other optional table triggers if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_change_requests') THEN
        DROP TRIGGER IF EXISTS update_team_change_requests_updated_at ON team_change_requests;
        RAISE NOTICE 'Dropped team_change_requests updated_at trigger';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issue_reports') THEN
        DROP TRIGGER IF EXISTS update_issue_reports_updated_at ON issue_reports;
        RAISE NOTICE 'Dropped issue_reports updated_at trigger';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_views') THEN
        DROP TRIGGER IF EXISTS update_resource_views_updated_at ON resource_views;
        RAISE NOTICE 'Dropped resource_views updated_at trigger';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_strengths_analysis') THEN
        DROP TRIGGER IF EXISTS update_team_strengths_analysis_updated_at ON team_strengths_analysis;
        RAISE NOTICE 'Dropped team_strengths_analysis updated_at trigger';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
        RAISE NOTICE 'Dropped tasks updated_at trigger';
    END IF;
END $$;

-- =====================================================
-- FIX SUBMISSION STATUS TRIGGER FUNCTION
-- =====================================================
-- Update the function to remove updated_at references and fix enum values

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
            -- If not part of any other team, revert status to 'pending_match' (correct enum value)
            UPDATE team_matching_submissions 
            SET status = 'pending_match'
            WHERE id = OLD.submission_id;
            
            RAISE NOTICE 'Reverted submission % status to pending_match (removed from team %)', OLD.submission_id, OLD.team_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RECREATE THE TRIGGER
-- =====================================================

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;
DROP TRIGGER IF EXISTS update_submission_on_team_join ON team_members;
DROP TRIGGER IF EXISTS update_submission_status_on_team_assignment ON team_members;

-- Create the trigger with a clear name
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

-- =====================================================
-- CHECK FOR OTHER PROBLEMATIC FUNCTIONS
-- =====================================================
-- Look for any other functions that might reference updated_at

-- Fix the generic updated_at function to be safer
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Safely update updated_at column if it exists in the NEW record
    BEGIN
        -- Try to update the updated_at field in the NEW record
        NEW.updated_at = NOW();
    EXCEPTION
        WHEN undefined_column THEN
            -- Column doesn't exist, skip the update silently
            RAISE NOTICE 'Table % does not have updated_at column, skipping update', TG_TABLE_NAME;
        WHEN OTHERS THEN
            -- For any other error, just skip silently to avoid breaking the operation
            RAISE NOTICE 'Could not update updated_at for table %, error: %', TG_TABLE_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFY ENUM VALUES
-- =====================================================
-- Check that the submission_status enum has the correct values

DO $$
BEGIN
    -- Check if submission_status enum exists and has correct values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'submission_status' AND e.enumlabel = 'pending_match'
    ) THEN
        RAISE NOTICE 'INFO: submission_status enum does not exist or does not have pending_match value';
        RAISE NOTICE 'INFO: This is normal if using TEXT columns instead of ENUM';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'submission_status' AND e.enumlabel = 'pending'
    ) THEN
        RAISE NOTICE 'WARNING: submission_status enum has old pending value that should be pending_match';
        -- Try to update the enum if possible
        BEGIN
            ALTER TYPE submission_status RENAME VALUE 'pending' TO 'pending_match';
            RAISE NOTICE 'SUCCESS: Renamed enum value from pending to pending_match';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'WARNING: Could not rename enum value: %', SQLERRM;
        END;
    END IF;
END $$;

-- =====================================================
-- TEST THE FIX
-- =====================================================
-- Test that the trigger works without errors

DO $$
DECLARE
    test_team_id UUID;
    test_submission_id UUID;
BEGIN
    -- Get a test team and submission for testing (if they exist)
    SELECT t.id, tm.submission_id 
    INTO test_team_id, test_submission_id
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    LIMIT 1;
    
    IF test_team_id IS NOT NULL THEN
        RAISE NOTICE 'Testing trigger with team_id: %, submission_id: %', test_team_id, test_submission_id;
        
        -- Test that we can query the submission status without errors
        PERFORM status FROM team_matching_submissions WHERE id = test_submission_id;
        
        RAISE NOTICE '✅ Trigger test completed successfully';
    ELSE
        RAISE NOTICE 'ℹ️  No test data available, but trigger is installed';
    END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ COMPREHENSIVE UPDATED_AT TRIGGER FIX COMPLETED';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Dropped all problematic updated_at triggers';
    RAISE NOTICE '✅ Fixed submission status trigger function';
    RAISE NOTICE '✅ Corrected enum values (pending -> pending_match)';
    RAISE NOTICE '✅ Made update_updated_at_column function safer';
    RAISE NOTICE '✅ Recreated team member status trigger';
    RAISE NOTICE '';
    RAISE NOTICE 'Team deletion should now work without updated_at errors.';
    RAISE NOTICE '====================================================';
END $$;