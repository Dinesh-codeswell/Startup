-- =====================================================
-- TEAM CHAT RLS POLICIES SETUP
-- Essential Row Level Security policies for team chat functionality
-- =====================================================

-- Enable RLS on all team chat tables
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_typing ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "chat_messages_select_team" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_team" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_own" ON team_chat_messages;
DROP POLICY IF EXISTS "chat_messages_service_role" ON team_chat_messages;

DROP POLICY IF EXISTS "chat_participants_select_team" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_team" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_own" ON team_chat_participants;
DROP POLICY IF EXISTS "chat_participants_service_role" ON team_chat_participants;

DROP POLICY IF EXISTS "chat_read_receipts_select_own" ON team_chat_read_receipts;
DROP POLICY IF EXISTS "chat_read_receipts_insert_own" ON team_chat_read_receipts;
DROP POLICY IF EXISTS "chat_read_receipts_service_role" ON team_chat_read_receipts;

DROP POLICY IF EXISTS "chat_typing_select_team" ON team_chat_typing;
DROP POLICY IF EXISTS "chat_typing_manage_own" ON team_chat_typing;
DROP POLICY IF EXISTS "chat_typing_service_role" ON team_chat_typing;

DROP POLICY IF EXISTS "chat_reactions_select_team" ON team_chat_reactions;
DROP POLICY IF EXISTS "chat_reactions_insert_team" ON team_chat_reactions;
DROP POLICY IF EXISTS "chat_reactions_delete_own" ON team_chat_reactions;
DROP POLICY IF EXISTS "chat_reactions_service_role" ON team_chat_reactions;

DROP POLICY IF EXISTS "chat_attachments_select_team" ON team_chat_attachments;
DROP POLICY IF EXISTS "chat_attachments_insert_team" ON team_chat_attachments;
DROP POLICY IF EXISTS "chat_attachments_service_role" ON team_chat_attachments;

-- =====================================================
-- TEAM CHAT MESSAGES POLICIES
-- =====================================================

-- Users can view messages from teams they're part of
CREATE POLICY "chat_messages_select_team" ON team_chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_messages.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can insert messages to teams they're part of
CREATE POLICY "chat_messages_insert_team" ON team_chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_messages.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can update their own messages
CREATE POLICY "chat_messages_update_own" ON team_chat_messages
FOR UPDATE USING (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_messages.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Service role can manage all messages
CREATE POLICY "chat_messages_service_role" ON team_chat_messages
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM CHAT PARTICIPANTS POLICIES
-- =====================================================

-- Users can view participants from teams they're part of
CREATE POLICY "chat_participants_select_team" ON team_chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_participants.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can insert themselves as participants (handled by functions)
CREATE POLICY "chat_participants_insert_team" ON team_chat_participants
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- Users can update their own participation
CREATE POLICY "chat_participants_update_own" ON team_chat_participants
FOR UPDATE USING (
  auth.uid() = user_id OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- Service role can manage all participants
CREATE POLICY "chat_participants_service_role" ON team_chat_participants
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM CHAT READ RECEIPTS POLICIES
-- =====================================================

-- Users can view read receipts for messages they can see
CREATE POLICY "chat_read_receipts_select_own" ON team_chat_read_receipts
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_read_receipts.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can insert their own read receipts
CREATE POLICY "chat_read_receipts_insert_own" ON team_chat_read_receipts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_read_receipts.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Service role can manage all read receipts
CREATE POLICY "chat_read_receipts_service_role" ON team_chat_read_receipts
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM CHAT TYPING INDICATORS POLICIES
-- =====================================================

-- Users can view typing indicators from teams they're part of
CREATE POLICY "chat_typing_select_team" ON team_chat_typing
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_typing.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can manage their own typing indicators
CREATE POLICY "chat_typing_manage_own" ON team_chat_typing
FOR ALL USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    WHERE tcp.team_id = team_chat_typing.team_id 
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Service role can manage all typing indicators
CREATE POLICY "chat_typing_service_role" ON team_chat_typing
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM CHAT REACTIONS POLICIES
-- =====================================================

-- Users can view reactions from teams they're part of
CREATE POLICY "chat_reactions_select_team" ON team_chat_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_reactions.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can add reactions to messages in teams they're part of
CREATE POLICY "chat_reactions_insert_team" ON team_chat_reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_reactions.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can remove their own reactions
CREATE POLICY "chat_reactions_delete_own" ON team_chat_reactions
FOR DELETE USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_reactions.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Service role can manage all reactions
CREATE POLICY "chat_reactions_service_role" ON team_chat_reactions
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM CHAT ATTACHMENTS POLICIES
-- =====================================================

-- Users can view attachments from teams they're part of
CREATE POLICY "chat_attachments_select_team" ON team_chat_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_attachments.message_id
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Users can add attachments to messages in teams they're part of
CREATE POLICY "chat_attachments_insert_team" ON team_chat_attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_chat_messages tcm
    JOIN team_chat_participants tcp ON tcp.team_id = tcm.team_id
    WHERE tcm.id = team_chat_attachments.message_id
    AND tcm.sender_id = auth.uid()
    AND tcp.user_id = auth.uid()
    AND tcp.is_active = TRUE
  )
);

-- Service role can manage all attachments
CREATE POLICY "chat_attachments_service_role" ON team_chat_attachments
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON team_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_chat_participants TO authenticated;
GRANT SELECT, INSERT ON team_chat_read_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_chat_typing TO authenticated;
GRANT SELECT, INSERT, DELETE ON team_chat_reactions TO authenticated;
GRANT SELECT, INSERT ON team_chat_attachments TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'team_chat_%'
ORDER BY tablename;

-- Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename LIKE 'team_chat_%'
ORDER BY tablename, policyname;

-- Success messages
DO $$
BEGIN
  RAISE NOTICE 'Team chat RLS policies have been successfully created!';
  RAISE NOTICE 'All team chat tables now have proper Row Level Security enabled.';
  RAISE NOTICE 'Users can only access chat data from teams they are participants of.';
END $$;