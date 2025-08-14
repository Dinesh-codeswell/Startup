-- =====================================================
-- CONSOLIDATED DATABASE SETUP SCRIPT
-- Handles all RLS policies safely without conflicts
-- =====================================================

-- =====================================================
-- PROFILES TABLE SETUP
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TEAM MATCHING TABLES SETUP
-- =====================================================

-- Create team_matching_submissions table
CREATE TABLE IF NOT EXISTS team_matching_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  college_name TEXT NOT NULL,
  course TEXT,
  current_year TEXT NOT NULL,
  core_strengths TEXT[] NOT NULL DEFAULT '{}',
  preferred_roles TEXT[] NOT NULL DEFAULT '{}',
  preferred_teammate_roles TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL,
  experience TEXT NOT NULL,
  case_preferences TEXT[] NOT NULL DEFAULT '{}',
  preferred_team_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_match' CHECK (status IN ('pending_match', 'matched', 'team_formed', 'inactive')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT,
  team_size INTEGER NOT NULL,
  compatibility_score DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  chat_group_id TEXT,
  chat_group_invite_link TEXT,
  formed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table (junction table)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  role_in_team TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, submission_id)
);

-- Create team_matching_batches table
CREATE TABLE IF NOT EXISTS team_matching_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  teams_formed INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  matching_algorithm_version TEXT,
  admin_user_id UUID REFERENCES auth.users(id),
  formation_method TEXT DEFAULT 'automated' CHECK (formation_method IN ('automated', 'manual', 'csv_import')),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_notifications table
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('team_formed', 'team_updated', 'chat_created', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivery_method TEXT[] DEFAULT '{}' CHECK (delivery_method <@ ARRAY['email', 'sms', 'whatsapp']),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TEAM CHAT TABLES SETUP
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

-- Create team_chat_participants table
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

-- Create team_chat_reactions table
CREATE TABLE IF NOT EXISTS team_chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  sender_submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  reaction_emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, sender_submission_id, reaction_emoji)
);

-- Create team_chat_typing_indicators table
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
-- AUDIT TRAIL TABLE
-- =====================================================

-- Create audit log table for tracking important changes
CREATE TABLE IF NOT EXISTS team_formation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('team_created', 'team_approved', 'team_rejected', 'member_added', 'member_removed', 'status_changed')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  admin_user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Team matching indexes
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_status ON team_matching_submissions(status);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_email ON team_matching_submissions(email);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_submitted_at ON team_matching_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_user_id ON team_matching_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_formed_at ON teams(formed_at);
CREATE INDEX IF NOT EXISTS idx_teams_approval_status ON teams(approval_status);
CREATE INDEX IF NOT EXISTS idx_teams_approved_by ON teams(approved_by);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_submission_id ON team_members(submission_id);

CREATE INDEX IF NOT EXISTS idx_team_notifications_submission_id ON team_notifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_delivery_status ON team_notifications(delivery_status);

