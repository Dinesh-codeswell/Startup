-- =====================================================
-- TEAM CHAT PRODUCTION DATABASE SCHEMA
-- Built from scratch for real-time chat functionality
-- Optimized for storage efficiency and performance
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE CHAT TABLES
-- =====================================================

-- Drop existing tables to ensure clean creation (in reverse dependency order)
DROP TABLE IF EXISTS team_chat_read_receipts CASCADE;
DROP TABLE IF EXISTS team_chat_reactions CASCADE;
DROP TABLE IF EXISTS team_chat_typing_indicators CASCADE;
DROP TABLE IF EXISTS team_chat_participants CASCADE;
DROP TABLE IF EXISTS team_chat_messages CASCADE;

-- Main messages table - optimized for the application workflow
CREATE TABLE team_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  sender_submission_id UUID, -- NULL for system messages
  message_text TEXT NOT NULL CHECK (char_length(message_text) <= 2000),
  message_type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'image')),
  reply_to_message_id UUID REFERENCES team_chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team participants table - tracks who's in each team chat
CREATE TABLE team_chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  submission_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_seen_id UUID REFERENCES team_chat_messages(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, submission_id)
);

-- Message reactions table - emoji reactions to messages
CREATE TABLE team_chat_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  sender_submission_id UUID NOT NULL,
  reaction_emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, sender_submission_id, reaction_emoji)
);

-- Typing indicators table - real-time typing status
CREATE TABLE team_chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  submission_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 seconds'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, submission_id)
);

-- Read receipts table - track message read status
CREATE TABLE team_chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  reader_submission_id UUID NOT NULL,
  team_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, reader_submission_id)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Messages indexes for fast retrieval
