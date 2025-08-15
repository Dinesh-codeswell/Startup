-- =====================================================
-- GOOGLE OAUTH AUTHENTICATION DIAGNOSTIC SCRIPT
-- Run this in your Supabase SQL Editor to diagnose auth issues
-- =====================================================

-- Check if profiles table exists and has correct structure
SELECT 
  'profiles_table_check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check profiles table structure
SELECT 
  'profiles_columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if handle_new_user function exists
SELECT 
  'handle_new_user_function' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if trigger exists
SELECT 
  'auth_trigger_check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      JOIN pg_namespace n ON c.relnamespace = n.oid 
      WHERE t.tgname = 'on_auth_user_created' 
      AND n.nspname = 'auth' 
      AND c.relname = 'users'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check RLS policies on profiles
SELECT 
  'profiles_rls_policies' as check_type,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if RLS is enabled on profiles
SELECT 
  'profiles_rls_enabled' as check_type,
  CASE 
    WHEN relrowsecurity = true THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as status
FROM pg_class 
WHERE relname = 'profiles';

-- Test if we can access auth.users (should show some system info)
SELECT 
  'auth_users_access' as check_type,
  COUNT(*) as user_count
FROM auth.users;

-- Check recent auth errors (if any)
SELECT 
  'recent_auth_attempts' as check_type,
  created_at,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;