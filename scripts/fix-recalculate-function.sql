-- =====================================================
-- FIX FOR RECALCULATE FUNCTION ERROR
-- =====================================================
-- This script fixes the "cannot change return type" error
-- by properly dropping and recreating the function

-- Drop the existing function first
DROP FUNCTION IF EXISTS recalculate_all_team_analysis();

-- Recreate the function with correct signature
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
    -- Loop through all active teams with members
    FOR team_record IN 
        SELECT DISTINCT t.id as team_id, t.team_name
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id
        WHERE t.status = 'active'
          AND tms.status = 'team_formed'
    LOOP
        BEGIN
            -- Calculate analysis for this team
            SELECT calculate_and_store_team_analysis(team_record.team_id) INTO calc_analysis_id;
            
            -- Return success result
            team_id := team_record.team_id;
            team_name := team_record.team_name;
            analysis_id := calc_analysis_id;
            success := TRUE;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Return error result
                team_id := team_record.team_id;
                team_name := team_record.team_name;
                analysis_id := NULL;
                success := FALSE;
                error_message := SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
    
    -- If no teams found, return a message
    IF NOT FOUND THEN
        team_id := NULL;
        team_name := 'No active teams found';
        analysis_id := NULL;
        success := FALSE;
        error_message := 'No active teams with team_formed submissions found';
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '✅ Function recalculate_all_team_analysis() recreated successfully!';
    RAISE NOTICE 'You can now run: SELECT * FROM recalculate_all_team_analysis();';
END $$;

COMMIT;