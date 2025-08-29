-- =====================================================
-- ADDITIONAL API ENDPOINT IMPROVEMENTS
-- =====================================================
-- This script provides SQL functions that can be called from the API
-- to improve authentication and error handling

-- Function to safely get team chat messages with automatic participant enrollment
CREATE OR REPLACE FUNCTION get_team_chat_messages(
  p_team_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id BIGINT,
  team_id UUID,
  sender_id UUID,
  message_text TEXT,
  message_type TEXT,
  parent_message_id BIGINT,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_submission_id UUID
) AS $$
BEGIN
  -- Ensure user is properly enrolled in team chat
  IF NOT ensure_user_in_team_chat(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'User is not authorized for this team chat';
  END IF;
  
  -- Return messages
  RETURN QUERY
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
    COALESCE(p.display_name, 'Unknown User') as sender_name,
    p.submission_id as sender_submission_id
  FROM team_chat_messages m
  LEFT JOIN team_chat_participants p ON m.sender_id = p.user_id AND m.team_id = p.team_id
  WHERE m.team_id = p_team_id
    AND m.is_deleted = FALSE
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely send a message with automatic participant enrollment
CREATE OR REPLACE FUNCTION send_team_chat_message(
  p_team_id UUID,
  p_user_id UUID,
  p_message_text TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_parent_message_id BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  new_message_id BIGINT;
BEGIN
  -- Ensure user is properly enrolled in team chat
  IF NOT ensure_user_in_team_chat(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'User is not authorized for this team chat';
  END IF;
  
  -- Insert the message
  INSERT INTO team_chat_messages (
    team_id,
    sender_id,
    message_text,
    message_type,
    parent_message_id
  )
  VALUES (
    p_team_id,
    p_user_id,
    p_message_text,
    p_message_type,
    p_parent_message_id
  )
  RETURNING id INTO new_message_id;
  
  -- Update sender's last active time
  UPDATE team_chat_participants
  SET last_active_at = NOW()
  WHERE team_id = p_team_id AND user_id = p_user_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team participants with safety checks
CREATE OR REPLACE FUNCTION get_team_chat_participants(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  id BIGINT,
  user_id UUID,
  display_name VARCHAR(100),
  last_active_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  is_online BOOLEAN
) AS $$
BEGIN
  -- Ensure user is properly enrolled in team chat
  IF NOT ensure_user_in_team_chat(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'User is not authorized for this team chat';
  END IF;
  
  -- Return participants
  RETURN QUERY
  SELECT 
    tcp.id,
    tcp.user_id,
    tcp.display_name,
    tcp.last_active_at,
    tcp.joined_at,
    (tcp.last_active_at > NOW() - INTERVAL '5 minutes') as is_online
  FROM team_chat_participants tcp
  WHERE tcp.team_id = p_team_id
    AND tcp.is_active = TRUE
  ORDER BY tcp.last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a team
CREATE OR REPLACE FUNCTION check_team_access(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a team member
  RETURN EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_team_chat_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION send_team_chat_message(UUID, UUID, TEXT, TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_chat_participants(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_team_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_in_team_chat(UUID, UUID) TO authenticated;

-- =====================================================
-- DEBUGGING QUERIES
-- =====================================================
-- Use these queries to debug authentication issues

/*
-- Debug Query 1: Check user's teams
SELECT 
  t.id as team_id,
  t.team_name,
  tm.joined_at,
  tms.user_id,
  tcp.id as chat_participant_id,
  tcp.is_active as chat_active
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN team_chat_participants tcp ON t.id = tcp.team_id AND tms.user_id = tcp.user_id
WHERE tms.user_id = 'your-user-id-here'
ORDER BY tm.joined_at DESC;

-- Debug Query 2: Check specific team membership
SELECT 
  'Team Membership Check' as check_type,
  tm.team_id,
  tms.user_id,
  tcp.user_id as chat_user_id,
  tcp.is_active as chat_active,
  check_team_access(tm.team_id, tms.user_id) as has_access
FROM team_members tm
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN team_chat_participants tcp ON tm.team_id = tcp.team_id AND tms.user_id = tcp.user_id
WHERE tm.team_id = 'your-team-id-here' AND tms.user_id = 'your-user-id-here';

-- Debug Query 3: Check authentication flow
SELECT 
  'Authentication Flow Check' as description,
  auth.uid() as current_user_id,
  COUNT(tm.id) as team_memberships,
  COUNT(tcp.id) as chat_participations
FROM team_members tm
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN team_chat_participants tcp ON tm.team_id = tcp.team_id AND tms.user_id = tcp.user_id
WHERE tms.user_id = auth.uid();
*/