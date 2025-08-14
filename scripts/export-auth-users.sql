-- =====================================================
-- SUPABASE AUTH USERS DATA EXPORT QUERIES
-- =====================================================

-- =====================================================
-- METHOD 1: BASIC AUTH USERS EXPORT
-- =====================================================

-- Export all auth users (basic fields)
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    new_email,
    invited_at,
    action_link,
    email_change,
    email_change_confirm_status,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 2: FILTERED AUTH USERS EXPORT (RECOMMENDED)
-- =====================================================

-- Export essential auth user fields only
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_user_meta_data,
    role,
    aud
FROM auth.users
WHERE deleted_at IS NULL  -- Exclude soft-deleted users
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 3: AUTH USERS WITH METADATA EXTRACTION
-- =====================================================

-- Extract specific metadata fields from raw_user_meta_data
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    -- Extract metadata fields
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'college_name' as college_name,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'provider' as provider,
    -- Full metadata as JSON
    raw_user_meta_data,
    raw_app_meta_data,
    role,
    aud
FROM auth.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 4: AUTH USERS WITH ACTIVITY STATS
-- =====================================================

-- Export with calculated activity metrics
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    -- Calculate days since registration
    EXTRACT(DAY FROM (NOW() - created_at)) as days_since_registration,
    -- Calculate days since last login
    CASE 
        WHEN last_sign_in_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - last_sign_in_at))
        ELSE NULL 
    END as days_since_last_login,
    -- Email confirmation status
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Unconfirmed'
    END as email_status,
    -- Phone confirmation status
    CASE 
        WHEN phone_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Unconfirmed'
    END as phone_status,
    -- Extract user metadata
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'college_name' as college_name,
    role,
    aud
FROM auth.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 5: AUTH USERS FOR SPECIFIC DATE RANGE
-- =====================================================

-- Export users registered in the last 30 days
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'college_name' as college_name,
    role
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Export users registered between specific dates
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'college_name' as college_name,
    role
FROM auth.users
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 6: AUTH USERS WITH TEAM MATCHING DATA
-- =====================================================

-- Export auth users with their team matching submissions (if any)
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.raw_user_meta_data->>'college_name' as college_name,
    -- Team matching data
    tms.id as submission_id,
    tms.status as team_status,
    tms.submitted_at,
    tms.matched_at,
    tms.full_name as submission_name,
    tms.whatsapp_number,
    tms.current_year,
    tms.experience,
    tms.preferred_team_size
FROM auth.users u
LEFT JOIN team_matching_submissions tms ON u.id = tms.user_id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;

-- =====================================================
-- METHOD 7: EXPORT FOR CSV FORMAT (CLEAN)
-- =====================================================

-- Clean export optimized for CSV
SELECT 
    id,
    email,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
    TO_CHAR(last_sign_in_at, 'YYYY-MM-DD HH24:MI:SS') as last_sign_in_at,
    TO_CHAR(email_confirmed_at, 'YYYY-MM-DD HH24:MI:SS') as email_confirmed_at,
    COALESCE(phone, '') as phone,
    COALESCE(raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(raw_user_meta_data->>'last_name', '') as last_name,
    COALESCE(raw_user_meta_data->>'college_name', '') as college_name,
    COALESCE(raw_user_meta_data->>'full_name', '') as full_name,
    COALESCE(role, 'authenticated') as role,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as email_confirmed,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_logged_in
FROM auth.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 8: COUNT AND SUMMARY STATISTICS
-- =====================================================

-- Get summary statistics before export
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_who_logged_in,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_last_30_days,
    MIN(created_at) as first_user_registered,
    MAX(created_at) as last_user_registered
FROM auth.users
WHERE deleted_at IS NULL;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
TO USE THESE QUERIES:

1. IN SUPABASE DASHBOARD:
   - Go to SQL Editor
   - Copy and paste any of the queries above
   - Click "Run" to execute
   - Results will appear in the results panel
   - Click "Download CSV" to export as CSV

2. VIA PSQL COMMAND LINE:
   psql "postgresql://postgres:[password]@[host]:5432/postgres" -c "COPY (SELECT ...) TO STDOUT WITH CSV HEADER" > auth_users.csv

3. VIA SUPABASE CLI:
   supabase db dump --data-only --schema auth --table users

4. PROGRAMMATICALLY:
   Use the queries in your application code with supabase client

RECOMMENDED QUERIES:
- For basic export: Use METHOD 2
- For detailed analysis: Use METHOD 3
- For CSV export: Use METHOD 7
- For team matching analysis: Use METHOD 6
*/