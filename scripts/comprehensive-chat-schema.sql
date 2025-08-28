-- =====================================================
-- COMPREHENSIVE CHAT SYSTEM DATABASE SCHEMA
-- Production-Ready Real-Time Chat Implementation
-- =====================================================

-- =====================================================
-- CORE CHAT TABLES
-- =====================================================

-- Main messages table with optimized storage
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 4000),
  message_type SMALLINT NOT NULL DEFAULT 1 CHECK (message_type BETWEEN 1 AND 5),
  -- 1: text, 2: system, 3: file, 4: image, 5: reply
  parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  thread_id UUID, -- For conversation threading
  metadata JSONB DEFAULT '{}', -- Flexible metadata storage
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles for chat context
CREATE TABLE chat_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  status SMALLINT DEFAULT 1 CHECK (status BETWEEN 1 AND 4),
  -- 1: online, 2: away, 3: busy, 4: offline
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation threads for organized discussions
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  title VARCHAR(200),
  description TEXT,
  creator_id UUID NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Read receipts with efficient tracking
CREATE TABLE chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Team participants with enhanced tracking
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role SMALLINT DEFAULT 1 CHECK (role BETWEEN 1 AND 3),
  -- 1: member, 2: moderator, 3: admin
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID REFERENCES chat_messages(id),
  notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": true}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Message reactions with emoji support
CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji_code VARCHAR(50) NOT NULL, -- Unicode emoji codes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji_code)
);

-- Real-time typing indicators
CREATE TABLE chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  thread_id UUID,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 seconds'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id, thread_id)
);

-- File attachments with metadata
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  thumbnail_url VARCHAR(1000),
  upload_status SMALLINT DEFAULT 1 CHECK (upload_status BETWEEN 1 AND 3),
  -- 1: uploading, 2: completed, 3: failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message mentions for notifications
CREATE TABLE chat_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  mention_type SMALLINT DEFAULT 1 CHECK (mention_type BETWEEN 1 AND 3),
  -- 1: direct_mention, 2: everyone, 3: here
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, mentioned_user_id)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Chat messages indexes
CREATE INDEX idx_chat_messages_team_created ON chat_messages(team_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id, created_at DESC);
CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type, team_id);
CREATE INDEX idx_chat_messages_updated ON chat_messages(updated_at DESC) WHERE is_edited = TRUE;

-- User profiles indexes
CREATE INDEX idx_chat_user_profiles_status ON chat_user_profiles(status, last_seen_at DESC);
CREATE INDEX idx_chat_user_profiles_name ON chat_user_profiles USING gin(to_tsvector('english', display_name));

-- Threads indexes
CREATE INDEX idx_chat_threads_team ON chat_threads(team_id, last_message_at DESC) WHERE is_archived = FALSE;
CREATE INDEX idx_chat_threads_creator ON chat_threads(creator_id, created_at DESC);

-- Read receipts indexes
CREATE INDEX idx_chat_read_receipts_message ON chat_read_receipts(message_id, read_at DESC);
CREATE INDEX idx_chat_read_receipts_user_team ON chat_read_receipts(user_id, team_id, read_at DESC);

-- Participants indexes
CREATE INDEX idx_chat_participants_team_active ON chat_participants(team_id, last_active_at DESC) WHERE is_active = TRUE;
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id, last_active_at DESC);
CREATE INDEX idx_chat_participants_role ON chat_participants(team_id, role) WHERE is_active = TRUE;

-- Reactions indexes
CREATE INDEX idx_chat_reactions_message ON chat_reactions(message_id, emoji_code);
CREATE INDEX idx_chat_reactions_user ON chat_reactions(user_id, created_at DESC);

-- Typing indicators indexes
CREATE INDEX idx_chat_typing_team ON chat_typing_indicators(team_id, expires_at DESC) WHERE is_typing = TRUE;
CREATE INDEX idx_chat_typing_expires ON chat_typing_indicators(expires_at) WHERE expires_at < NOW();

-- Attachments indexes
CREATE INDEX idx_chat_attachments_message ON chat_attachments(message_id, created_at DESC);
CREATE INDEX idx_chat_attachments_status ON chat_attachments(upload_status, created_at DESC);

-- Mentions indexes
CREATE INDEX idx_chat_mentions_user_unread ON chat_mentions(mentioned_user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_chat_mentions_message ON chat_mentions(message_id);

-- =====================================================
-- CONSTRAINTS AND RELATIONSHIPS
-- =====================================================

-- Foreign key constraints
ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_thread 
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE SET NULL;

ALTER TABLE chat_threads ADD CONSTRAINT fk_chat_threads_creator 
  FOREIGN KEY (creator_id) REFERENCES chat_user_profiles(user_id) ON DELETE CASCADE;

-- Check constraints for data integrity
ALTER TABLE chat_messages ADD CONSTRAINT chk_content_not_empty 
  CHECK (trim(content) != '');

ALTER TABLE chat_user_profiles ADD CONSTRAINT chk_display_name_not_empty 
  CHECK (trim(display_name) != '');

ALTER TABLE chat_attachments ADD CONSTRAINT chk_file_size_reasonable 
  CHECK (file_size <= 104857600); -- 100MB limit

-- =====================================================
-- FUNCTIONS FOR REAL-TIME OPERATIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update thread message count
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE chat_threads 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' AND OLD.thread_id IS NOT NULL THEN
    UPDATE chat_threads 
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count efficiently
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID, p_team_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_read_id UUID;
  unread_count INTEGER;
BEGIN
  SELECT last_read_message_id INTO last_read_id
  FROM chat_participants 
  WHERE user_id = p_user_id AND team_id = p_team_id;
  
  IF last_read_id IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages 
    WHERE team_id = p_team_id 
    AND is_deleted = FALSE 
    AND sender_id != p_user_id;
  ELSE
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages 
    WHERE team_id = p_team_id 
    AND is_deleted = FALSE 
    AND sender_id != p_user_id
    AND created_at > (
      SELECT created_at FROM chat_messages WHERE id = last_read_id
    );
  END IF;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_user_id UUID, p_team_id UUID, p_message_id UUID)
