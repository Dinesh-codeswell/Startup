-- =====================================================
-- REMOVE UNUSED COURSE COLUMN AND VERIFY DATA COMPATIBILITY
-- =====================================================

-- Step 1: Check if course column has any data
DO $$
DECLARE
    course_data_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO course_data_count 
    FROM team_matching_submissions 
    WHERE course IS NOT NULL AND course != '';
    
    IF course_data_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % records with course data that will be lost', course_data_count;
    ELSE
        RAISE NOTICE 'No course data found - safe to remove column';
    END IF;
END $$;

-- Step 2: Remove the unused course column
ALTER TABLE team_matching_submissions 
DROP COLUMN IF EXISTS course;

-- Step 3: Verify all required columns exist for team matching algorithm
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'full_name', 'email', 'whatsapp_number', 'college_name',
        'current_year', 'core_strengths', 'preferred_roles', 'team_preference',
        'availability', 'experience', 'case_preferences', 'preferred_team_size'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'team_matching_submissions' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Missing required columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns present for team matching algorithm';
    END IF;
END $$;

-- Step 4: Verify data types are compatible
DO $$
BEGIN
    -- Check if current_year values are compatible with academic_year enum
    IF EXISTS (
        SELECT 1 FROM team_matching_submissions 
        WHERE current_year NOT IN (
            'First Year', 'Second Year', 'Third Year', 'Final Year', 
            'PG/MBA (1st Year)', 'PG/MBA (2nd Year)', 'Graduate', 'Other'
        )
    ) THEN
        RAISE WARNING 'Some current_year values may not be compatible with academic_year enum';
    END IF;
    
    -- Check if availability values are compatible
    IF EXISTS (
        SELECT 1 FROM team_matching_submissions 
        WHERE availability NOT IN (
            'Fully Available (10–15 hrs/week)', 
            'Moderately Available (5–10 hrs/week)', 
            'Lightly Available (1–4 hrs/week)', 
            'Not available now, but interested later'
        )
    ) THEN
        RAISE WARNING 'Some availability values may not be compatible with availability_level enum';
    END IF;
    
    -- Check if experience values are compatible
    IF EXISTS (
        SELECT 1 FROM team_matching_submissions 
        WHERE experience NOT IN (
            'None', 'Participated in 1–2', 'Participated in 3+', 'Finalist/Winner in at least one'
        )
    ) THEN
        RAISE WARNING 'Some experience values may not be compatible with experience_level enum';
    END IF;
    
    -- Check if team_preference values are valid
    IF EXISTS (
        SELECT 1 FROM team_matching_submissions 
        WHERE team_preference NOT IN ('Undergrads only', 'Postgrads only', 'Either UG or PG')
    ) THEN
        RAISE WARNING 'Some team_preference values are invalid';
    END IF;
    
    RAISE NOTICE '✅ Data compatibility check completed';
END $$;

-- Step 5: Update table statistics
ANALYZE team_matching_submissions;

-- Success message
SELECT 'Course column removed and data compatibility verified!' as result;