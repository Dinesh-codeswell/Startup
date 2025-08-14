# Supabase SQL Execution Order Guide

## Overview
This document provides the correct order for executing SQL files to set up chat and matchmaking functionality in Supabase, considering table dependencies and foreign key relationships.

## 🎯 **Recommended Approach: Single Consolidated Script**

### **Best Option: Use the Consolidated Script**
```bash
# Execute the conflict-safe consolidated script
node scripts/setup-database-safe.js
```
**OR**
```sql
-- Run directly in Supabase SQL Editor
\i scripts/create-all-tables-safe.sql
```

**Why this is best:**
- ✅ Handles all dependencies automatically
- ✅ Prevents RLS policy conflicts
- ✅ Creates everything in the correct order
- ✅ Includes proper error handling
- ✅ Optimized for performance

---

## 🔄 **Alternative: Manual Step-by-Step Execution**

If you prefer to run scripts individually, follow this exact order:

### **Phase 1: Foundation Tables**
```sql
-- 1. User Profiles (depends on auth.users)
-- File: scripts/create-tables-fixed.sql (profiles section only)
```

**Execute:**
```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ... (rest of profiles setup)
```

### **Phase 2: Team Matching Core Tables**
```sql
-- 2. Team Matching Submissions (depends on auth.users)
-- File: scripts/create-team-matching-tables.sql (submissions section)
```

**Execute:**
```sql
-- Create team_matching_submissions table
CREATE TABLE IF NOT EXISTS team_matching_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);
```

### **Phase 3: Teams and Batches**
```sql
-- 3. Teams table (independent)
-- 4. Team Matching Batches (independent)
-- File: scripts/create-team-matching-tables.sql (teams and batches sections)
```

**Execute:**
```sql
-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... (rest of table definition)
);

-- Create team_matching_batches table
CREATE TABLE IF NOT EXISTS team_matching_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... (rest of table definition)
);
```

### **Phase 4: Junction and Notification Tables**
```sql
-- 5. Team Members (depends on teams + team_matching_submissions)
-- 6. Team Notifications (depends on teams + team_matching_submissions)
-- File: scripts/create-team-matching-tables.sql (members and notifications sections)
```

**Execute:**
```sql
-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);

-- Create team_notifications table
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);
```

### **Phase 5: Chat System Tables**
```sql
-- 7. Team Chat Messages (depends on teams + team_matching_submissions)
-- 8. Team Chat Participants (depends on teams + team_matching_submissions)
-- 9. Team Chat Reactions (depends on team_chat_messages + team_matching_submissions)
-- 10. Team Chat Typing Indicators (depends on teams + team_matching_submissions)
-- File: scripts/create-team-chat-tables.sql
```

**Execute in this order:**
```sql
-- First: Messages table
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);

-- Second: Participants table
CREATE TABLE IF NOT EXISTS team_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);

-- Third: Reactions table (depends on messages)
CREATE TABLE IF NOT EXISTS team_chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  sender_submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);

-- Fourth: Typing indicators
CREATE TABLE IF NOT EXISTS team_chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES team_matching_submissions(id) ON DELETE CASCADE,
  -- ... (rest of table definition)
);
```

### **Phase 6: Indexes and Performance**
```sql
-- 11. Create all indexes
-- From both team matching and chat scripts
```

### **Phase 7: RLS Policies**
```sql
-- 12. Enable RLS on all tables
-- 13. Create RLS policies (IMPORTANT: Use conflict-safe names)
```

### **Phase 8: Functions and Triggers**
```sql
-- 14. Create functions
-- 15. Create triggers
-- From both scripts, ensuring no conflicts
```

---

## 📋 **Detailed Execution Steps**

### **Step 1: Prepare Supabase**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Ensure you have proper permissions

### **Step 2: Execute Foundation**
```sql
-- Copy and paste from scripts/create-tables-fixed.sql
-- Only the profiles section
```

### **Step 3: Execute Team Matching**
```sql
-- Copy sections from scripts/create-team-matching-tables.sql in order:
-- 1. team_matching_submissions
-- 2. teams  
-- 3. team_matching_batches
-- 4. team_members
-- 5. team_notifications
```