-- Team chat indexes
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_id ON team_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_created_at ON team_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_sender ON team_chat_messages(sender_submission_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_not_deleted ON team_chat_messages(team_id, created_at DESC) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_team_chat_participants_team_id ON team_chat_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_submission_id ON team_chat_participants(submission_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_participants_active ON team_chat_participants(team_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_team_chat_reactions_message_id ON team_chat_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_team_chat_typing_team_id ON team_chat_typing_indicators(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_typing_expires ON team_chat_typing_indicators(expires_at);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_team_formation_audit_action ON team_formation_audit(action);
CREATE INDEX IF NOT EXISTS idx_team_formation_audit_table_record ON team_formation_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_team_formation_audit_admin_user ON team_formation_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_formation_audit_created_at ON team_formation_audit(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE team_matching_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_matching_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_formation_audit ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL EXISTING POLICIES (SAFE CLEANUP)
-- =====================================================

-- Team matching policies
DROP POLICY IF EXISTS "Users can view own submissions" ON team_matching_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON team_matching_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON team_matching_submissions;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view their notifications" ON team_notifications;
DROP POLICY IF EXISTS "Service role can manage all data" ON team_matching_submissions;
DROP POLICY IF EXISTS "Service role can manage teams" ON teams;
DROP POLICY IF EXISTS "Service role can manage team_members" ON team_members;
DROP POLICY IF EXISTS "Service role can manage batches" ON team_matching_batches;
DROP POLICY IF EXISTS "Service role can manage notifications" ON team_notifications;

-- Team chat policies
DROP POLICY IF EXISTS "Users can view messages from their teams" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their teams" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON team_chat_messages;
DROP POLICY IF EXISTS "Users can view participants from their teams" ON team_chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON team_chat_participants;
DROP POLICY IF EXISTS "Users can view reactions from their teams" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages in their teams" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON team_chat_reactions;
DROP POLICY IF EXISTS "Users can view typing indicators from their teams" ON team_chat_typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON team_chat_typing_indicators;
DROP POLICY IF EXISTS "Service role can manage all chat data" ON team_chat_messages;
DROP POLICY IF EXISTS "Service role can manage participants" ON team_chat_participants;
DROP POLICY IF EXISTS "Service role can manage reactions" ON team_chat_reactions;
DROP POLICY IF EXISTS "Service role can manage typing indicators" ON team_chat_typing_indicators;

-- =====================================================
-- CREATE STANDARDIZED RLS POLICIES
-- =====================================================

-- Team matching submissions policies
CREATE POLICY "tm_submissions_select_own" ON team_matching_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tm_submissions_insert_own" ON team_matching_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tm_submissions_update_own" ON team_matching_submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tm_submissions_service_role" ON team_matching_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Teams policies
CREATE POLICY "teams_select_member" ON teams
  FOR SELECT USING (
    id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "teams_service_role" ON teams
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team members policies
CREATE POLICY "team_members_select_own" ON team_members
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_service_role" ON team_members
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team matching batches policies (admin only)
CREATE POLICY "tm_batches_service_role" ON team_matching_batches
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team notifications policies
CREATE POLICY "notifications_select_own" ON team_notifications
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_service_role" ON team_notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team chat messages policies
CREATE POLICY "chat_messages_select_team" ON team_chat_messages
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert_team" ON team_chat_messages
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND (
      sender_submission_id IN (
        SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
      )
      OR sender_submission_id IS NULL -- Allow system messages
    )
  );

CREATE POLICY "chat_messages_update_own" ON team_chat_messages
  FOR UPDATE USING (
    sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_service_role" ON team_chat_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team chat participants policies
CREATE POLICY "chat_participants_select_team" ON team_chat_participants
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_participants_update_own" ON team_chat_participants
  FOR UPDATE USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_participants_service_role" ON team_chat_participants
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team chat reactions policies
CREATE POLICY "chat_reactions_select_team" ON team_chat_reactions
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

CREATE POLICY "chat_reactions_insert_team" ON team_chat_reactions
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

CREATE POLICY "chat_reactions_delete_own" ON team_chat_reactions
  FOR DELETE USING (
    sender_submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_reactions_service_role" ON team_chat_reactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Team chat typing indicators policies
CREATE POLICY "chat_typing_select_team" ON team_chat_typing_indicators
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_typing_manage_own" ON team_chat_typing_indicators
  FOR ALL USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_typing_service_role" ON team_chat_typing_indicators
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Audit trail policies (admin only)
CREATE POLICY "audit_service_role" ON team_formation_audit
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Drop existing triggers to avoid conflicts (safe to drop triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_team_matching_batches_updated_at ON team_matching_batches;
DROP TRIGGER IF EXISTS update_team_chat_messages_updated_at ON team_chat_messages;
DROP TRIGGER IF EXISTS update_team_chat_participants_updated_at ON team_chat_participants;

-- Drop functions only if they're not being used by other objects
DO $$
BEGIN
    -- Check if handle_new_user function has dependencies
    IF NOT EXISTS (
        SELECT 1 FROM pg_depend d 
        JOIN pg_proc p ON d.objid = p.oid 
        WHERE p.proname = 'handle_new_user' AND d.deptype = 'n'
    ) THEN
        DROP FUNCTION IF EXISTS handle_new_user();
        RAISE NOTICE 'Dropped handle_new_user function';
    ELSE
        RAISE NOTICE 'Keeping handle_new_user function (has dependencies)';
    END IF;
    
    -- Note: update_updated_at_column() is kept and will use CREATE OR REPLACE
    RAISE NOTICE 'Using CREATE OR REPLACE for update_updated_at_column function';
END $$;
DROP TRIGGER IF EXISTS update_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators;
DROP TRIGGER IF EXISTS update_submission_on_team_join ON team_members;
DROP TRIGGER IF EXISTS add_member_to_chat ON team_members;
DROP TRIGGER IF EXISTS create_welcome_message ON teams;
DROP FUNCTION IF EXISTS update_submission_status_on_team_formation();
DROP FUNCTION IF EXISTS add_team_members_to_chat();
DROP FUNCTION IF EXISTS create_team_welcome_message();
DROP FUNCTION IF EXISTS cleanup_expired_typing_indicators();
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID);
DROP FUNCTION IF EXISTS get_team_matching_stats();

-- Create user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, email, college_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'college_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_matching_submissions_updated_at
  BEFORE UPDATE ON team_matching_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_matching_batches_updated_at
  BEFORE UPDATE ON team_matching_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_messages_updated_at
  BEFORE UPDATE ON team_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_participants_updated_at
  BEFORE UPDATE ON team_chat_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_typing_indicators_updated_at
  BEFORE UPDATE ON team_chat_typing_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team formation functions
CREATE OR REPLACE FUNCTION update_submission_status_on_team_formation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE team_matching_submissions 
  SET status = 'team_formed', matched_at = NOW()
  WHERE id IN (
    SELECT submission_id FROM team_members WHERE team_id = NEW.team_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submission_on_team_join
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_submission_status_on_team_formation();

-- Chat integration functions
CREATE OR REPLACE FUNCTION add_team_members_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_chat_participants (team_id, submission_id)
  SELECT NEW.team_id, NEW.submission_id
  ON CONFLICT (team_id, submission_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_member_to_chat
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION add_team_members_to_chat();

CREATE OR REPLACE FUNCTION create_team_welcome_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create welcome message if team is approved or no approval required
  IF NEW.approval_status = 'approved' OR NEW.approval_status IS NULL THEN
    INSERT INTO team_chat_messages (team_id, sender_submission_id, message_text, message_type)
    VALUES (
      NEW.id,
      NULL,
      'Welcome to your team chat! 🎉 This is where you can collaborate, share ideas, and coordinate for case competitions. Good luck team!',
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_welcome_message
  AFTER INSERT ON teams
  FOR EACH ROW EXECUTE FUNCTION create_team_welcome_message();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := TG_TABLE_NAME || '_created';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := TG_TABLE_NAME || '_updated';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := TG_TABLE_NAME || '_deleted';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO team_formation_audit (
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    admin_user_id
  ) VALUES (
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    CASE 
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN auth.uid()
      ELSE NULL
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_teams
  AFTER INSERT OR UPDATE OR DELETE ON teams
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_team_members
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Function to handle team approval
CREATE OR REPLACE FUNCTION handle_team_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If team status changed to approved, create welcome message
  IF OLD.approval_status != 'approved' AND NEW.approval_status = 'approved' THEN
    INSERT INTO team_chat_messages (team_id, sender_submission_id, message_text, message_type)
    VALUES (
      NEW.id,
      NULL,
      'Your team has been approved! 🎉 Welcome to your team chat. This is where you can collaborate, share ideas, and coordinate for case competitions. Good luck team!',
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_team_approval_trigger
  AFTER UPDATE ON teams
  FOR EACH ROW 
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION handle_team_approval();

-- Utility functions
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM team_chat_typing_indicators 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_message_count(user_team_id UUID, user_submission_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_seen_message_id UUID;
  unread_count INTEGER;
BEGIN
  SELECT last_message_seen_id INTO last_seen_message_id
  FROM team_chat_participants 
  WHERE team_id = user_team_id AND submission_id = user_submission_id;
  
  IF last_seen_message_id IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM team_chat_messages 
    WHERE team_id = user_team_id 
    AND is_deleted = FALSE 
    AND message_type != 'system';
  ELSE
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

CREATE OR REPLACE FUNCTION get_team_matching_stats()
RETURNS TABLE (
  total_submissions BIGINT,
  pending_submissions BIGINT,
  matched_submissions BIGINT,
  total_teams BIGINT,
  active_teams BIGINT,
  approved_teams BIGINT,
  pending_approval_teams BIGINT,
  avg_team_size DECIMAL,
  avg_compatibility_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM team_matching_submissions) as total_submissions,
    (SELECT COUNT(*) FROM team_matching_submissions WHERE status = 'pending_match') as pending_submissions,
    (SELECT COUNT(*) FROM team_matching_submissions WHERE status IN ('matched', 'team_formed')) as matched_submissions,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM teams WHERE status = 'active') as active_teams,
    (SELECT COUNT(*) FROM teams WHERE approval_status = 'approved') as approved_teams,
    (SELECT COUNT(*) FROM teams WHERE approval_status = 'pending') as pending_approval_teams,
    (SELECT AVG(team_size) FROM teams WHERE status = 'active') as avg_team_size,
    (SELECT AVG(compatibility_score) FROM teams WHERE status = 'active') as avg_compatibility_score;
END;
$$ LANGUAGE plpgsql;

-- Function to export submissions for CSV processing
CREATE OR REPLACE FUNCTION export_pending_submissions_for_csv()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  whatsapp_number TEXT,
  college_name TEXT,
  course TEXT,
  current_year TEXT,
  core_strengths TEXT,
  preferred_roles TEXT,
  preferred_teammate_roles TEXT,
  availability TEXT,
  experience TEXT,
  case_preferences TEXT,
  preferred_team_size INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.whatsapp_number,
    s.college_name,
    s.course,
    s.current_year,
    array_to_string(s.core_strengths, ';') as core_strengths,
    array_to_string(s.preferred_roles, ';') as preferred_roles,
    array_to_string(s.preferred_teammate_roles, ';') as preferred_teammate_roles,
    s.availability,
    s.experience,
    array_to_string(s.case_preferences, ';') as case_preferences,
    s.preferred_team_size,
    s.submitted_at
  FROM team_matching_submissions s
  WHERE s.status = 'pending_match'
  ORDER BY s.submitted_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a team and activate chat
CREATE OR REPLACE FUNCTION approve_team(team_uuid UUID, approver_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update team approval status
  UPDATE teams 
  SET 
    approval_status = 'approved',
    approved_by = approver_uuid,
    approved_at = NOW()
  WHERE id = team_uuid;
  
  -- Check if update was successful
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_matching_submissions TO authenticated;
GRANT SELECT ON teams TO authenticated;
GRANT SELECT ON team_members TO authenticated;
GRANT SELECT ON team_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_chat_participants TO authenticated;
GRANT SELECT, INSERT, DELETE ON team_chat_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_chat_typing_indicators TO authenticated;

-- Grant audit table permissions (admin only via RLS)
GRANT SELECT ON team_formation_audit TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample team matching batch
INSERT INTO team_matching_batches (batch_name, status) 
VALUES ('Initial Launch Batch', 'pending')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'All tables, indexes, RLS policies, functions, and triggers have been created.';
  RAISE NOTICE 'The database is ready for use.';
END $$;