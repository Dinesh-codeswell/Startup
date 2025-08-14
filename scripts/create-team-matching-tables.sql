-- =====================================================
-- TEAM MATCHING SYSTEM DATABASE SCHEMA
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
  chat_group_id TEXT, -- WhatsApp/Discord group ID
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

-- Create team_matching_batches table (for tracking batch processing)
CREATE TABLE IF NOT EXISTS team_matching_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  teams_formed INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  matching_algorithm_version TEXT,
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
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for team_matching_submissions
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_status ON team_matching_submissions(status);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_email ON team_matching_submissions(email);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_submitted_at ON team_matching_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_team_matching_submissions_user_id ON team_matching_submissions(user_id);

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_formed_at ON teams(formed_at);

-- Indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_submission_id ON team_members(submission_id);

-- Indexes for team_notifications
CREATE INDEX IF NOT EXISTS idx_team_notifications_submission_id ON team_notifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_delivery_status ON team_notifications(delivery_status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE team_matching_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_matching_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for team_matching_submissions
CREATE POLICY "Users can view own submissions" ON team_matching_submissions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own submissions" ON team_matching_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own submissions" ON team_matching_submissions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies for teams (users can view teams they're part of)
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Policies for team_members
CREATE POLICY "Users can view their team memberships" ON team_members
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Policies for team_notifications
CREATE POLICY "Users can view their notifications" ON team_notifications
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM team_matching_submissions WHERE user_id = auth.uid()
    )
  );

-- Admin policies (for service role)
CREATE POLICY "Service role can manage all data" ON team_matching_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage teams" ON teams
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage team_members" ON team_members
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage batches" ON team_matching_batches
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage notifications" ON team_notifications
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
CREATE TRIGGER update_team_matching_submissions_updated_at
  BEFORE UPDATE ON team_matching_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_matching_batches_updated_at
  BEFORE UPDATE ON team_matching_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update submission status when team is formed
CREATE OR REPLACE FUNCTION update_submission_status_on_team_formation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all submissions in this team to 'team_formed' status
  UPDATE team_matching_submissions 
  SET status = 'team_formed', matched_at = NOW()
  WHERE id IN (
    SELECT submission_id FROM team_members WHERE team_id = NEW.team_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update submission status when team member is added
CREATE TRIGGER update_submission_on_team_join
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_submission_status_on_team_formation();

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_matching_stats()
RETURNS TABLE (
  total_submissions BIGINT,
  pending_submissions BIGINT,
  matched_submissions BIGINT,
  total_teams BIGINT,
  active_teams BIGINT,
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
    (SELECT AVG(team_size) FROM teams WHERE status = 'active') as avg_team_size,
    (SELECT AVG(compatibility_score) FROM teams WHERE status = 'active') as avg_compatibility_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON team_matching_submissions TO authenticated;
GRANT SELECT ON teams TO authenticated;
GRANT SELECT ON team_members TO authenticated;
GRANT SELECT ON team_notifications TO authenticated;

-- Grant permissions for sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample team matching batch
INSERT INTO team_matching_batches (batch_name, status) 
VALUES ('Initial Launch Batch', 'pending')
ON CONFLICT DO NOTHING;