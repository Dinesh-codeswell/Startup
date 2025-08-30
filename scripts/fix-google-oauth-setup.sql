-- =====================================================
-- GOOGLE OAUTH SETUP FIX SCRIPT
-- This script ensures all required components are in place
-- =====================================================

-- Step 1: Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  college_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create correct RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 4: Create or replace the user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_first_name TEXT;
  extracted_last_name TEXT;
  full_name_from_oauth TEXT;
BEGIN
  -- Extract full name from various OAuth metadata fields
  full_name_from_oauth := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name'
  );
  
  -- Parse first and last name from full name or use individual fields
  IF full_name_from_oauth IS NOT NULL AND trim(full_name_from_oauth) != '' THEN
    -- Split full name into first and last name
    extracted_first_name := trim(split_part(full_name_from_oauth, ' ', 1));
    extracted_last_name := trim(regexp_replace(full_name_from_oauth, '^\S+\s*', ''));
    
    -- If last name is empty after splitting, set it to empty string
    IF extracted_last_name = extracted_first_name THEN
      extracted_last_name := '';
    END IF;
  ELSE
    -- Fallback to individual first_name and last_name fields
    extracted_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
    extracted_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  END IF;
  
  -- Ensure we have at least a first name
  IF extracted_first_name IS NULL OR trim(extracted_first_name) = '' THEN
    extracted_first_name := split_part(NEW.email, '@', 1);
  END IF;
  
  INSERT INTO profiles (id, first_name, last_name, email, college_name)
  VALUES (
    NEW.id,
    extracted_first_name,
    COALESCE(extracted_last_name, ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'college_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = EXCLUDED.email,
    college_name = COALESCE(EXCLUDED.college_name, profiles.college_name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 6: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create updated_at trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Step 10: Test the setup with a verification query
DO $$
BEGIN
  RAISE NOTICE 'Google OAuth setup completed successfully!';
  RAISE NOTICE 'Profiles table: %', 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'Trigger: %', 
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'RLS enabled: %', 
    CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles' AND relrowsecurity = true) 
    THEN 'YES' ELSE 'NO' END;
END $$;