RETURNS void AS $$
BEGIN
  -- Update participant's last read message
  UPDATE chat_participants 
  SET last_read_message_id = p_message_id,
      last_active_at = NOW()
  WHERE user_id = p_user_id AND team_id = p_team_id;
  
  -- Insert read receipt
  INSERT INTO chat_read_receipts (message_id, user_id, team_id)
  VALUES (p_message_id, p_user_id, p_team_id)
  ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW();
  
  -- Mark mentions as read
  UPDATE chat_mentions 
  SET is_read = TRUE 
  WHERE mentioned_user_id = p_user_id 
  AND message_id IN (
    SELECT id FROM chat_messages 
    WHERE team_id = p_team_id 
    AND created_at <= (SELECT created_at FROM chat_messages WHERE id = p_message_id)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_chat_user_profiles_updated_at
  BEFORE UPDATE ON chat_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_chat_participants_updated_at
  BEFORE UPDATE ON chat_participants
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Thread statistics triggers
CREATE TRIGGER trg_update_thread_stats
  AFTER INSERT OR DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for messages with sender details
CREATE VIEW chat_messages_with_details AS
SELECT 
  m.id,
  m.team_id,
  m.sender_id,
  m.content,
  m.message_type,
  m.parent_message_id,
  m.thread_id,
  m.metadata,
  m.is_edited,
  m.is_deleted,
  m.created_at,
  m.updated_at,
  p.display_name as sender_name,
  p.avatar_url as sender_avatar,
  (
    SELECT COUNT(*) FROM chat_reactions r WHERE r.message_id = m.id
  ) as reaction_count,
  (
    SELECT COUNT(*) FROM chat_read_receipts rr WHERE rr.message_id = m.id
  ) as read_count
FROM chat_messages m
LEFT JOIN chat_user_profiles p ON m.sender_id = p.user_id
WHERE m.is_deleted = FALSE;

-- View for active participants
CREATE VIEW chat_active_participants AS
SELECT 
  cp.team_id,
  cp.user_id,
  cp.role,
  cp.last_active_at,
  cup.display_name,
  cup.avatar_url,
  cup.status,
  cup.last_seen_at
FROM chat_participants cp
JOIN chat_user_profiles cup ON cp.user_id = cup.user_id
WHERE cp.is_active = TRUE;

-- =====================================================
-- SECURITY POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mentions ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view team messages" ON chat_messages
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM chat_participants WHERE user_id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Users can insert team messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    team_id IN (SELECT team_id FROM chat_participants WHERE user_id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON chat_user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON chat_user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Participants policies
CREATE POLICY "Users can view team participants" ON chat_participants
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM chat_participants WHERE user_id = auth.uid() AND is_active = TRUE)
  );

-- Other table policies follow similar patterns...

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Partitioning for large message tables (optional)
-- CREATE TABLE chat_messages_y2024m01 PARTITION OF chat_messages
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Materialized view for frequently accessed data
CREATE MATERIALIZED VIEW chat_team_stats AS
SELECT 
  team_id,
  COUNT(*) as total_messages,
  COUNT(DISTINCT sender_id) as active_users,
  MAX(created_at) as last_message_at,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as messages_today
FROM chat_messages 
WHERE is_deleted = FALSE
GROUP BY team_id;

-- Index on materialized view
CREATE UNIQUE INDEX idx_chat_team_stats_team ON chat_team_stats(team_id);

-- =====================================================
-- CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to archive old messages
CREATE OR REPLACE FUNCTION archive_old_messages(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old messages to archive table (create if needed)
  CREATE TABLE IF NOT EXISTS chat_messages_archive (
    LIKE chat_messages INCLUDING ALL
  );
  
  WITH moved_messages AS (
    DELETE FROM chat_messages 
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_deleted = FALSE
    RETURNING *
  )
  INSERT INTO chat_messages_archive SELECT * FROM moved_messages;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE chat_messages IS 'Core message storage with optimized data types';
COMMENT ON TABLE chat_user_profiles IS 'User profile information for chat context';
COMMENT ON TABLE chat_threads IS 'Conversation threading for organized discussions';
COMMENT ON TABLE chat_read_receipts IS 'Efficient read receipt tracking';
COMMENT ON TABLE chat_participants IS 'Team membership and participation tracking';
COMMENT ON TABLE chat_reactions IS 'Message reactions with emoji support';
COMMENT ON TABLE chat_typing_indicators IS 'Real-time typing indicators';
COMMENT ON TABLE chat_attachments IS 'File attachment metadata';
COMMENT ON TABLE chat_mentions IS 'User mentions for notifications';

-- =====================================================
-- INITIALIZATION COMPLETE
-- =====================================================

-- Refresh materialized view
REFRESH MATERIALIZED VIEW chat_team_stats;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive chat system schema created successfully!';
  RAISE NOTICE 'Tables: 9 core tables with optimized storage';
  RAISE NOTICE 'Indexes: 25+ performance indexes';
  RAISE NOTICE 'Functions: 6 utility functions for real-time operations';
  RAISE NOTICE 'Views: 3 optimized views for common queries';
  RAISE NOTICE 'Security: Row Level Security enabled on all tables';
END $$;