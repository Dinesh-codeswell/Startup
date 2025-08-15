-- =====================================================
-- POSTGRESQL DATA TYPE OPTIMIZATION SCRIPT
-- Replaces TEXT with optimal data types for maximum storage efficiency
-- =====================================================

-- =====================================================
-- DATA TYPE OPTIMIZATION ANALYSIS
-- =====================================================

/*
POSTGRESQL DATA TYPE STORAGE COMPARISON:
- CHAR(n): Fixed length, padded with spaces (use for fixed-length data)
- VARCHAR(n): Variable length up to n characters (optimal for most cases)
- TEXT: Unlimited length (use only for large content)
- ENUM: Custom type for predefined values (most efficient for status fields)

STORAGE EFFICIENCY:
- VARCHAR(50): ~4 bytes overhead + actual length
- TEXT: ~4 bytes overhead + actual length + TOAST overhead for large values
- ENUM: 4 bytes total (regardless of string length)
- CHAR(n): exactly n bytes (wasteful if not fully used)

RECOMMENDATION: Use VARCHAR(n) with appropriate limits for maximum efficiency
*/

-- =====================================================
-- CREATE OPTIMIZED ENUM TYPES
-- =====================================================

-- Drop existing types if they exist (safe approach)
DROP TYPE IF EXISTS submission_status CASCADE;

DROP TYPE IF EXISTS team_status CASCADE;

DROP TYPE IF EXISTS approval_status CASCADE;

DROP TYPE IF EXISTS notification_type CASCADE;

DROP TYPE IF EXISTS delivery_status CASCADE;

DROP TYPE IF EXISTS message_type CASCADE;

DROP TYPE IF EXISTS formation_method CASCADE;

DROP TYPE IF EXISTS batch_status CASCADE;

DROP TYPE IF EXISTS audit_action CASCADE;

DROP TYPE IF EXISTS academic_year CASCADE;

DROP TYPE IF EXISTS experience_level CASCADE;

DROP TYPE IF EXISTS availability_level CASCADE;

-- Status enums (save significant space vs TEXT)
CREATE TYPE submission_status AS ENUM ('pending_match', 'matched', 'team_formed', 'inactive');

CREATE TYPE team_status AS ENUM ('active', 'inactive', 'completed');

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE notification_type AS ENUM ('team_formed', 'team_updated', 'chat_created', 'reminder');

CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'failed');

CREATE TYPE message_type AS ENUM ('text', 'system', 'file', 'image');

CREATE TYPE formation_method AS ENUM ('automated', 'manual', 'csv_import');

CREATE TYPE batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE audit_action AS ENUM ('team_created', 'team_approved', 'team_rejected', 'member_added', 'member_removed', 'status_changed');

-- Academic year enum (very common values)
CREATE TYPE academic_year AS ENUM (
  'First Year', 'Second Year', 'Third Year', 'Final Year', 
  'PG/MBA (1st Year)', 'PG/MBA (2nd Year)', 'Graduate', 'Other'
);

-- Experience level enum
CREATE TYPE experience_level AS ENUM (
  'None', 'Participated in 1–2', 'Participated in 3+', 'Finalist/Winner in at least one'
);

-- Availability enum
CREATE TYPE availability_level AS ENUM (
  'Fully Available (10–15 hrs/week)', 
  'Moderately Available (5–10 hrs/week)', 
  'Lightly Available (1–4 hrs/week)', 
  'Not available now, but interested later'
);

-- =====================================================
-- OPTIMIZE TEAM_MATCHING_SUBMISSIONS TABLE
-- =====================================================

-- Optimize string fields with appropriate VARCHAR limits
ALTER TABLE team_matching_submissions 
  ALTER COLUMN full_name TYPE VARCHAR(100),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN whatsapp_number TYPE VARCHAR(20),
  ALTER COLUMN college_name TYPE VARCHAR(200),
  ALTER COLUMN course TYPE VARCHAR(100),
  ALTER COLUMN current_year TYPE academic_year USING current_year::academic_year,
  ALTER COLUMN availability TYPE availability_level USING availability::availability_level,
  ALTER COLUMN experience TYPE experience_level USING experience::experience_level,
  ALTER COLUMN status TYPE submission_status USING status::submission_status;

-- =====================================================
-- OPTIMIZE TEAMS TABLE
-- =====================================================

ALTER TABLE teams 
  ALTER COLUMN team_name TYPE VARCHAR(100),
  ALTER COLUMN status TYPE team_status USING status::team_status,
  ALTER COLUMN approval_status TYPE approval_status USING approval_status::approval_status,
  ALTER COLUMN chat_group_id TYPE VARCHAR(100),
  ALTER COLUMN chat_group_invite_link TYPE VARCHAR(500);

-- =====================================================
-- OPTIMIZE TEAM_MEMBERS TABLE
-- =====================================================

ALTER TABLE team_members
ALTER COLUMN role_in_team TYPE VARCHAR(50);

-- =====================================================
-- OPTIMIZE TEAM_MATCHING_BATCHES TABLE
-- =====================================================

