-- =====================================================
-- DATABASE SCHEMA DIAGNOSTIC SCRIPT
-- This script checks the actual database structure to identify
-- which schema is implemented and resolve column name conflicts
-- =====================================================

-- Check if team_chat_participants table exists and its structure
SELECT 
  'team_chat_participants table structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_chat_participants'
ORDER BY ordinal_position;

-- Check if team_chat_messages table exists and its structure
SELECT 
  'team_chat_messages table structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_chat_messages'
ORDER BY ordinal_position;

-- Check team_members table structure
SELECT 
  'team_members table structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- Check team_matching_submissions table structure
SELECT 
  'team_matching_submissions table structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_matching_submissions'
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 
  'profiles table structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check foreign key relationships
SELECT 
  'Foreign Key Relationships' as check_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('team_chat_participants', 'team_chat_messages', 'team_members')
ORDER BY tc.table_name, kcu.column_name;

-- Check unique constraints
SELECT 
  'Unique Constraints' as check_name,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('team_chat_participants', 'team_chat_messages', 'team_members')
ORDER BY tc.table_name, tc.constraint_name;

-- Test if team_chat_participants has user_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_chat_participants' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'team_chat_participants HAS user_id column';
  ELSE
    RAISE NOTICE 'team_chat_participants DOES NOT HAVE user_id column';
  END IF;
END $$;

-- Test sample data relationships
SELECT 
  'Sample Data Check' as check_name,
  'team_chat_participants count' as description,
  COUNT(*) as count
FROM team_chat_participants;

SELECT 
  'Sample Data Check' as check_name,
  'team_chat_messages count' as description,
  COUNT(*) as count
FROM team_chat_messages;

SELECT 
  'Sample Data Check' as check_name,
  'team_members count' as description,
  COUNT(*) as count
FROM team_members;

-- Check if we can join team_chat_participants with team_matching_submissions
-- This will tell us the correct relationship
DO $$
DECLARE
  join_test_result INTEGER;
BEGIN
  -- Test if user_id exists in team_chat_participants
  BEGIN
    SELECT COUNT(*) INTO join_test_result
    FROM team_chat_participants tcp
    JOIN team_matching_submissions tms ON tcp.user_id = tms.user_id
    LIMIT 1;
    RAISE NOTICE 'JOIN via user_id WORKS - team_chat_participants has user_id column';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'JOIN via user_id FAILED - team_chat_participants likely does not have user_id column';
  END;
  
  -- Test if submission_id exists and works
  BEGIN
    SELECT COUNT(*) INTO join_test_result
    FROM team_chat_participants tcp
    JOIN team_matching_submissions tms ON tcp.submission_id = tms.id
    LIMIT 1;
    RAISE NOTICE 'JOIN via submission_id WORKS - team_chat_participants has submission_id column';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'JOIN via submission_id FAILED - team_chat_participants likely does not have submission_id column';
  END;
END $$;

-- Show actual table creation statements if available
SELECT 
  'Table Definitions' as check_name,
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('team_chat_participants', 'team_chat_messages', 'team_members', 'team_matching_submissions')
ORDER BY tablename;