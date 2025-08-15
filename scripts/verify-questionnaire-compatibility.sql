-- =====================================================
-- VERIFY QUESTIONNAIRE DATA COMPATIBILITY WITH MATCHING ALGORITHM
-- =====================================================

-- Test data compatibility by creating sample records with questionnaire values
DO $$
DECLARE
    test_record_id UUID := gen_random_uuid();
    compatibility_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE 'Testing questionnaire data compatibility...';
    
    -- Test 1: Insert sample record with questionnaire values
    BEGIN
        INSERT INTO team_matching_submissions (
            id, full_name, email, whatsapp_number, college_name,
            current_year, core_strengths, preferred_roles, team_preference,
            availability, experience, case_preferences, preferred_team_size,
            status
        ) VALUES (
            test_record_id,
            'Test User',
            'test@example.com',
            '+1234567890',
            'Test College',
            'First Year',  -- From questionnaire dropdown
            ARRAY['Strategy & Structuring', 'Data Analysis & Research'],  -- From questionnaire options
            ARRAY['Team Lead', 'Researcher'],  -- From questionnaire options
            'Either UG or PG',  -- From questionnaire radio buttons
            'Fully Available (10–15 hrs/week)',  -- From questionnaire dropdown
            'None',  -- From questionnaire dropdown
            ARRAY['Consulting', 'Product/Tech'],  -- From questionnaire checkboxes
            3,  -- From questionnaire dropdown
            'pending_match'
        );
        
        RAISE NOTICE '✅ Test record inserted successfully';
        
        -- Clean up test record
        DELETE FROM team_matching_submissions WHERE id = test_record_id;
        
    EXCEPTION WHEN OTHERS THEN
        compatibility_issues := array_append(compatibility_issues, 'Failed to insert test record: ' || SQLERRM);
    END;
    
    -- Test 2: Verify all questionnaire options are valid for enums
    
    -- Check current_year options
    DECLARE
        invalid_years TEXT[] := ARRAY[]::TEXT[];
        year_option TEXT;
    BEGIN
        FOREACH year_option IN ARRAY ARRAY['First Year', 'Second Year', 'Third Year', 'Final Year', 'PG/MBA (1st Year)', 'PG/MBA (2nd Year)']
        LOOP
            BEGIN
                PERFORM year_option::academic_year;
            EXCEPTION WHEN OTHERS THEN
                invalid_years := array_append(invalid_years, year_option);
            END;
        END LOOP;
        
        IF array_length(invalid_years, 1) > 0 THEN
            compatibility_issues := array_append(compatibility_issues, 'Invalid year options: ' || array_to_string(invalid_years, ', '));
        ELSE
            RAISE NOTICE '✅ All current_year options are valid';
        END IF;
    END;
    
    -- Check availability options
    DECLARE
        invalid_availability TEXT[] := ARRAY[]::TEXT[];
        avail_option TEXT;
    BEGIN
        FOREACH avail_option IN ARRAY ARRAY[
            'Fully Available (10–15 hrs/week)', 
            'Moderately Available (5–10 hrs/week)', 
            'Lightly Available (1–4 hrs/week)', 
            'Not available now, but interested later'
        ]
        LOOP
            BEGIN
                PERFORM avail_option::availability_level;
            EXCEPTION WHEN OTHERS THEN
                invalid_availability := array_append(invalid_availability, avail_option);
            END;
        END LOOP;
        
        IF array_length(invalid_availability, 1) > 0 THEN
            compatibility_issues := array_append(compatibility_issues, 'Invalid availability options: ' || array_to_string(invalid_availability, ', '));
        ELSE
            RAISE NOTICE '✅ All availability options are valid';
        END IF;
    END;
    
    -- Check experience options
    DECLARE
        invalid_experience TEXT[] := ARRAY[]::TEXT[];
        exp_option TEXT;
    BEGIN
        FOREACH exp_option IN ARRAY ARRAY['None', 'Participated in 1–2', 'Participated in 3+', 'Finalist/Winner in at least one']
        LOOP
            BEGIN
                PERFORM exp_option::experience_level;
            EXCEPTION WHEN OTHERS THEN
                invalid_experience := array_append(invalid_experience, exp_option);
            END;
        END LOOP;
        
        IF array_length(invalid_experience, 1) > 0 THEN
            compatibility_issues := array_append(compatibility_issues, 'Invalid experience options: ' || array_to_string(invalid_experience, ', '));
        ELSE
            RAISE NOTICE '✅ All experience options are valid';
        END IF;
    END;
    
    -- Check team preference options
    DECLARE
        invalid_team_pref TEXT[] := ARRAY[]::TEXT[];
        team_pref_option TEXT;
    BEGIN
        FOREACH team_pref_option IN ARRAY ARRAY['Undergrads only', 'Postgrads only', 'Either UG or PG']
        LOOP
            BEGIN
                PERFORM team_pref_option::team_preference;
            EXCEPTION WHEN OTHERS THEN
                invalid_team_pref := array_append(invalid_team_pref, team_pref_option);
            END;
        END LOOP;
        
        IF array_length(invalid_team_pref, 1) > 0 THEN
            compatibility_issues := array_append(compatibility_issues, 'Invalid team preference options: ' || array_to_string(invalid_team_pref, ', '));
        ELSE
            RAISE NOTICE '✅ All team preference options are valid';
        END IF;
    END;
    
    -- Final compatibility report
    IF array_length(compatibility_issues, 1) > 0 THEN
        RAISE WARNING 'COMPATIBILITY ISSUES FOUND:';
        FOR i IN 1..array_length(compatibility_issues, 1) LOOP
            RAISE WARNING '  - %', compatibility_issues[i];
        END LOOP;
    ELSE
        RAISE NOTICE '🎉 ALL QUESTIONNAIRE DATA IS COMPATIBLE WITH MATCHING ALGORITHM!';
        RAISE NOTICE '✅ Database schema matches questionnaire options';
        RAISE NOTICE '✅ All enum values are valid';
        RAISE NOTICE '✅ Data can be parsed without issues';
    END IF;
END $$;

-- Verify matching algorithm required fields
DO $$
DECLARE
    missing_fields TEXT[] := ARRAY[]::TEXT[];
    required_for_matching TEXT[] := ARRAY[
        'id', 'full_name', 'email', 'whatsapp_number', 'college_name',
        'current_year', 'core_strengths', 'preferred_roles', 'team_preference',
        'availability', 'experience', 'case_preferences', 'preferred_team_size'
    ];
    field TEXT;
BEGIN
    RAISE NOTICE 'Verifying matching algorithm requirements...';
    
    FOREACH field IN ARRAY required_for_matching
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'team_matching_submissions' 
            AND column_name = field
        ) THEN
            missing_fields := array_append(missing_fields, field);
        END IF;
    END LOOP;
    
    IF array_length(missing_fields, 1) > 0 THEN
        RAISE WARNING 'Missing fields required by matching algorithm: %', array_to_string(missing_fields, ', ');
    ELSE
        RAISE NOTICE '✅ All required fields present for matching algorithm';
    END IF;
END $$;