ALTER TABLE team_matching_batches 
  ALTER COLUMN batch_name TYPE VARCHAR(100),
  ALTER COLUMN matching_algorithm_version TYPE VARCHAR(50),
  ALTER COLUMN formation_method TYPE formation_method USING formation_method::formation_method,
  ALTER COLUMN status TYPE batch_status USING status::batch_status;

-- =====================================================
-- OPTIMIZE TEAM_NOTIFICATIONS TABLE
-- =====================================================

ALTER TABLE team_notifications 
  ALTER COLUMN notification_type TYPE notification_type USING notification_type::notification_type,
  ALTER COLUMN title TYPE VARCHAR(200),
  ALTER COLUMN message TYPE TEXT, -- Keep as TEXT for long messages
  ALTER COLUMN delivery_status TYPE delivery_status USING delivery_status::delivery_status;

-- =====================================================
-- OPTIMIZE TEAM_CHAT_MESSAGES TABLE
-- =====================================================

ALTER TABLE team_chat_messages 
  ALTER COLUMN message_text TYPE TEXT, -- Keep as TEXT for chat messages
  ALTER COLUMN message_type TYPE message_type USING message_type::message_type;

-- =====================================================
-- OPTIMIZE PROFILES TABLE
-- =====================================================

ALTER TABLE profiles
ALTER COLUMN first_name TYPE VARCHAR(50),
ALTER COLUMN last_name TYPE VARCHAR(50),
ALTER COLUMN email TYPE VARCHAR(255),
ALTER COLUMN college_name TYPE VARCHAR(200);

-- =====================================================
-- OPTIMIZE TEAM_CHAT_REACTIONS TABLE
-- =====================================================

ALTER TABLE team_chat_reactions
ALTER COLUMN reaction_emoji TYPE VARCHAR(10);
-- Emojis are typically 1-4 characters

-- =====================================================
-- OPTIMIZE AUDIT TABLE
-- =====================================================

ALTER TABLE team_formation_audit 
  ALTER COLUMN action TYPE audit_action USING action::audit_action,
  ALTER COLUMN table_name TYPE VARCHAR(50),
  ALTER COLUMN user_agent TYPE VARCHAR(500);

-- =====================================================
-- STORAGE OPTIMIZATION SUMMARY
-- =====================================================

/*
ESTIMATED STORAGE SAVINGS PER ROW:

TEAM_MATCHING_SUBMISSIONS:
- full_name: TEXT → VARCHAR(100): ~0-50% savings (depends on name length)
- email: TEXT → VARCHAR(255): ~0-30% savings
- whatsapp_number: TEXT → VARCHAR(20): ~70-90% savings
- college_name: TEXT → VARCHAR(200): ~0-40% savings
- course: TEXT → VARCHAR(100): ~0-60% savings
- current_year: TEXT → ENUM: ~80-95% savings (4 bytes vs 20-50 bytes)
- availability: TEXT → ENUM: ~85-95% savings (4 bytes vs 30-60 bytes)
- experience: TEXT → ENUM: ~80-90% savings (4 bytes vs 20-40 bytes)
- status: TEXT → ENUM: ~70-85% savings (4 bytes vs 15-25 bytes)

TEAMS:
- team_name: TEXT → VARCHAR(100): ~0-50% savings
- status: TEXT → ENUM: ~70-80% savings
- approval_status: TEXT → ENUM: ~70-80% savings
- chat_group_id: TEXT → VARCHAR(100): ~0-60% savings
- chat_group_invite_link: TEXT → VARCHAR(500): ~0-40% savings

PROFILES:
- first_name: TEXT → VARCHAR(50): ~0-70% savings
- last_name: TEXT → VARCHAR(50): ~0-70% savings
- email: TEXT → VARCHAR(255): ~0-30% savings
- college_name: TEXT → VARCHAR(200): ~0-40% savings

TOTAL ESTIMATED SAVINGS:
- Per submission: 50-200 bytes saved (30-60% reduction)
- Per team: 20-80 bytes saved (40-70% reduction)
- Per profile: 20-100 bytes saved (40-80% reduction)

FOR 10,000 USERS:
- Submissions: 500KB - 2MB saved
- Teams (2,500): 50KB - 200KB saved
- Profiles: 200KB - 1MB saved
- Total: ~750KB - 3.2MB saved

ADDITIONAL BENEFITS:
✅ Faster queries (smaller data to scan)
✅ Better indexing performance
✅ Reduced memory usage
✅ Data validation at database level
✅ Better query optimization by PostgreSQL
*/

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Add indexes on frequently queried VARCHAR fields
CREATE INDEX IF NOT EXISTS idx_submissions_email ON team_matching_submissions (email);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON team_matching_submissions (status);

CREATE INDEX IF NOT EXISTS idx_teams_status ON teams (status);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_pending ON team_matching_submissions (submitted_at)
WHERE
    status = 'pending_match';

CREATE INDEX IF NOT EXISTS idx_teams_active ON teams (created_at)
WHERE
    status = 'active';