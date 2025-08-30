-- =====================================================
-- DIAGNOSE AND FIX TEAM ANALYSIS RECALCULATION
-- =====================================================
-- This script diagnoses why team analysis isn't being calculated
-- and provides a corrected recalculation function

-- Step 1: Diagnostic queries to understand the issue
DO $$
DECLARE
    team_count INTEGER;
    member_count INTEGER;
    formed_submission_count INTEGER;
    analysis_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 DIAGNOSING TEAM ANALYSIS ISSUE';
    RAISE NOTICE '==================================';
    RAISE NOTICE '';
    
    -- Check active teams
    SELECT COUNT(*) INTO team_count FROM teams WHERE status = 'active';
    RAISE NOTICE '📊 Active teams: %', team_count;
    
    -- Check team members
    SELECT COUNT(*) INTO member_count 
    FROM team_members tm 
    JOIN teams t ON tm.team_id = t.id 
    WHERE t.status = 'active';
    RAISE NOTICE '👥 Team members in active teams: %', member_count;
    
    -- Check team_formed submissions
    SELECT COUNT(*) INTO formed_submission_count
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE t.status = 'active' AND tms.status = 'team_formed';
    RAISE NOTICE '✅ Team members with "team_formed" submissions: %', formed_submission_count;
    
    -- Check existing analysis
    SELECT COUNT(*) INTO analysis_count FROM team_strengths_analysis;
    RAISE NOTICE '📈 Existing team analysis records: %', analysis_count;
    
    RAISE NOTICE '';
    
    IF formed_submission_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM IDENTIFIED: No team members have "team_formed" status!';
        RAISE NOTICE '   This is why the analysis calculation is failing.';
        RAISE NOTICE '   The calculate_and_store_team_analysis function requires submissions with "team_formed" status.';
    ELSE
        RAISE NOTICE '✅ Team members with "team_formed" status found.';
    END IF;
END $$;

-- Step 2: Show current submission statuses
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 CURRENT SUBMISSION STATUSES:';
    RAISE NOTICE '================================';
END $$;

SELECT 
    tms.status,
    COUNT(*) as count,
    CASE 
        WHEN tm.team_id IS NOT NULL THEN 'In Team'
        ELSE 'Not in Team'
    END as team_status
FROM team_matching_submissions tms
LEFT JOIN team_members tm ON tms.id = tm.submission_id
GROUP BY tms.status, (tm.team_id IS NOT NULL)
ORDER BY tms.status;

-- Step 3: Fix submission statuses if needed
CREATE OR REPLACE FUNCTION fix_submission_statuses_for_recalc()
RETURNS TABLE(
    submission_id UUID,
    team_id UUID,
    old_status TEXT,
    new_status TEXT,
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
        JOIN teams t ON tm.team_id = t.id
        WHERE tms.status != 'team_formed' AND t.status = 'active'
    LOOP
        BEGIN
            UPDATE team_matching_submissions 
            SET 
                status = 'team_formed',
                updated_at = NOW()
            WHERE id = member_record.submission_id;
            
            submission_id := member_record.submission_id;
            team_id := member_record.team_id;
            old_status := member_record.current_status;
            new_status := 'team_formed';
            updated := TRUE;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                submission_id := member_record.submission_id;
                team_id := member_record.team_id;
                old_status := member_record.current_status;
                new_status := 'error';
                updated := FALSE;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Corrected recalculation function
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
    member_count INTEGER;
BEGIN
    -- Loop through teams that have members with 'team_formed' submissions
    FOR team_record IN 
        SELECT DISTINCT t.id as team_id, t.team_name
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id
        WHERE t.status = 'active' 
          AND tms.status = 'team_formed'
    LOOP
        BEGIN
            -- Check if team has enough members with team_formed status
            SELECT COUNT(*) INTO member_count
            FROM team_members tm
            JOIN team_matching_submissions tms ON tm.submission_id = tms.id
            WHERE tm.team_id = team_record.team_id
              AND tms.status = 'team_formed';
            
            IF member_count > 0 THEN
                -- Delete existing analysis for this team
                DELETE FROM team_strengths_analysis WHERE team_strengths_analysis.team_id = team_record.team_id;
                
                -- Calculate new analysis
                SELECT calculate_and_store_team_analysis(team_record.team_id) INTO calc_analysis_id;
                
                team_id := team_record.team_id;
                team_name := team_record.team_name;
                analysis_id := calc_analysis_id;
                success := TRUE;
                error_message := NULL;
                RETURN NEXT;
            ELSE
                team_id := team_record.team_id;
                team_name := team_record.team_name;
                analysis_id := NULL;
                success := FALSE;
                error_message := 'No team members with team_formed status';
                RETURN NEXT;
            END IF;
            
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION fix_submission_statuses_for_recalc() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;

-- Step 5: Execute the complete fix
DO $$
DECLARE
    fix_result RECORD;
    calc_result RECORD;
    fix_count INTEGER := 0;
    calc_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 EXECUTING COMPLETE FIX';
    RAISE NOTICE '=========================';
    RAISE NOTICE '';
    
    -- Fix submission statuses first
    RAISE NOTICE '1️⃣ Fixing submission statuses...';
    FOR fix_result IN SELECT * FROM fix_submission_statuses_for_recalc() LOOP
        fix_count := fix_count + 1;
        IF fix_result.updated THEN
            RAISE NOTICE '   ✅ Fixed submission % (% → %)', fix_result.submission_id, fix_result.old_status, fix_result.new_status;
        ELSE
            RAISE WARNING '   ❌ Failed to fix submission %', fix_result.submission_id;
        END IF;
    END LOOP;
    
    IF fix_count = 0 THEN
        RAISE NOTICE '   ℹ️ No submission statuses needed fixing.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Recalculating team analysis...';
    
    -- Recalculate team analysis
    FOR calc_result IN SELECT * FROM recalculate_all_team_analysis() LOOP
        calc_count := calc_count + 1;
        IF calc_result.success THEN
            success_count := success_count + 1;
            RAISE NOTICE '   ✅ Team: % | Analysis ID: %', calc_result.team_name, calc_result.analysis_id;
        ELSE
            RAISE WARNING '   ❌ Team: % | Error: %', calc_result.team_name, calc_result.error_message;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 FINAL SUMMARY:';
    RAISE NOTICE '================';
    RAISE NOTICE '  • Submission fixes applied: %', fix_count;
    RAISE NOTICE '  • Teams processed: %', calc_count;
    RAISE NOTICE '  • Successful calculations: %', success_count;
    RAISE NOTICE '';
    
    IF success_count > 0 THEN
        RAISE NOTICE '🎉 SUCCESS! Team analysis has been recalculated.';
        RAISE NOTICE '   Check your dashboard to see the updated values.';
    ELSE
        RAISE WARNING '⚠️ No teams were successfully processed.';
        RAISE NOTICE '   Please check the error messages above for details.';
    END IF;
END $$;

COMMIT;

-- Step 6: Verification query
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICATION:';
    RAISE NOTICE '===============';
    RAISE NOTICE 'Run this query to verify the results:';
    RAISE NOTICE '';
    RAISE NOTICE 'SELECT t.team_name, tsa.complementarity_score, tsa.consulting_coverage,';
    RAISE NOTICE '       tsa.technology_coverage, tsa.calculated_at';
    RAISE NOTICE 'FROM teams t';
    RAISE NOTICE 'JOIN team_strengths_analysis tsa ON t.id = tsa.team_id';
    RAISE NOTICE 'WHERE t.status = ''active''';
    RAISE NOTICE 'ORDER BY tsa.calculated_at DESC;';
END $$;