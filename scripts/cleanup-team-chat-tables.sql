-- =====================================================
-- TEAM CHAT CLEANUP SCRIPT
-- This script removes all team-chat related database objects
-- WARNING: This will permanently delete all chat data!
-- =====================================================

-- =====================================================
-- STEP 1: DROP VIEWS (must be dropped before tables)
-- =====================================================

-- Drop views that depend on team chat tables
DROP VIEW IF EXISTS team_chat_messages_with_details CASCADE;
DROP VIEW IF EXISTS team_chat_active_participants CASCADE;
DROP MATERIALIZED VIEW IF EXISTS chat_team_stats CASCADE;

-- =====================================================
-- STEP 2: DROP FUNCTIONS
-- =====================================================

-- Drop functions related to team chat
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_typing_indicators() CASCADE;
DROP FUNCTION IF EXISTS update_participant_last_seen() CASCADE;
DROP FUNCTION IF EXISTS get_team_chat_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID, UUID) CASCADE;

-- =====================================================
-- STEP 3: DROP TRIGGERS
-- =====================================================

-- Drop triggers on team chat tables
DROP TRIGGER IF EXISTS update_team_chat_messages_updated_at ON team_chat_messages CASCADE;
DROP TRIGGER IF EXISTS update_team_chat_participants_updated_at ON team_chat_participants CASCADE;
DROP TRIGGER IF EXISTS update_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators CASCADE;
DROP TRIGGER IF EXISTS cleanup_typing_indicators_trigger ON team_chat_typing_indicators CASCADE;

-- =====================================================
-- STEP 4: DROP TABLES (in reverse dependency order)
-- =====================================================

-- Drop tables that reference other team chat tables first
DROP TABLE IF EXISTS team_chat_read_receipts CASCADE;
DROP TABLE IF EXISTS team_chat_reactions CASCADE;
DROP TABLE IF EXISTS team_chat_typing_indicators CASCADE;
DROP TABLE IF EXISTS team_chat_participants CASCADE;
DROP TABLE IF EXISTS team_chat_messages CASCADE;

-- =====================================================
-- STEP 5: DROP INDEXES (if they still exist)
-- =====================================================

-- Drop any remaining indexes related to team chat
DROP INDEX IF EXISTS idx_team_chat_messages_team_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_sender CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_created_at CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_recent CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_type CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_reply CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_deleted CASCADE;
DROP INDEX IF EXISTS idx_team_chat_messages_text_search CASCADE;

DROP INDEX IF EXISTS idx_team_chat_participants_team_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_participants_submission_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_participants_active CASCADE;
DROP INDEX IF EXISTS idx_team_chat_participants_last_seen CASCADE;

DROP INDEX IF EXISTS idx_team_chat_reactions_message_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_reactions_sender CASCADE;
DROP INDEX IF EXISTS idx_team_chat_reactions_emoji CASCADE;
DROP INDEX IF EXISTS idx_team_chat_reactions_popular CASCADE;

DROP INDEX IF EXISTS idx_team_chat_typing_team_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_typing_submission_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_typing_expires CASCADE;
DROP INDEX IF EXISTS idx_team_chat_typing_active CASCADE;

DROP INDEX IF EXISTS idx_team_chat_read_receipts_message_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_read_receipts_submission_id CASCADE;
DROP INDEX IF EXISTS idx_team_chat_read_receipts_team_id CASCADE;

-- =====================================================
-- STEP 6: DROP SEQUENCES (if any were created)
-- =====================================================

-- Drop any sequences related to team chat (usually auto-handled by UUID)
-- Most tables use UUID with gen_random_uuid() so no sequences to drop

-- =====================================================
-- STEP 7: REMOVE RLS POLICIES
-- =====================================================

-- Drop Row Level Security policies (they should be dropped with tables)
-- But just in case, we can try to drop them explicitly
DROP POLICY IF EXISTS team_chat_messages_policy ON team_chat_messages CASCADE;
DROP POLICY IF EXISTS team_chat_participants_policy ON team_chat_participants CASCADE;
DROP POLICY IF EXISTS team_chat_reactions_policy ON team_chat_reactions CASCADE;
DROP POLICY IF EXISTS team_chat_typing_policy ON team_chat_typing_indicators CASCADE;
DROP POLICY IF EXISTS team_chat_read_receipts_policy ON team_chat_read_receipts CASCADE;

-- =====================================================
-- STEP 8: CLEAN UP PERMISSIONS
-- =====================================================

-- Revoke any specific permissions that were granted
-- (Most permissions are automatically revoked when objects are dropped)

-- =====================================================
-- STEP 9: VERIFICATION
-- =====================================================

-- Verify that all team chat tables have been removed
DO $$
DECLARE
  table_count INTEGER;
  remaining_tables TEXT[];
BEGIN
  -- Count remaining team chat tables
  SELECT COUNT(*), array_agg(table_name)
  INTO table_count, remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'team_chat_%';
  
  IF table_count > 0 THEN
    RAISE WARNING 'Warning: % team chat tables still exist: %', table_count, remaining_tables;
  ELSE
    RAISE NOTICE 'Success: All team chat tables have been removed';
  END IF;
  
  -- Count remaining team chat functions
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name LIKE '%team_chat%'
    OR routine_name LIKE '%chat%';
  
  IF table_count > 0 THEN
    RAISE WARNING 'Warning: % team chat functions may still exist', table_count;
  ELSE
    RAISE NOTICE 'Success: All team chat functions have been removed';
  END IF;
END
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TEAM CHAT CLEANUP COMPLETED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Removed:';
  RAISE NOTICE '- All team chat tables and data';
  RAISE NOTICE '- All related indexes and constraints';
  RAISE NOTICE '- All functions and triggers';
  RAISE NOTICE '- All views and materialized views';
  RAISE NOTICE '- All RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'WARNING: This action cannot be undone!';
  RAISE NOTICE 'All chat messages and history have been permanently deleted.';
  RAISE NOTICE '==============================================';
END
$$;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
TO RUN THIS SCRIPT:

1. Connect to your database:
   psql $DATABASE_URL

2. Run this script:
   \i scripts/cleanup-team-chat-tables.sql

OR

1. Copy the contents of this file
2. Paste into Supabase SQL Editor
3. Click "Run"

WARNING: 
- This will permanently delete all chat data
- Make sure you have backups if needed
- Test in development environment first
- This action cannot be undone

AFTER RUNNING:
- Restart your application
- Clear any cached data
- Update your application code to remove team chat references
*/