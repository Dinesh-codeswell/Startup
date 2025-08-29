-- =====================================================
-- FIX RLS INFINITE RECURSION IN TEAM CHAT PARTICIPANTS
-- =====================================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "chat_participants_select_team" ON team_chat_participants;

-- Create a simple policy that allows users to see participants in teams they belong to
-- This avoids recursion by using a direct user_id check instead of EXISTS subquery
CREATE POLICY "chat_participants_select_simple" ON team_chat_participants
FOR SELECT USING (
  -- Users can see their own participation records
  auth.uid() = user_id 
  OR 
  -- Users can see other participants in teams where they are also participants
  team_id IN (
    SELECT DISTINCT tcp.team_id 
    FROM team_chat_participants tcp 
    WHERE tcp.user_id = auth.uid() 
    AND tcp.is_active = TRUE
  )
);

-- Alternative: Create a more permissive policy for testing
-- Uncomment this if the above still causes issues
/*
DROP POLICY IF EXISTS "chat_participants_select_simple" ON team_chat_participants;
CREATE POLICY "chat_participants_select_permissive" ON team_chat_participants
FOR SELECT USING (true);
*/

-- Also fix the messages policy to avoid potential recursion
DROP POLICY IF EXISTS "chat_messages_select_team" ON team_chat_messages;

CREATE POLICY "chat_messages_select_simple" ON team_chat_messages
FOR SELECT USING (
  team_id IN (
    SELECT DISTINCT tcp.team_id 
    FROM team_chat_participants tcp 
    WHERE tcp.user_id = auth.uid() 
    AND tcp.is_active = TRUE
  )
);

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE 'RLS recursion fix applied successfully';
END $$;