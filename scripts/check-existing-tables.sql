-- =====================================================
-- CHECK EXISTING TABLES IN DATABASE
-- =====================================================
-- This script checks which tables actually exist to fix the comprehensive script

-- Check all tables that are referenced in the comprehensive fix script
SELECT 
  'Existing Tables Check' as check_name,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'team_matching_submissions',
    'teams', 
    'team_matching_batches',
    'profiles',
    'team_chat_messages',
    'team_chat_participants', 
    'team_chat_typing_indicators',
    'team_change_requests',
    'issue_reports',
    'resource_views',
    'team_strengths_analysis',
    'tasks'
  )
ORDER BY table_name;

-- Check for any tables with 'team_chat' prefix
SELECT 
  'Team Chat Tables' as check_name,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE 'team_chat%'
ORDER BY table_name;

-- Check for any tables with 'team' prefix
SELECT 
  'All Team Tables' as check_name,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE 'team%'
ORDER BY table_name;

-- Check existing triggers that might reference updated_at
SELECT 
  'Existing Triggers' as check_name,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name LIKE '%updated_at%' OR trigger_name LIKE '%update_%')
ORDER BY event_object_table, trigger_name;

-- Check existing functions that might reference updated_at
SELECT 
  'Existing Functions' as check_name,
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%updated_at%' OR routine_name LIKE '%update_%')
ORDER BY routine_name;