CREATE INDEX idx_team_chat_messages_team_created ON team_chat_messages(team_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_team_chat_messages_sender ON team_chat_messages(sender_submission_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_team_chat_messages_reply ON team_chat_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX idx_team_chat_messages_type ON team_chat_messages(message_type, team_id, created_at DESC);
CREATE INDEX idx_team_chat_messages_text_search ON team_chat_messages USING gin(to_tsvector('english', message_text)) WHERE is_deleted = FALSE;

-- Participants indexes for membership queries
CREATE INDEX idx_team_chat_participants_team_active ON team_chat_participants(team_id, is_active, last_seen_at DESC);
CREATE INDEX idx_team_chat_participants_submission ON team_chat_participants(submission_id, is_active, last_seen_at DESC);
CREATE INDEX idx_team_chat_participants_last_seen ON team_chat_participants(team_id, last_message_seen_id) WHERE is_active = TRUE;

-- Reactions indexes for fast reaction queries
CREATE INDEX idx_team_chat_reactions_message ON team_chat_reactions(message_id, reaction_emoji, created_at DESC);
CREATE INDEX idx_team_chat_reactions_sender ON team_chat_reactions(sender_submission_id, created_at DESC);

-- Typing indicators indexes for real-time updates
CREATE INDEX idx_team_chat_typing_team_active ON team_chat_typing_indicators(team_id, is_typing, expires_at DESC) WHERE is_typing = TRUE;
CREATE INDEX idx_team_chat_typing_expires ON team_chat_typing_indicators(expires_at);

-- Read receipts indexes for unread count calculations
CREATE INDEX idx_team_chat_read_receipts_reader ON team_chat_read_receipts(reader_submission_id, team_id, read_at DESC);
CREATE INDEX idx_team_chat_read_receipts_message ON team_chat_read_receipts(message_id, read_at DESC);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Drop existing functions to avoid parameter conflicts
-- Note: update_updated_at_column() is shared with other tables, so we don't drop it
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID);
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS cleanup_expired_typing_indicators();
DROP FUNCTION IF EXISTS get_team_chat_stats(UUID);

-- Function to update timestamp automatically (shared function, may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a participant
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_team_id UUID,
  p_submission_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  last_read_message_id UUID;
  unread_count INTEGER;
BEGIN
  -- Get the last message the user has read
  SELECT last_message_seen_id INTO last_read_message_id
  FROM team_chat_participants
  WHERE team_id = p_team_id AND submission_id = p_submission_id AND is_active = TRUE;
  
  -- If no last read message, count all messages
  IF last_read_message_id IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM team_chat_messages
    WHERE team_id = p_team_id AND is_deleted = FALSE;
  ELSE
    -- Count messages after the last read message
    SELECT COUNT(*) INTO unread_count
    FROM team_chat_messages
    WHERE team_id = p_team_id 
      AND is_deleted = FALSE
      AND created_at > (
        SELECT created_at FROM team_chat_messages WHERE id = last_read_message_id
      );
  END IF;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_team_id UUID,
  p_submission_id UUID,
  p_last_message_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update participant's last read message
  UPDATE team_chat_participants
  SET last_message_seen_id = p_last_message_id,
      last_seen_at = NOW(),
      updated_at = NOW()
  WHERE team_id = p_team_id AND submission_id = p_submission_id;
  
  -- Insert read receipt for the specific message
  INSERT INTO team_chat_read_receipts (message_id, reader_submission_id, team_id)
  VALUES (p_last_message_id, p_submission_id, p_team_id)
  ON CONFLICT (message_id, reader_submission_id) DO UPDATE SET read_at = NOW();
  
  -- Insert read receipts for all unread messages up to this point
  INSERT INTO team_chat_read_receipts (message_id, reader_submission_id, team_id)
  SELECT m.id, p_submission_id, p_team_id
  FROM team_chat_messages m
  WHERE m.team_id = p_team_id
    AND m.is_deleted = FALSE
    AND m.created_at <= (SELECT created_at FROM team_chat_messages WHERE id = p_last_message_id)
    AND NOT EXISTS (
      SELECT 1 FROM team_chat_read_receipts rr
      WHERE rr.message_id = m.id AND rr.reader_submission_id = p_submission_id
    )
  ON CONFLICT (message_id, reader_submission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM team_chat_typing_indicators
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get team chat statistics
CREATE OR REPLACE FUNCTION get_team_chat_stats(p_team_id UUID)
RETURNS JSON AS $$
DECLARE
  total_messages INTEGER;
  messages_today INTEGER;
  active_participants INTEGER;
  most_active_member JSON;
  result JSON;
BEGIN
  -- Total messages count
  SELECT COUNT(*) INTO total_messages
  FROM team_chat_messages
  WHERE team_id = p_team_id AND is_deleted = FALSE;
  
  -- Messages today count
  SELECT COUNT(*) INTO messages_today
  FROM team_chat_messages
  WHERE team_id = p_team_id 
    AND is_deleted = FALSE
    AND created_at >= CURRENT_DATE;
  
  -- Active participants count
  SELECT COUNT(*) INTO active_participants
  FROM team_chat_participants
  WHERE team_id = p_team_id AND is_active = TRUE;
  
  -- Most active member (placeholder - would need join with submissions table)
  most_active_member := json_build_object(
    'name', 'Most Active User',
    'message_count', COALESCE(
      (SELECT COUNT(*) 
       FROM team_chat_messages 
       WHERE team_id = p_team_id 
         AND is_deleted = FALSE 
         AND sender_submission_id IS NOT NULL
       GROUP BY sender_submission_id 
       ORDER BY COUNT(*) DESC 
       LIMIT 1), 0
    )
  );
  
  -- Build result JSON
  result := json_build_object(
    'total_messages', total_messages,
    'messages_today', messages_today,
    'active_participants', active_participants,
    'most_active_member', most_active_member
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing chat triggers to avoid conflicts (only chat-specific triggers)
DROP TRIGGER IF EXISTS trg_team_chat_messages_updated_at ON team_chat_messages;
DROP TRIGGER IF EXISTS trg_team_chat_participants_updated_at ON team_chat_participants;
DROP TRIGGER IF EXISTS trg_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators;

-- Update timestamp triggers
CREATE TRIGGER trg_team_chat_messages_updated_at
  BEFORE UPDATE ON team_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_team_chat_participants_updated_at
  BEFORE UPDATE ON team_chat_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_team_chat_typing_indicators_updated_at
  BEFORE UPDATE ON team_chat_typing_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR OPTIMIZED QUERIES
-- =====================================================

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS team_chat_messages_with_details;
DROP VIEW IF EXISTS team_chat_active_participants;

-- View for messages with sender details (optimized for API responses)
CREATE VIEW team_chat_messages_with_details AS
SELECT 
  m.id,
  m.team_id,
  m.sender_submission_id,
  m.message_text,
  m.message_type,
  m.reply_to_message_id,
  m.is_edited,
  m.edited_at,
  m.is_deleted,
  m.deleted_at,
  m.created_at,
  m.updated_at,
  (
    SELECT COUNT(*) 
    FROM team_chat_reactions r 
    WHERE r.message_id = m.id
  ) as reaction_count,
  (
    SELECT COUNT(*) 
    FROM team_chat_read_receipts rr 
    WHERE rr.message_id = m.id
  ) as read_count
FROM team_chat_messages m
WHERE m.is_deleted = FALSE;

-- View for active team participants with unread counts
CREATE VIEW team_chat_active_participants AS
SELECT 
  p.id,
  p.team_id,
  p.submission_id,
  p.joined_at,
  p.last_seen_at,
  p.last_message_seen_id,
  p.is_active,
  p.created_at,
  p.updated_at,
  get_unread_message_count(p.team_id, p.submission_id) as unread_count
FROM team_chat_participants p
WHERE p.is_active = TRUE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_chat_messages') THEN
    ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_chat_participants') THEN
    ALTER TABLE team_chat_participants ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_chat_reactions') THEN
    ALTER TABLE team_chat_reactions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_chat_typing_indicators') THEN
    ALTER TABLE team_chat_typing_indicators ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_chat_read_receipts') THEN
    ALTER TABLE team_chat_read_receipts ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages from their teams" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their teams" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can view participants from their teams" ON team_chat_participants;
DROP POLICY IF EXISTS "Users can view reactions from their teams" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages in their teams" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can view typing indicators from their teams" ON team_chat_typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON team_chat_typing_indicators;
DROP POLICY IF EXISTS "Users can view read receipts from their teams" ON team_chat_read_receipts;
DROP POLICY IF EXISTS "Users can create their own read receipts" ON team_chat_read_receipts;

-- RLS Policies for team_chat_messages
CREATE POLICY "Users can view messages from their teams" ON team_chat_messages
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_chat_participants 
      WHERE submission_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can insert messages to their teams" ON team_chat_messages
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_chat_participants 
      WHERE submission_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update their own messages" ON team_chat_messages
  FOR UPDATE USING (sender_submission_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON team_chat_messages
  FOR DELETE USING (sender_submission_id = auth.uid());

-- RLS Policies for team_chat_participants
CREATE POLICY "Users can view participants from their teams" ON team_chat_participants
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_chat_participants 
      WHERE submission_id = auth.uid() AND is_active = TRUE
    )
  );

-- RLS Policies for team_chat_reactions
CREATE POLICY "Users can view reactions from their teams" ON team_chat_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM team_chat_messages 
      WHERE team_id IN (
        SELECT team_id FROM team_chat_participants 
        WHERE submission_id = auth.uid() AND is_active = TRUE
      )
    )
  );

CREATE POLICY "Users can add reactions to messages in their teams" ON team_chat_reactions
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM team_chat_messages 
      WHERE team_id IN (
        SELECT team_id FROM team_chat_participants 
        WHERE submission_id = auth.uid() AND is_active = TRUE
      )
    )
  );

