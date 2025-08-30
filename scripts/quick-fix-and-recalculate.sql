-- =====================================================
-- QUICK FIX AND RECALCULATE SCRIPT
-- =====================================================
-- This script fixes the function error and recalculates
-- team analysis for all existing teams

-- Step 1: Drop and recreate the function
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
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id
        WHERE t.status = 'active'
          AND tms.status = 'team_formed'
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

-- Step 2: Fix submission statuses first
DROP FUNCTION IF EXISTS fix_existing_submission_statuses();

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_submission_statuses() TO authenticated;

-- Step 3: Execute the fixes
DO $$
DECLARE
    fix_result RECORD;
    calc_result RECORD;
    fix_count INTEGER := 0;
    calc_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Starting data fix and recalculation...';
    RAISE NOTICE '';
    
    -- Fix submission statuses
    RAISE NOTICE '📝 Fixing submission statuses...';
    FOR fix_result IN SELECT * FROM fix_existing_submission_statuses() LOOP
        fix_count := fix_count + 1;
        IF fix_result.updated THEN
            RAISE NOTICE 'Fixed submission % (% → %)', fix_result.submission_id, fix_result.old_status, fix_result.new_status;
        ELSE
            RAISE WARNING 'Failed to fix submission %', fix_result.submission_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Recalculating team analysis...';
    
    -- Recalculate team analysis
    FOR calc_result IN SELECT * FROM recalculate_all_team_analysis() LOOP
        calc_count := calc_count + 1;
        IF calc_result.success THEN
            success_count := success_count + 1;
            RAISE NOTICE 'Calculated analysis for team: % (ID: %)', calc_result.team_name, calc_result.analysis_id;
        ELSE
            RAISE WARNING 'Failed to calculate analysis for team: % - %', calc_result.team_name, calc_result.error_message;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUMMARY:';
    RAISE NOTICE '  - Submission status fixes: %', fix_count;
    RAISE NOTICE '  - Teams processed: %', calc_count;
    RAISE NOTICE '  - Successful calculations: %', success_count;
    RAISE NOTICE '';
    
    IF success_count > 0 THEN
        RAISE NOTICE '🎉 Team analysis recalculation completed successfully!';
        RAISE NOTICE 'You can now check the results in your dashboard.';
    ELSE
        RAISE WARNING '⚠️  No teams were successfully processed. Check the error messages above.';
    END IF;
END $$;

COMMIT;