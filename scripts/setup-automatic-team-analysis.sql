-- =====================================================
-- COMPLETE AUTOMATIC TEAM ANALYSIS SETUP
-- =====================================================
-- This script sets up automatic team strength analysis calculation
-- when teams are created and members are added.
--
-- IMPORTANT: Run this script in Supabase SQL Editor
-- Make sure to run the create-team-strengths-analysis-table.sql first
-- if you haven't already done so.
--
-- This script will:
-- 1. Create trigger functions for automatic analysis calculation
-- 2. Create triggers on team_members table
-- 3. Update submission statuses automatically
-- 4. Provide utility functions for manual recalculation
-- =====================================================

-- Check if required functions exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_and_store_team_analysis') THEN
        RAISE EXCEPTION 'Required function calculate_and_store_team_analysis() not found. Please run create-team-strengths-analysis-table.sql first.';
    END IF;
    
    RAISE NOTICE '✅ Required functions found. Proceeding with trigger setup...';
END $$;

-- =====================================================
-- 1. SUBMISSION STATUS UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update the submission status to 'team_formed'
        UPDATE team_matching_submissions 
        SET 
            status = 'team_formed',
            updated_at = NOW()
        WHERE id = NEW.submission_id
          AND status != 'team_formed';
        
        RETURN NEW;
    END IF;
    
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
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TEAM ANALYSIS CALCULATION TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION auto_calculate_team_analysis()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. DROP EXISTING TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;
DROP TRIGGER IF EXISTS trigger_auto_team_analysis ON team_members;
DROP TRIGGER IF EXISTS trigger_team_analysis_on_member_insert ON team_members;

-- =====================================================
-- 4. CREATE NEW TRIGGERS
-- =====================================================

-- Trigger to update submission status (runs first)
CREATE TRIGGER trigger_update_submission_status
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status_on_team_assignment();

-- Trigger to calculate team analysis (runs after status update)
CREATE TRIGGER trigger_auto_team_analysis
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_team_analysis();

-- =====================================================
-- 5. UTILITY FUNCTIONS
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
            UPDATE team_matching_submissions 
            SET 
                status = 'team_formed',
                updated_at = NOW()
            WHERE id = member_record.submission_id;
            
            submission_id := member_record.submission_id;
            old_status := member_record.current_status;
            new_status := 'team_formed';
            team_id := member_record.team_id;
            updated := TRUE;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
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

-- Function to recalculate analysis for all teams
-- Drop existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS recalculate_all_team_analysis();

CREATE OR REPLACE FUNCTION recalculate_all_team_analysis()
RETURNS TABLE(
    team_id UUID,
    team_name TEXT,
    analysis_id UUID,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    team_record RECORD;
    calc_analysis_id UUID;
BEGIN
    FOR team_record IN 
        SELECT DISTINCT t.id as team_id, t.team_name
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE t.status = 'active'
    LOOP
        BEGIN
            SELECT calculate_and_store_team_analysis(team_record.team_id) INTO calc_analysis_id;
            
            team_id := team_record.team_id;
            team_name := team_record.team_name;
            analysis_id := calc_analysis_id;
            success := TRUE;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                team_id := team_record.team_id;
                team_name := team_record.team_name;
                analysis_id := NULL;
                success := FALSE;
                error_message := SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION update_submission_status_on_team_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_calculate_team_analysis() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_submission_statuses() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;

-- =====================================================
-- 7. VERIFICATION AND SETUP COMPLETION
-- =====================================================

-- Check trigger creation
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name IN ('trigger_update_submission_status', 'trigger_auto_team_analysis')
      AND event_object_table = 'team_members';
    
    IF trigger_count = 2 THEN
        RAISE NOTICE '✅ All triggers created successfully!';
    ELSE
        RAISE WARNING '⚠️  Expected 2 triggers, found %', trigger_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- COMPLETION MESSAGE AND INSTRUCTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AUTOMATIC TEAM ANALYSIS SETUP COMPLETE!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What was set up:';
    RAISE NOTICE '  • Automatic submission status updates (pending → team_formed)';
    RAISE NOTICE '  • Automatic team strength analysis calculation';
    RAISE NOTICE '  • Triggers on team_members table for both functions';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Automatic triggers will now run when:';
    RAISE NOTICE '  • New team members are added to any team';
    RAISE NOTICE '  • Team members are removed from teams';
    RAISE NOTICE '';
    RAISE NOTICE '🛠️  To fix existing data, run these commands:';
    RAISE NOTICE '  1. Fix submission statuses:';
    RAISE NOTICE '     SELECT * FROM fix_existing_submission_statuses();';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Recalculate all team analysis:';
    RAISE NOTICE '     SELECT * FROM recalculate_all_team_analysis();';
    RAISE NOTICE '';
    RAISE NOTICE '📊 To verify the setup:';
    RAISE NOTICE '  • Check team analysis data:';
    RAISE NOTICE '    SELECT t.team_name, tsa.complementarity_score, tsa.consulting_coverage';
    RAISE NOTICE '    FROM teams t LEFT JOIN team_strengths_analysis tsa ON t.id = tsa.team_id;';
    RAISE NOTICE '';
    RAISE NOTICE '  • Check submission statuses:';
    RAISE NOTICE '    SELECT tms.name, tms.status, t.team_name';
    RAISE NOTICE '    FROM team_matching_submissions tms';
    RAISE NOTICE '    LEFT JOIN team_members tm ON tms.id = tm.submission_id';
    RAISE NOTICE '    LEFT JOIN teams t ON tm.team_id = t.id;';
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
END $$;