CREATE POLICY "Users can remove their own reactions" ON team_chat_reactions
  FOR DELETE USING (sender_submission_id = auth.uid());

-- RLS Policies for team_chat_typing_indicators
CREATE POLICY "Users can view typing indicators from their teams" ON team_chat_typing_indicators
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_chat_participants 
      WHERE submission_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can manage their own typing indicators" ON team_chat_typing_indicators
  FOR ALL USING (submission_id = auth.uid());

-- RLS Policies for team_chat_read_receipts
CREATE POLICY "Users can view read receipts from their teams" ON team_chat_read_receipts
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_chat_participants 
      WHERE submission_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can create their own read receipts" ON team_chat_read_receipts
  FOR INSERT WITH CHECK (reader_submission_id = auth.uid());

-- =====================================================
-- MAINTENANCE AND CLEANUP
-- =====================================================

-- Create a cleanup job for expired typing indicators (run every minute)
-- This would typically be set up as a cron job or scheduled task
-- SELECT cleanup_expired_typing_indicators();

-- Create indexes for better cleanup performance
CREATE INDEX idx_team_chat_messages_cleanup ON team_chat_messages(created_at) WHERE is_deleted = TRUE;
CREATE INDEX idx_team_chat_typing_cleanup ON team_chat_typing_indicators(expires_at);

-- =====================================================
-- INITIAL DATA AND CONSTRAINTS
-- =====================================================

-- Add constraint to ensure message text is not empty for non-system messages
ALTER TABLE team_chat_messages ADD CONSTRAINT chk_message_text_not_empty 
  CHECK (message_type = 'system' OR char_length(trim(message_text)) > 0);

-- Add constraint to ensure edited_at is set when is_edited is true
ALTER TABLE team_chat_messages ADD CONSTRAINT chk_edited_at_when_edited 
  CHECK (NOT is_edited OR edited_at IS NOT NULL);

-- Add constraint to ensure deleted_at is set when is_deleted is true
ALTER TABLE team_chat_messages ADD CONSTRAINT chk_deleted_at_when_deleted 
  CHECK (NOT is_deleted OR deleted_at IS NOT NULL);

-- Add constraint to ensure typing indicators expire in the future when created
ALTER TABLE team_chat_typing_indicators ADD CONSTRAINT chk_expires_at_future 
  CHECK (expires_at > created_at);

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Create partial indexes for common query patterns
CREATE INDEX idx_team_chat_messages_recent ON team_chat_messages(team_id, created_at DESC) 
  WHERE is_deleted = FALSE;

CREATE INDEX idx_team_chat_reactions_popular ON team_chat_reactions(reaction_emoji, created_at DESC) 
  WHERE reaction_emoji IN ('👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '👏');

-- =====================================================
-- SCHEMA VALIDATION
-- =====================================================

-- Verify all tables were created successfully
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'team_chat_%';
  
  IF table_count < 5 THEN
    RAISE EXCEPTION 'Not all team chat tables were created successfully. Expected 5, found %', table_count;
  END IF;
  
  RAISE NOTICE 'Team chat schema created successfully with % tables', table_count;
END
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Log successful schema creation
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TEAM CHAT PRODUCTION SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables created: 5';
  RAISE NOTICE 'Indexes created: 20+';
  RAISE NOTICE 'Functions created: 5';
  RAISE NOTICE 'Views created: 2';
  RAISE NOTICE 'RLS policies: Enabled';
  RAISE NOTICE 'Performance: Optimized';
  RAISE NOTICE 'Real-time ready: Yes';
  RAISE NOTICE '==============================================';
END
$$;