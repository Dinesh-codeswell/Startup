-- =====================================================
-- FIX TRIGGERS AFTER TIMESTAMP OPTIMIZATION
-- =====================================================
-- This script fixes triggers that reference removed updated_at columns
-- after running optimize-database-timestamps.sql

-- =====================================================
-- DROP PROBLEMATIC TRIGGERS
-- =====================================================

-- Drop the updated_at trigger for team_matching_submissions since the column was removed
DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;

-- Drop the updated_at trigger for teams since the column was removed
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;

-- Drop the updated_at trigger for team_matching_batches since the column was removed
DROP TRIGGER IF EXISTS update_team_matching_batches_updated_at ON team_matching_batches;

-- Drop the updated_at trigger for profiles since the column was removed
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop the updated_at trigger for team_chat_messages since the column was removed
DROP TRIGGER IF EXISTS update_team_chat_messages_updated_at ON team_chat_messages;

-- Drop the updated_at trigger for team_chat_participants since the column was removed
DROP TRIGGER IF EXISTS update_team_chat_participants_updated_at ON team_chat_participants;

-- Drop the updated_at trigger for team_chat_typing_indicators since the column was removed
DROP TRIGGER IF EXISTS update_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators;

-- =====================================================
-- UPDATE SUBMISSION STATUS TRIGGER
-- =====================================================
-- Fix the submission status trigger to not reference updated_at

CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- When a team member is inserted, update the corresponding submission status
    IF TG_OP = 'INSERT' THEN
        -- Update the submission status to 'team_formed'
        UPDATE team_matching_submissions 
        SET 
            status = 'team_formed',
            matched_at = COALESCE(matched_at, NOW())
        WHERE id = NEW.submission_id
          AND status != 'team_formed'; -- Only update if not already set
        
        RETURN NEW;
    END IF;
    
    -- When a team member is deleted, optionally revert submission status
    IF TG_OP = 'DELETE' THEN
        -- Check if this submission is still part of any other team
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE submission_id = OLD.submission_id 
              AND team_id != OLD.team_id
        ) THEN
            -- If not part of any other team, revert status to 'pending_match'
            UPDATE team_matching_submissions 
            SET status = 'pending_match'
            WHERE id = OLD.submission_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check remaining triggers
SELECT 
    schemaname,
    tablename,
    triggername,
    'Trigger exists' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN (
    'team_matching_submissions',
    'teams', 
    'team_members',
    'team_matching_batches',
    'profiles',
    'team_chat_messages',
    'team_chat_participants',
    'team_chat_typing_indicators'
  )
  AND NOT t.tgisinternal
ORDER BY tablename, triggername;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 TRIGGER FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Removed problematic updated_at triggers';
    RAISE NOTICE '✅ Fixed submission status trigger';
    RAISE NOTICE '✅ Database is now optimized and functional';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Team member name updates should now work correctly!';
END $$;