### **Step 4: Execute Chat System**
```sql
-- Copy sections from scripts/create-team-chat-tables.sql in order:
-- 1. team_chat_messages
-- 2. team_chat_participants  
-- 3. team_chat_reactions
-- 4. team_chat_typing_indicators
```

### **Step 5: Execute Indexes**
```sql
-- Copy all CREATE INDEX statements from both scripts
```

### **Step 6: Execute RLS Setup**
```sql
-- IMPORTANT: Use the conflict-safe policies from create-all-tables-safe.sql
-- NOT the original scripts to avoid conflicts
```

### **Step 7: Execute Functions and Triggers**
```sql
-- Copy functions and triggers from create-all-tables-safe.sql
-- This ensures no conflicts
```

---

## ⚠️ **Critical Dependencies**

### **Table Dependency Chain**
```
auth.users (Supabase managed)
    ↓
profiles
    ↓
team_matching_submissions
    ↓
teams (independent)
    ↓
team_members (needs both teams + submissions)
    ↓
team_notifications (needs both teams + submissions)
    ↓
team_chat_messages (needs teams + submissions)
    ↓
team_chat_participants (needs teams + submissions)
    ↓
team_chat_reactions (needs messages + submissions)
    ↓
team_chat_typing_indicators (needs teams + submissions)
```

### **Foreign Key Dependencies**
- `profiles.id` → `auth.users.id`
- `team_matching_submissions.user_id` → `auth.users.id`
- `team_members.team_id` → `teams.id`
- `team_members.submission_id` → `team_matching_submissions.id`
- `team_notifications.team_id` → `teams.id`
- `team_notifications.submission_id` → `team_matching_submissions.id`
- `team_chat_messages.team_id` → `teams.id`
- `team_chat_messages.sender_submission_id` → `team_matching_submissions.id`
- `team_chat_reactions.message_id` → `team_chat_messages.id`

---

## 🚨 **Common Pitfalls to Avoid**

### **1. Wrong Execution Order**
```sql
-- ❌ WRONG: This will fail
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) -- teams doesn't exist yet!
);

-- ✅ CORRECT: Create teams first
CREATE TABLE teams (...);
CREATE TABLE team_members (...);
```

### **2. RLS Policy Conflicts**
```sql
-- ❌ WRONG: Will cause "policy already exists" error
CREATE POLICY "Users can view own submissions" ON team_matching_submissions;
-- Running again causes error

-- ✅ CORRECT: Drop first or use consolidated script
DROP POLICY IF EXISTS "Users can view own submissions" ON team_matching_submissions;
CREATE POLICY "Users can view own submissions" ON team_matching_submissions;
```

### **3. Function Conflicts**
```sql
-- ❌ WRONG: Will cause "function already exists" error  
CREATE FUNCTION handle_new_user();

-- ✅ CORRECT: Use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION handle_new_user();
```

---

## 🔍 **Verification Steps**

### **After Each Phase**
```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

### **Final Verification**
```bash
# Test the database status endpoint
curl http://localhost:3000/api/database/status

# Should return all tables as ready
```

---

## 🎯 **Recommended Execution Method**

### **For Production/Clean Setup**
```bash
# Use the consolidated script (RECOMMENDED)
node scripts/setup-database-safe.js
```

### **For Development/Testing**
```bash
# Use individual scripts in the order specified above
# But be careful about RLS policy conflicts
```

### **For Existing Database**
```bash
# Always use the consolidated script to handle conflicts
node scripts/setup-database-safe.js
```

---

## 📞 **Troubleshooting**

### **If You Get Foreign Key Errors**
- Check the dependency chain above
- Ensure parent tables exist before creating child tables

### **If You Get Policy Conflicts**
- Use the consolidated script instead
- Or manually drop existing policies first

### **If Functions Fail**
- Use `CREATE OR REPLACE FUNCTION` instead of `CREATE FUNCTION`

### **If Setup Fails**
- Check the database status endpoint: `/api/database/status`
- Review Supabase logs for specific errors
- Ensure you have proper permissions (service role key)

The consolidated script (`create-all-tables-safe.sql`) handles all these dependencies and conflicts automatically, making it the safest and most reliable option for setup.