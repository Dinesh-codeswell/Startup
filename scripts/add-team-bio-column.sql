-- =====================================================
-- ADD BIO COLUMN TO TEAMS TABLE
-- =====================================================

-- Add bio column to teams table
-- Using TEXT data type for variable-length content with no size limit
-- TEXT is more storage efficient than VARCHAR for longer content
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN teams.bio IS 'Team biography/description - variable length text content';

-- Optional: Add a check constraint to limit bio length if needed (uncomment if desired)
-- ALTER TABLE teams ADD CONSTRAINT check_bio_length CHECK (char_length(bio) <= 1000);

-- Verify the column was added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teams' AND column_name = 'bio';