-- Fix Row Level Security policies for team matching tables
-- This script ensures that the team matching system works properly

-- =====================================================
-- TEAM MATCHING SUBMISSIONS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "team_matching_submissions_select_policy" ON team_matching_submissions;
DROP POLICY IF EXISTS "team_matching_submissions_insert_policy" ON team_matching_submissions;
DROP POLICY IF EXISTS "team_matching_submissions_update_policy" ON team_matching_submissions;
DROP POLICY IF EXISTS "team_matching_submissions_delete_policy" ON team_matching_submissions;

-- Enable RLS on the table
ALTER TABLE team_matching_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for team_matching_submissions
-- Allow service role to do everything (for admin operations)
CREATE POLICY "team_matching_submissions_service_role_policy" ON team_matching_submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own submissions
CREATE POLICY "team_matching_submissions_insert_policy" ON team_matching_submissions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.role() = 'anon'
    );

-- Allow users to view their own submissions
CREATE POLICY "team_matching_submissions_select_own_policy" ON team_matching_submissions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- Allow users to update their own submissions
CREATE POLICY "team_matching_submissions_update_own_policy" ON team_matching_submissions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- =====================================================
-- TEAMS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;

-- Enable RLS on the table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
-- Allow service role to do everything
CREATE POLICY "teams_service_role_policy" ON teams
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view teams they're part of
CREATE POLICY "teams_select_member_policy" ON teams
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN team_matching_submissions tms ON tm.submission_id = tms.id
            WHERE tm.team_id = teams.id AND tms.user_id = auth.uid()
        )
    );

-- =====================================================
-- TEAM MEMBERS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;

-- Enable RLS on the table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
-- Allow service role to do everything
CREATE POLICY "team_members_service_role_policy" ON team_members
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to view team members of teams they're part of
CREATE POLICY "team_members_select_policy" ON team_members
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM team_matching_submissions tms
            WHERE tms.id = team_members.submission_id AND tms.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM team_members tm2
            JOIN team_matching_submissions tms2 ON tm2.submission_id = tms2.id
            WHERE tm2.team_id = team_members.team_id AND tms2.user_id = auth.uid()
        )
    );

-- =====================================================
-- TEAM NOTIFICATIONS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "team_notifications_select_policy" ON team_notifications;
DROP POLICY IF EXISTS "team_notifications_insert_policy" ON team_notifications;
DROP POLICY IF EXISTS "team_notifications_update_policy" ON team_notifications;
DROP POLICY IF EXISTS "team_notifications_delete_policy" ON team_notifications;

-- Enable RLS on the table
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for team_notifications
-- Allow service role to do everything
CREATE POLICY "team_notifications_service_role_policy" ON team_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to view their own notifications
CREATE POLICY "team_notifications_select_own_policy" ON team_notifications
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM team_matching_submissions tms
            WHERE tms.id = team_notifications.submission_id AND tms.user_id = auth.uid()
        )
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON team_matching_submissions TO authenticated;
GRANT SELECT ON teams TO authenticated;
GRANT SELECT ON team_members TO authenticated;
GRANT SELECT ON team_notifications TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON team_matching_submissions TO service_role;
GRANT ALL ON teams TO service_role;
GRANT ALL ON team_members TO service_role;
GRANT ALL ON team_notifications TO service_role;

-- Grant permissions to anon role for public submissions
GRANT INSERT ON team_matching_submissions TO anon;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('team_matching_submissions', 'teams', 'team_members', 'team_notifications')
ORDER BY tablename, policyname;

-- Check table permissions
SELECT table_name, privilege_type, grantee 
FROM information_schema.role_table_grants 
WHERE table_name IN ('team_matching_submissions', 'teams', 'team_members', 'team_notifications')
ORDER BY table_name, grantee, privilege_type;