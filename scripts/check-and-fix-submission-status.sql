-- =====================================================
-- CHECK AND FIX SUBMISSION STATUS ISSUES
-- =====================================================
-- This script checks if triggers are installed and fixes
-- existing submission statuses that should be 'team_formed'

-- =====================================================
-- 1. CHECK IF TRIGGERS ARE INSTALLED
-- =====================================================

SELECT 
    'Checking triggers...' as step;

-- Check if our triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_update_submission_status',
    'trigger_auto_team_analysis',
    'update_submission_on_team_join'
)
AND event_object_table = 'team_members';

-- =====================================================
-- 2. CHECK CURRENT SUBMISSION STATUS ISSUES
-- =====================================================

SELECT 
    'Checking submission status issues...' as step;

-- Find submissions that should be 'team_formed' but aren't
SELECT 
    tms.id as submission_id,
    tms.status as current_status,
    tms.name as student_name,
    tm.team_id,
    t.team_name,
    t.created_at as team_created_at
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
JOIN teams t ON tm.team_id = t.id
WHERE tms.status != 'team_formed'
ORDER BY t.created_at DESC;

-- =====================================================
-- 3. COUNT THE ISSUES
-- =====================================================

SELECT 
    COUNT(*) as submissions_needing_fix,
    'submissions with team_members but status != team_formed' as description
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
WHERE tms.status != 'team_formed';

-- =====================================================
-- 4. FIX THE SUBMISSION STATUSES
-- =====================================================

SELECT 
    'Fixing submission statuses...' as step;

-- Update all submissions that have team members to 'team_formed'
UPDATE team_matching_submissions 
SET 
    status = 'team_formed',
    updated_at = NOW(),
    matched_at = COALESCE(matched_at, NOW())
WHERE id IN (
    SELECT DISTINCT tm.submission_id 
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tms.status != 'team_formed'
);

-- =====================================================
-- 5. VERIFY THE FIX
-- =====================================================

SELECT 
    'Verification after fix...' as step;

-- Check how many were fixed
SELECT 
    COUNT(*) as total_team_formed_submissions,
    'submissions now with team_formed status' as description
FROM team_matching_submissions tms
JOIN team_members tm ON tms.id = tm.submission_id
WHERE tms.status = 'team_formed';

-- Show current status distribution
SELECT 
    status,
    COUNT(*) as count
FROM team_matching_submissions
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 6. CHECK TEAM ANALYSIS RECALCULATION READINESS
-- =====================================================

SELECT 
    'Checking team analysis readiness...' as step;

-- Check if we can now run team analysis recalculation
SELECT 
    t.id as team_id,
    t.team_name,
    COUNT(tm.submission_id) as member_count,
    COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END) as team_formed_count,
    CASE 
        WHEN COUNT(tm.submission_id) = COUNT(CASE WHEN tms.status = 'team_formed' THEN 1 END) 
        THEN 'Ready for analysis'
        ELSE 'Status mismatch'
    END as analysis_readiness
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
WHERE t.status = 'active'
GROUP BY t.id, t.team_name
ORDER BY t.created_at DESC;

SELECT 
    'Fix completed! You can now run team analysis recalculation.' as final_message;