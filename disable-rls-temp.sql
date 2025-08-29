-- =====================================================
-- TEMPORARILY DISABLE RLS TO TEST CONNECTION
-- =====================================================

-- Disable RLS temporarily to test connection and verify table structure
ALTER TABLE team_chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "chat_participants_select_team" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_select_simple" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_team" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_own" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_service_role" ON team_chat_participants;

DROP POLICY IF EXISTS "chat_messages_select_team" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_simple" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_team" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_own" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_service_role" ON team_chat_messages;

-- Test message
DO $$
BEGIN
  RAISE NOTICE 'RLS temporarily disabled for testing';
END $$;