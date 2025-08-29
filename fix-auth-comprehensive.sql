-- =====================================================
-- COMPREHENSIVE AUTHENTICATION FIX - CORRECTED VERSION
-- =====================================================
-- This script addresses all potential authentication issues
-- Fixed to match actual database schema

-- 1. Ensure RLS policies are properly configured for team_chat_participants
DROP POLICY IF EXISTS "Users can view team chat participants for their teams" ON team_chat_participants;
DROP POLICY IF EXISTS "Users can update their own team chat participation" ON team_chat_participants;
DROP POLICY IF EXISTS "Service role can manage all team chat participants" ON team_chat_participants;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view team chat participants for their teams" ON team_chat_participants
  FOR SELECT
  USING (
    -- User can see participants in teams they are members of
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id
      WHERE tm.team_id = team_chat_participants.team_id
        AND tms.user_id = auth.uid()
    )
    OR
    -- User can see their own participation record (using submission_id instead of user_id)
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own team chat participation" ON team_chat_participants
  FOR UPDATE
  USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all team chat participants" ON team_chat_participants
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Create a more robust ensure_user_in_team_chat function
CREATE OR REPLACE FUNCTION ensure_user_in_team_chat(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_submission_id UUID;
  user_display_name TEXT;
  team_exists BOOLEAN;
BEGIN
  -- First check if team exists
  SELECT EXISTS(SELECT 1 FROM teams WHERE id = p_team_id) INTO team_exists;
  IF NOT team_exists THEN
    RAISE LOG 'Team % does not exist', p_team_id;
    RETURN FALSE;
  END IF;
  
  -- Check if user is already in team_chat_participants
  IF EXISTS (
    SELECT 1 FROM team_chat_participants tcp
    JOIN team_matching_submissions tms ON tcp.submission_id = tms.id
    WHERE tcp.team_id = p_team_id AND tms.user_id = p_user_id AND tcp.is_active = TRUE
  ) THEN
    RAISE LOG 'User % already in team chat %', p_user_id, p_team_id;
    RETURN TRUE;
  END IF;
  
  -- Check if user is a team member and get submission details
  SELECT tm.submission_id INTO user_submission_id
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id;
  
  IF user_submission_id IS NULL THEN
    RAISE LOG 'User % is not a member of team %', p_user_id, p_team_id;
    RETURN FALSE; -- User is not a team member
  END IF;
  
  -- Get user display name from multiple sources
  SELECT COALESCE(
    p.first_name || ' ' || p.last_name,
    p.first_name,
    p.email,
    tms.full_name,
    tms.email,
    'Team Member'
  ) INTO user_display_name
  FROM profiles p
  FULL OUTER JOIN team_matching_submissions tms ON p.id = tms.user_id
  WHERE p.id = p_user_id OR tms.user_id = p_user_id
  LIMIT 1;
  
  -- Add user to team_chat_participants
  INSERT INTO team_chat_participants (
    team_id,
    submission_id,
    display_name,
    joined_at,
    is_active
  )
  VALUES (
    p_team_id,
    user_submission_id,
    user_display_name,
    NOW(),
    TRUE
  )
  ON CONFLICT (team_id, submission_id) DO UPDATE SET
    is_active = TRUE,
    display_name = EXCLUDED.display_name,
    joined_at = CASE 
      WHEN team_chat_participants.joined_at IS NULL 
      THEN EXCLUDED.joined_at 
      ELSE team_chat_participants.joined_at 
    END;
  
  RAISE LOG 'Successfully added user % to team chat %', p_user_id, p_team_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in ensure_user_in_team_chat: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_user_in_team_chat(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_in_team_chat(UUID, UUID) TO anon;

-- 3. Create a function to validate team access with detailed logging
CREATE OR REPLACE FUNCTION validate_team_access(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  has_access BOOLEAN,
  is_team_member BOOLEAN,
  is_chat_participant BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  team_member_count INTEGER;
  chat_participant_count INTEGER;
BEGIN
  -- Check team membership
  SELECT COUNT(*) INTO team_member_count
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id;
  
  -- Check chat participation
  SELECT COUNT(*) INTO chat_participant_count
  FROM team_chat_participants tcp
  JOIN team_matching_submissions tms ON tcp.submission_id = tms.id
  WHERE tcp.team_id = p_team_id AND tms.user_id = p_user_id AND tcp.is_active = TRUE;
  
  -- Return detailed results
  RETURN QUERY SELECT 
    (team_member_count > 0)::BOOLEAN as has_access,
    (team_member_count > 0)::BOOLEAN as is_team_member,
    (chat_participant_count > 0)::BOOLEAN as is_chat_participant,
    CASE 
      WHEN team_member_count = 0 THEN 'User is not a member of this team'
      WHEN chat_participant_count = 0 THEN 'User is not in team chat participants'
      ELSE 'Access granted'
    END as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_team_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_team_access(UUID, UUID) TO anon;

-- 4. Update the team_chat_messages_with_sender view with better error handling
DROP VIEW IF EXISTS team_chat_messages_with_sender;

CREATE VIEW team_chat_messages_with_sender AS
SELECT 
    m.id,
    m.team_id,
    m.sender_id,
    m.message_text,
    m.message_type,
    m.parent_message_id,
    m.is_edited,
    m.created_at,
    m.updated_at,
    COALESCE(
      p.display_name,
      prof.first_name || ' ' || prof.last_name,
      prof.first_name,
      tms.full_name,
      'Unknown User'
    ) as sender_name,
    p.submission_id as sender_submission_id
FROM team_chat_messages m
LEFT JOIN team_chat_participants p ON m.team_id = p.team_id
LEFT JOIN team_matching_submissions tms ON p.submission_id = tms.id AND m.sender_id = tms.user_id
LEFT JOIN profiles prof ON m.sender_id = prof.id;

-- 5. Create a comprehensive diagnostic function
CREATE OR REPLACE FUNCTION diagnose_chat_access(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if user exists
  RETURN QUERY
  SELECT 
    'User Exists'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) 
         THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
         THEN 'User found in auth.users'
         ELSE 'User not found in auth.users' END::TEXT;
  
  -- Check if team exists
  RETURN QUERY
  SELECT 
    'Team Exists'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM teams WHERE id = p_team_id) 
         THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM teams WHERE id = p_team_id)
         THEN 'Team found'
         ELSE 'Team not found' END::TEXT;
  
  -- Check team membership
  RETURN QUERY
  SELECT 
    'Team Membership'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM team_members tm
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id
      WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id
    ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COALESCE(
      (SELECT 'Member since ' || tm.joined_at::TEXT
       FROM team_members tm
       JOIN team_matching_submissions tms ON tm.submission_id = tms.id
       WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id
       LIMIT 1),
      'Not a team member'
    )::TEXT;
  
  -- Check chat participation
  RETURN QUERY
  SELECT 
    'Chat Participation'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM team_chat_participants tcp
      JOIN team_matching_submissions tms ON tcp.submission_id = tms.id
      WHERE tcp.team_id = p_team_id AND tms.user_id = p_user_id AND tcp.is_active = TRUE
    ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COALESCE(
      (SELECT 'Participant since ' || tcp.joined_at::TEXT || ', active: ' || tcp.is_active::TEXT
       FROM team_chat_participants tcp
       JOIN team_matching_submissions tms ON tcp.submission_id = tms.id
       WHERE tcp.team_id = p_team_id AND tms.user_id = p_user_id
       LIMIT 1),
      'Not a chat participant'
    )::TEXT;
  
  -- Test ensure_user_in_team_chat function
  RETURN QUERY
  SELECT 
    'Auto-enrollment'::TEXT,
    CASE WHEN ensure_user_in_team_chat(p_team_id, p_user_id) 
         THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Function result: ' || ensure_user_in_team_chat(p_team_id, p_user_id)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION diagnose_chat_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_chat_access(UUID, UUID) TO anon;

-- 6. Enable detailed logging for debugging
SET log_statement = 'all';
SET log_min_messages = 'log';

-- Success message
SELECT 'Comprehensive authentication fix applied successfully!' as result;

-- USAGE INSTRUCTIONS:
-- 1. Run this script in Supabase SQL editor
-- 2. Test with: SELECT * FROM diagnose_chat_access('your-team-id'::uuid, 'your-user-id'::uuid);
-- 3. Check the middleware logs in your application console
-- 4. Verify that the API endpoint now works correctly