-- =====================================================
-- AUTOMATIC TEAM STRENGTH ANALYSIS TRIGGER
-- =====================================================
-- This script creates a trigger that automatically calculates
-- team strength analysis when a team is created or when team members are added

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTION FOR AUTOMATIC TEAM ANALYSIS
-- =====================================================

-- Function to automatically calculate team analysis when team members are added
CREATE OR REPLACE FUNCTION trigger_calculate_team_analysis()
RETURNS TRIGGER AS $$
DECLARE
    team_member_count INTEGER;
    analysis_id UUID;
BEGIN
    -- Check if this is an INSERT operation on team_members table
    IF TG_TABLE_NAME = 'team_members' AND TG_OP = 'INSERT' THEN
        -- Get the team_id from the inserted team member
        PERFORM calculate_and_store_team_analysis(NEW.team_id);
        RETURN NEW;
    END IF;
    
    -- Check if this is an INSERT operation on teams table
    IF TG_TABLE_NAME = 'teams' AND TG_OP = 'INSERT' THEN
        -- For teams table, we'll calculate analysis after team members are added
        -- This will be handled by the team_members trigger
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DELAYED TRIGGER FUNCTION FOR TEAM ANALYSIS
-- =====================================================
-- This function will be called after team members are fully inserted
-- to ensure we have complete team data before calculating analysis

CREATE OR REPLACE FUNCTION delayed_team_analysis_calculation()
RETURNS TRIGGER AS $$
DECLARE
    team_member_count INTEGER;
    analysis_id UUID;
BEGIN
    -- Only proceed if this is an INSERT operation
    IF TG_OP = 'INSERT' THEN
        -- Check if the team has any members
        SELECT COUNT(*) INTO team_member_count
        FROM team_members tm
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id
        WHERE tm.team_id = NEW.team_id
          AND tms.status = 'team_formed';
        
        -- Only calculate analysis if team has members
        IF team_member_count > 0 THEN
            -- Use pg_notify to trigger async calculation to avoid blocking
            PERFORM pg_notify('team_analysis_needed', NEW.team_id::text);
            
            -- Also calculate immediately for immediate availability
            BEGIN
                SELECT calculate_and_store_team_analysis(NEW.team_id) INTO analysis_id;
                
                -- Log successful calculation
                RAISE NOTICE 'Team analysis calculated for team_id: %, analysis_id: %', NEW.team_id, analysis_id;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log error but don't fail the transaction
                    RAISE WARNING 'Failed to calculate team analysis for team_id: %. Error: %', NEW.team_id, SQLERRM;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_team_analysis_on_member_insert ON team_members;
DROP TRIGGER IF EXISTS trigger_team_analysis_on_team_insert ON teams;

-- Create trigger on team_members table (AFTER INSERT)
-- This ensures team analysis is calculated after team members are added
CREATE TRIGGER trigger_team_analysis_on_member_insert
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION delayed_team_analysis_calculation();

-- =====================================================
-- BATCH CALCULATION FUNCTION
-- =====================================================
-- Function to recalculate analysis for all existing teams
-- This can be called manually if needed

CREATE OR REPLACE FUNCTION recalculate_all_team_analysis()
RETURNS TABLE(
    team_id UUID,
    analysis_id UUID,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    team_record RECORD;
    calc_analysis_id UUID;
BEGIN
    -- Loop through all active teams
    FOR team_record IN 
        SELECT DISTINCT t.id as team_id, t.team_name
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE t.status = 'active'
    LOOP
        BEGIN
            -- Calculate analysis for this team
            SELECT calculate_and_store_team_analysis(team_record.team_id) INTO calc_analysis_id;
            
            -- Return success result
            team_id := team_record.team_id;
            analysis_id := calc_analysis_id;
            success := TRUE;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Return error result
                team_id := team_record.team_id;
                analysis_id := NULL;
                success := FALSE;
                error_message := SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION trigger_calculate_team_analysis() TO authenticated;
GRANT EXECUTE ON FUNCTION delayed_team_analysis_calculation() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_team_analysis() TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to check if triggers are created
/*
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%team_analysis%'
ORDER BY event_object_table, trigger_name;
*/

-- Query to test the recalculation function
/*
SELECT * FROM recalculate_all_team_analysis();
*/

-- Query to check team analysis data
/*
SELECT 
    t.id as team_id,
    t.team_name,
    t.team_size,
    tsa.complementarity_score,
    tsa.consulting_coverage,
    tsa.technology_coverage,
    tsa.finance_coverage,
    tsa.marketing_coverage,
    tsa.design_coverage,
    tsa.calculated_at
FROM teams t
LEFT JOIN team_strengths_analysis tsa ON t.id = tsa.team_id
WHERE t.status = 'active'
ORDER BY t.created_at DESC;
*/

COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Team Analysis Trigger Setup Complete!';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - trigger_team_analysis_on_member_insert (team_members table)';
    RAISE NOTICE 'Functions available:';
    RAISE NOTICE '  - delayed_team_analysis_calculation()';
    RAISE NOTICE '  - recalculate_all_team_analysis()';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Team strength analysis will now be automatically calculated when:';
    RAISE NOTICE '  - New team members are added to a team';
    RAISE NOTICE '';
    RAISE NOTICE '📊 To recalculate analysis for all existing teams, run:';
    RAISE NOTICE '  SELECT * FROM recalculate_all_team_analysis();';
END $$;