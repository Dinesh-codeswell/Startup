-- =====================================================
-- QUICK FIX FOR TEAM ANALYSIS RECALCULATION
-- =====================================================
-- This script fixes the team analysis recalculation issue
-- by ensuring submission statuses are correct and then
-- recalculating all team analysis

-- Step 1: Fix submission statuses for team members
UPDATE team_matching_submissions 
SET 
    status = 'team_formed'
WHERE id IN (
    SELECT DISTINCT tms.id
    FROM team_matching_submissions tms
    JOIN team_members tm ON tms.id = tm.submission_id
    JOIN teams t ON tm.team_id = t.id
    WHERE tms.status != 'team_formed' 
      AND t.status = 'active'
);

-- Step 2: Drop and recreate the recalculation function with proper logic
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
            -- Delete existing analysis for this team first
            DELETE FROM team_strengths_analysis WHERE team_strengths_analysis.team_id = team_record.team_id;
            
            -- Calculate new analysis
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;

-- Step 3: Execute the recalculation
SELECT * FROM recalculate_all_team_analysis();

-- Step 4: Verify results
SELECT 
    t.team_name,
    tsa.complementarity_score,
    tsa.consulting_coverage,
    tsa.technology_coverage,
    tsa.calculated_at
FROM teams t
JOIN team_strengths_analysis tsa ON t.id = tsa.team_id
WHERE t.status = 'active'
ORDER BY tsa.calculated_at DESC;

COMMIT;