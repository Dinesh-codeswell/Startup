-- =====================================================
-- TEAM CHAT SYSTEM DATABASE SCHEMA
-- =====================================================

-- Create team_chat_messages table
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'image')),
  reply_to_message_id UUID REFERENCES team_chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_chat_participants table (for tracking who's in the chat)
CREATE TABLE IF NOT EXISTS team_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_seen_id UUID REFERENCES team_chat_messages(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, submission_id)
);

-- Create team_chat_reactions table (for message reactions)
CREATE TABLE IF NOT EXISTS team_chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  sender_submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  reaction_emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, sender_submission_id, reaction_emoji)
);

-- Create team_chat_typing_indicators table (for real-time typing indicators)
CREATE TABLE IF NOT EXISTS team_chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, submission_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for team_chat_messages
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_id ON team_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_created_at ON team_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_sender ON team_chat_messages(sender_submission_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_reply_to ON team_chat_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_not_deleted ON team_chat_messages(team_id, created_at DESC) WHERE is_deleted = FALSE;

-- Indexes for team_chat_participants
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_team_id ON team_chat_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_submission_id ON team_chat_participants(submission_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_active ON team_chat_participants(team_id) WHERE is_active = TRUE;

-- Indexes for team_chat_reactions
CREATE INDEX IF NOT EXISTS idx_team_chat_reactions_message_id ON team_chat_reactions(message_id);

-- Indexes for team_chat_typing_indicators
CREATE INDEX IF NOT EXISTS idx_team_chat_typing_team_id ON team_chat_typing_indicators(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_typing_expires ON team_chat_typing_indicators(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies for team_chat_messages (users can only see messages from their teams)
CREATE POLICY "Users can view messages from their teams" ON team_chat_messages
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their teams" ON team_chat_messages
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON team_chat_messages
  FOR UPDATE USING (
    sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Policies for team_chat_participants
CREATE POLICY "Users can view participants from their teams" ON team_chat_participants
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation" ON team_chat_participants
  FOR UPDATE USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Policies for team_chat_reactions
CREATE POLICY "Users can view reactions from their teams" ON team_chat_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM team_chat_messages 
      WHERE team_id IN (
        SELECT tm.team_id 
        FROM team_members tm 
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
        WHERE tms.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add reactions to messages in their teams" ON team_chat_reactions
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM team_chat_messages 
      WHERE team_id IN (
        SELECT tm.team_id 
        FROM team_members tm 
        JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
        WHERE tms.user_id = auth.uid()
      )
    )
    AND sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON team_chat_reactions
  FOR DELETE USING (
    sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Policies for team_chat_typing_indicators
CREATE POLICY "Users can view typing indicators from their teams" ON team_chat_typing_indicators
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own typing indicators" ON team_chat_typing_indicators
  FOR ALL USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Service role policies (for admin operations)
CREATE POLICY "Service role can manage all chat data" ON team_chat_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage participants" ON team_chat_participants
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage reactions" ON team_chat_reactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage typing indicators" ON team_chat_typing_indicators
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_team_chat_messages_updated_at
  BEFORE UPDATE ON team_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_participants_updated_at
  BEFORE UPDATE ON team_chat_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_typing_indicators_updated_at
  BEFORE UPDATE ON team_chat_typing_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add team members as chat participants when team is created
CREATE OR REPLACE FUNCTION add_team_members_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all team members as chat participants
  INSERT INTO team_chat_participants (team_id, submission_id)
  SELECT NEW.team_id, NEW.submission_id
  ON CONFLICT (team_id, submission_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add team members to chat when they join a team
CREATE TRIGGER add_member_to_chat
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION add_team_members_to_chat();

-- Function to create welcome message when team is formed
CREATE OR REPLACE FUNCTION create_team_welcome_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a welcome message for the team
  INSERT INTO team_chat_messages (team_id, sender_submission_id, message_text, message_type)
  VALUES (
    NEW.id,
    NULL, -- System message
    'Welcome to your team chat! 🎉 This is where you can collaborate, share ideas, and coordinate for case competitions. Good luck team!',
    'system'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create welcome message when team is created
CREATE TRIGGER create_welcome_message
  AFTER INSERT ON teams
  FOR EACH ROW EXECUTE FUNCTION create_team_welcome_message();

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM team_chat_typing_indicators 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_team_id UUID, user_submission_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_seen_message_id UUID;
  unread_count INTEGER;
BEGIN
  -- Get the last seen message ID for this user
  SELECT last_message_seen_id INTO last_seen_message_id
  FROM team_chat_participants 
  WHERE team_id = user_team_id AND submission_id = user_submission_id;
  
  -- Count messages after the last seen message
  IF last_seen_message_id IS NULL THEN
    -- If no last seen message, count all messages
    SELECT COUNT(*) INTO unread_count
    FROM team_chat_messages 
    WHERE team_id = user_team_id 
    AND is_deleted = FALSE 
    AND message_type != 'system';
  ELSE
    -- Count messages after the last seen message
    SELECT COUNT(*) INTO unread_count
    FROM team_chat_messages 
    WHERE team_id = user_team_id 
    AND is_deleted = FALSE 
    AND message_type != 'system'
    AND created_at > (
      SELECT created_at FROM team_chat_messages WHERE id = last_seen_message_id
    );
  END IF;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON team_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_chat_participants TO authenticated;
GRANT SELECT, INSERT, DELETE ON team_chat_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_chat_typing_indicators TO authenticated;

-- Grant permissions for sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Note: Sample data will be created automatically via triggers when teams are formed