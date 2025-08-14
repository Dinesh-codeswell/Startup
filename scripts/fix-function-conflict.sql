-- Fix for function conflict issue
-- This script safely handles the update_updated_at_column function conflict

-- First, check if the function exists and what depends on it
DO $$
BEGIN
    -- Only proceed if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE 'Function update_updated_at_column() exists, will use CREATE OR REPLACE';
    ELSE
        RAISE NOTICE 'Function update_updated_at_column() does not exist, will create new';
    END IF;
END $$;

-- Create or replace the function (this is safe even if it's being used)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created/updated
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE '✅ Function update_updated_at_column() is ready';
    ELSE
        RAISE NOTICE '❌ Function update_updated_at_column() failed to create';
    END IF;
END $$;