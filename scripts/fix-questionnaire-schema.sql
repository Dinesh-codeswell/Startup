-- =====================================================
-- FIX TEAM MATCHING QUESTIONNAIRE SCHEMA
-- Remove unnecessary column and add missing column
-- =====================================================

-- =====================================================
-- STEP 1: ADD MISSING "WHO DO YOU WANT ON YOUR TEAM?" COLUMN
-- =====================================================

-- Create team preference enum type (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_preference') THEN
        CREATE TYPE team_preference AS ENUM (
            'Undergrads only', 
            'Postgrads only', 
            'Either UG or PG'
        );
        RAISE NOTICE 'Created team_preference enum type';
    ELSE
        RAISE NOTICE 'team_preference enum type already exists';
    END IF;
END $$;

-- Add the missing team_preference column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_matching_submissions' 
        AND column_name = 'team_preference'
    ) THEN
        ALTER TABLE team_matching_submissions 
        ADD COLUMN team_preference team_preference DEFAULT 'Either UG or PG';
        
        RAISE NOTICE 'Added team_preference column to team_matching_submissions';
    ELSE
        RAISE NOTICE 'team_preference column already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 2: REMOVE UNNECESSARY "PREFERRED_TEAMMATE_ROLES" COLUMN
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_matching_submissions' 
        AND column_name = 'preferred_teammate_roles'
    ) THEN
        -- First, let's see if there's any important data in this column
        RAISE NOTICE 'Checking for data in preferred_teammate_roles column...';
        
        -- Remove the column (data will be lost, but it's unnecessary)
        ALTER TABLE team_matching_submissions 
        DROP COLUMN preferred_teammate_roles;
        
        RAISE NOTICE 'Removed preferred_teammate_roles column from team_matching_submissions';
    ELSE
        RAISE NOTICE 'preferred_teammate_roles column does not exist';
    END IF;
END $$;

-- =====================================================
-- STEP 3: UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Set default team preference for existing records
UPDATE team_matching_submissions
SET
    team_preference = 'Either UG or PG'
WHERE
    team_preference IS NULL;

-- =====================================================
-- STEP 4: VERIFY SCHEMA CHANGES
-- =====================================================

DO $$
DECLARE
    column_exists BOOLEAN;
    team_pref_exists BOOLEAN;
BEGIN
    -- Check if preferred_teammate_roles was removed
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_matching_submissions' 
        AND column_name = 'preferred_teammate_roles'
    ) INTO column_exists;
    
    -- Check if team_preference was added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_matching_submissions' 
        AND column_name = 'team_preference'
    ) INTO team_pref_exists;
    
    IF NOT column_exists AND team_pref_exists THEN
        RAISE NOTICE '✅ Schema update successful!';
        RAISE NOTICE '   - Removed: preferred_teammate_roles column';
        RAISE NOTICE '   - Added: team_preference column';
    ELSE
        RAISE WARNING '⚠️ Schema update may have issues:';
        RAISE WARNING '   - preferred_teammate_roles exists: %', column_exists;
        RAISE WARNING '   - team_preference exists: %', team_pref_exists;
    END IF;
END $$;

-- =====================================================
-- STEP 5: UPDATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index on team_preference for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_team_preference ON team_matching_submissions (team_preference);

-- =====================================================
-- FINAL CLEANUP
-- =====================================================

-- Update table statistics
ANALYZE team_matching_submissions;

-- Final success messages
DO $$ BEGIN RAISE NOTICE '🎉 Questionnaire schema fix completed successfully!';

RAISE NOTICE '📝 Next steps:';

RAISE NOTICE '   1. Update TypeScript interfaces';

RAISE NOTICE '   2. Update questionnaire component';

RAISE NOTICE '   3. Update form submission logic';

RAISE NOTICE '   4. Test the questionnaire flow';

END $$;