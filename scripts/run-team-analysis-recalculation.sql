-- =====================================================
-- RUN TEAM ANALYSIS RECALCULATION
-- =====================================================
-- This script runs the team analysis recalculation function
-- after submission statuses have been fixed

-- =====================================================
-- 1. CHECK PREREQUISITES
-- =====================================================

SELECT 
    'Checking prerequisites for team analysis recalculation...' as step;

-- Verify that we have teams with team_formed submissions
SELECT 
    COUNT(DISTINCT t.id) as teams_ready_for_analysis,
    'teams with all members having team_formed status' as description
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
WHERE t.status = 'active'
  AND tms.status = 'team_formed'
GROUP BY t.id
HAVING COUNT(tm.submission_id) = COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END);

-- =====================================================
-- 2. RUN RECALCULATION FUNCTION
-- =====================================================

SELECT 
    'Running team analysis recalculation...' as step;

-- Check if the recalculation function exists
SELECT 
    proname as function_name,
    'function exists' as status
FROM pg_proc 
WHERE proname = 'recalculate_all_team_analysis';

-- Run the recalculation function if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalculate_all_team_analysis') THEN
        RAISE NOTICE 'Running recalculate_all_team_analysis()...';
        PERFORM recalculate_all_team_analysis();
        RAISE NOTICE 'Team analysis recalculation completed!';
    ELSE
        RAISE NOTICE 'recalculate_all_team_analysis() function not found. Please run setup-automatic-team-analysis.sql first.';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFY RESULTS
-- =====================================================

SELECT 
    'Verifying team analysis results...' as step;

-- Check team analysis results
SELECT 
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

-- Count teams with and without analysis
SELECT 
    COUNT(CASE WHEN tsa.id IS NOT NULL THEN 1 END) as teams_with_analysis,
    COUNT(CASE WHEN tsa.id IS NULL THEN 1 END) as teams_without_analysis,
    COUNT(*) as total_active_teams
FROM teams t
LEFT JOIN team_strengths_analysis tsa ON t.id = tsa.team_id
WHERE t.status = 'active';

SELECT 
    'Team analysis recalculation process completed!' as final_message;