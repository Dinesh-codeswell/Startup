-- Create test team and members for testing team dashboard
-- This script creates a sample team with members to test the team formation logic

-- First, let's create a test user submission (if it doesn't exist)
INSERT INTO team_matching_submissions (
  id,
  user_id,
  full_name,
  email,
  whatsapp_number,
  college_name,
  current_year,
  core_strengths,
  preferred_roles,
  availability,
  experience,
  case_preferences,
  preferred_team_size,
  status
) VALUES (
  'test-submission-1',
  'test-user-1',
  'Test User One',
  'testuser1@example.com',
  '+1234567890',
  'Test University',
  'Third Year',
  ARRAY['Strategic Thinking', 'Leadership'],
  ARRAY['Team Lead', 'Strategist'],
  'Fully Available (10–15 hrs/week)',
  'Participated in 3+',
  ARRAY['Consulting', 'Strategy'],
  4,
  'team_formed'
) ON CONFLICT (id) DO UPDATE SET
  status = 'team_formed',
  updated_at = NOW();

-- Create additional test submissions for team members
INSERT INTO team_matching_submissions (
  id,
  user_id,
  full_name,
  email,
  whatsapp_number,
  college_name,
  current_year,
  core_strengths,
  preferred_roles,
  availability,
  experience,
  case_preferences,
  preferred_team_size,
  status
) VALUES 
(
  'test-submission-2',
  'test-user-2',
  'Test User Two',
  'testuser2@example.com',
  '+1234567891',
  'Test University',
  'Second Year',
  ARRAY['Market Research', 'Analytics'],
  ARRAY['Researcher', 'Analyst'],
  'Moderately Available (5–10 hrs/week)',
  'Participated in 1–2',
  ARRAY['Market Research', 'Analytics'],
  4,
  'team_formed'
),
(
  'test-submission-3',
  'test-user-3',
  'Test User Three',
  'testuser3@example.com',
  '+1234567892',
  'Test University',
  'Final Year',
  ARRAY['UI/UX Design', 'Creative Thinking'],
  ARRAY['Designer', 'Creative'],
  'Fully Available (10–15 hrs/week)',
  'Participated in 3+',
  ARRAY['Product Design', 'Innovation'],
  4,
  'team_formed'
),
(
  'test-submission-4',
  'test-user-4',
  'Test User Four',
  'testuser4@example.com',
  '+1234567893',
  'Test University',
  'Third Year',
  ARRAY['Financial Modeling', 'Data Analysis'],
  ARRAY['Analyst', 'Finance'],
  'Moderately Available (5–10 hrs/week)',
  'Participated in 1–2',
  ARRAY['Finance', 'Consulting'],
  4,
  'team_formed'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'team_formed',
  updated_at = NOW();

-- Create a test team
INSERT INTO teams (
  id,
  team_name,
  team_size,
  compatibility_score,
  status,
  approval_status,
  formed_at
) VALUES (
  'test-team-1',
  'Innovation Squad Alpha',
  4,
  85.5,
  'active',
  'approved',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  team_name = 'Innovation Squad Alpha',
  status = 'active',
  approval_status = 'approved',
  updated_at = NOW();

-- Create team member relationships
INSERT INTO team_members (
  team_id,
  submission_id,
  role_in_team
) VALUES 
(
  'test-team-1',
  'test-submission-1',
  'Team Lead'
),
(
  'test-team-1',
  'test-submission-2',
  'Researcher'
),
(
  'test-team-1',
  'test-submission-3',
  'Designer'
),
(
  'test-team-1',
  'test-submission-4',
  'Analyst'
)
ON CONFLICT (team_id, submission_id) DO UPDATE SET
  role_in_team = EXCLUDED.role_in_team,
  updated_at = NOW();

-- Verify the test data
SELECT 
  t.id as team_id,
  t.team_name,
  t.team_size,
  t.status,
  t.approval_status,
  COUNT(tm.submission_id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE t.id = 'test-team-1'
GROUP BY t.id, t.team_name, t.team_size, t.status, t.approval_status;

-- Show team members
SELECT 
  tm.team_id,
  tm.role_in_team,
  s.full_name,
  s.email,
  s.status as submission_status
FROM team_members tm
JOIN team_matching_submissions s ON tm.submission_id = s.id
WHERE tm.team_id = 'test-team-1'
ORDER BY tm.role_in_team;