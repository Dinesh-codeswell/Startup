-- Create tables for team change requests and issue reports
-- This script creates the necessary database structure for handling user requests and issues

-- Table for team change requests
CREATE TABLE IF NOT EXISTS team_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    team_id UUID,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('leave_team', 'switch_team', 'dissolve_team')),
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for issue reports
CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    team_id UUID,
    issue_type VARCHAR(50) NOT NULL DEFAULT 'general',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    -- User details for authenticity
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_college VARCHAR(255),
    
    -- Team details for context
    team_name VARCHAR(255),
    team_size INTEGER,
    user_role_in_team VARCHAR(100),
    
    -- Admin response
    admin_response TEXT,
    admin_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_change_requests_user_id ON team_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_change_requests_team_id ON team_change_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_change_requests_status ON team_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_team_change_requests_created_at ON team_change_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON issue_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_team_id ON issue_reports(team_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_priority ON issue_reports(priority);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON issue_reports(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_team_change_requests_updated_at ON team_change_requests;
CREATE TRIGGER update_team_change_requests_updated_at
    BEFORE UPDATE ON team_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issue_reports_updated_at ON issue_reports;
CREATE TRIGGER update_issue_reports_updated_at
    BEFORE UPDATE ON issue_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE team_change_requests IS 'Stores team change requests submitted by users';
COMMENT ON TABLE issue_reports IS 'Stores issue reports submitted by users';
COMMENT ON COLUMN team_change_requests.request_type IS 'Type of team change: leave_team, switch_team, or dissolve_team';
COMMENT ON COLUMN issue_reports.priority IS 'Priority level: low, medium, high, or urgent';