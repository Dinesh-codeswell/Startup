-- =====================================================
-- FIX CHAT AUTHENTICATION ISSUES
-- =====================================================
-- This script fixes the 401 Unauthorized error in team chat
-- by ensuring users are properly added to team_chat_participants

-- Step 1: Drop and recreate the add_team_members_to_chat function
-- The current function is missing user_id and display_name fields

DROP FUNCTION IF EXISTS add_team_members_to_chat();

CREATE OR REPLACE FUNCTION add_team_members_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user details from the submission
  SELECT 
    tms.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.email, 'Team Member') as display_name
  INTO user_record
  FROM team_matching_submissions tms
  LEFT JOIN profiles p ON tms.user_id = p.id
  WHERE tms.id = NEW.submission_id;
  
  -- Insert into team_chat_participants with all required fields
  INSERT INTO team_chat_participants (
    team_id, 
    user_id, 
    submission_id, 
    display_name,
    joined_at,
    is_active
  )
  VALUES (
    NEW.team_id,
    user_record.user_id,
    NEW.submission_id,
    user_record.display_name,
    NOW(),
    TRUE
  )
  ON CONFLICT (team_id, user_id) DO UPDATE SET
    is_active = TRUE,
    joined_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS add_member_to_chat ON team_members;
CREATE TRIGGER add_member_to_chat
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION add_team_members_to_chat();

-- Step 2: Fix existing teams that might be missing participants
-- This will add any missing team members to team_chat_participants

INSERT INTO team_chat_participants (
  team_id,
  user_id,
  submission_id,
  display_name,
  joined_at,
  is_active
)
SELECT DISTINCT
  tm.team_id,
  tms.user_id,
  tm.submission_id,
  COALESCE(p.first_name || ' ' || p.last_name, p.email, 'Team Member') as display_name,
  tm.joined_at,
  TRUE
FROM team_members tm
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN profiles p ON tms.user_id = p.id
LEFT JOIN team_chat_participants tcp ON tcp.team_id = tm.team_id AND tcp.user_id = tms.user_id
WHERE tcp.id IS NULL -- Only insert if not already exists
ON CONFLICT (team_id, user_id) DO UPDATE SET
  is_active = TRUE,
  submission_id = EXCLUDED.submission_id,
  display_name = EXCLUDED.display_name;

-- Step 3: Update the team_chat_messages_with_sender view to handle missing participants
-- This ensures the view works even if there are data inconsistencies

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
    COALESCE(p.display_name, 'Unknown User') as sender_name,
    p.submission_id as sender_submission_id
FROM team_chat_messages m
LEFT JOIN team_chat_participants p ON m.sender_id = p.user_id AND m.team_id = p.team_id
WHERE m.sender_id IS NULL OR p.is_active = TRUE OR p.is_active IS NULL;

-- Step 4: Create a function to ensure user is added to chat when accessing
-- This is a safety net for any edge cases

CREATE OR REPLACE FUNCTION ensure_user_in_team_chat(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_submission_id UUID;
  user_display_name TEXT;
BEGIN
  -- Check if user is already in team_chat_participants
  IF EXISTS (
    SELECT 1 FROM team_chat_participants 
    WHERE team_id = p_team_id AND user_id = p_user_id AND is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a team member
  SELECT tm.submission_id INTO user_submission_id
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id AND tms.user_id = p_user_id;
  
  IF user_submission_id IS NULL THEN
    RETURN FALSE; -- User is not a team member
  END IF;
  
  -- Get user display name
  SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email, 'Team Member')
  INTO user_display_name
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- Add user to team_chat_participants
  INSERT INTO team_chat_participants (
    team_id,
    user_id,
    submission_id,
    display_name,
    joined_at,
    is_active
  )
  VALUES (
    p_team_id,
    p_user_id,
    user_submission_id,
    user_display_name,
    NOW(),
    TRUE
  )
  ON CONFLICT (team_id, user_id) DO UPDATE SET
    is_active = TRUE,
    submission_id = EXCLUDED.submission_id,
    display_name = EXCLUDED.display_name;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_team_user 
  ON team_chat_participants(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_team_chat_participants_active 
  ON team_chat_participants(team_id, is_active) WHERE is_active = TRUE;

-- Step 6: Verify the fix by checking participant counts
SELECT 
  'Team Members vs Chat Participants Comparison' as check_name,
  COUNT(DISTINCT tm.team_id) as teams_with_members,
  COUNT(DISTINCT tcp.team_id) as teams_with_chat_participants,
  COUNT(DISTINCT tm.team_id) - COUNT(DISTINCT tcp.team_id) as missing_chat_teams
FROM team_members tm
FULL OUTER JOIN team_chat_participants tcp ON tm.team_id = tcp.team_id;

-- Show any teams that still have missing participants
SELECT 
  tm.team_id,
  COUNT(tm.submission_id) as team_member_count,
  COUNT(tcp.user_id) as chat_participant_count,
  COUNT(tm.submission_id) - COUNT(tcp.user_id) as missing_participants
FROM team_members tm
LEFT JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN team_chat_participants tcp ON tm.team_id = tcp.team_id AND tms.user_id = tcp.user_id
GROUP BY tm.team_id
HAVING COUNT(tm.submission_id) != COUNT(tcp.user_id)
ORDER BY missing_participants DESC;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries after executing the fix to verify everything works

/*
-- Query 1: Check if all team members are now in team_chat_participants
SELECT 
  'All team members should have chat participants' as description,
  COUNT(*) as total_team_members,
  COUNT(tcp.id) as members_with_chat_access,
  COUNT(*) - COUNT(tcp.id) as missing_chat_access
FROM team_members tm
JOIN team_matching_submissions tms ON tm.submission_id = tms.id
LEFT JOIN team_chat_participants tcp ON tm.team_id = tcp.team_id AND tms.user_id = tcp.user_id AND tcp.is_active = TRUE;

-- Query 2: Test the ensure_user_in_team_chat function
-- Replace with actual team_id and user_id for testing
-- SELECT ensure_user_in_team_chat('your-team-id-here', 'your-user-id-here');

-- Query 3: Check team chat messages view
SELECT 
  team_id,
  COUNT(*) as message_count,
  COUNT(DISTINCT sender_name) as unique_senders
FROM team_chat_messages_with_sender
GROUP BY team_id
ORDER BY message_count DESC
LIMIT 10;
*/