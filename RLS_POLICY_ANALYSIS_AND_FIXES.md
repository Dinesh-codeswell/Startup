# RLS Policy Analysis and Conflict Resolution

## Overview
This document analyzes the Row Level Security (RLS) policies across all database scripts and provides solutions to prevent conflicts and ensure proper security.

## Current RLS Policy Analysis

### 1. Profiles Table Policies

#### Issues Identified:
- **Policy Name Conflicts**: Both `create-tables.sql` and `create-tables-fixed.sql` create identical policy names
- **Missing DROP Statements**: `create-tables.sql` doesn't drop existing policies before creating new ones
- **Potential Duplicate Policies**: Running scripts multiple times could cause conflicts

#### Current Policies:
```sql
-- From both create-tables.sql and create-tables-fixed.sql
"Users can view own profile" ON profiles
"Users can update own profile" ON profiles  
"Users can insert own profile" ON profiles
```

### 2. Team Matching System Policies

#### Tables with RLS:
- `team_matching_submissions`
- `teams`
- `team_members`
- `team_matching_batches`
- `team_notifications`

#### Policy Categories:
1. **User-based policies**: Allow users to access their own data
2. **Team-based policies**: Allow users to access data for teams they belong to
3. **Service role policies**: Allow admin/service role full access

### 3. Team Chat System Policies

#### Tables with RLS:
- `team_chat_messages`
- `team_chat_participants`
- `team_chat_reactions`
- `team_chat_typing_indicators`

#### Security Model:
- Users can only access chat data for teams they're members of
- Complex JOIN-based policies for team membership validation

## Identified Conflicts and Issues

### 🚨 **Critical Issues**

1. **Duplicate Policy Names**
   - Multiple scripts create policies with identical names
   - PostgreSQL will error if policies already exist

2. **Function Name Conflicts**
   - `handle_new_user()` function defined in multiple scripts
   - `update_updated_at_column()` function defined multiple times

3. **Trigger Conflicts**
   - `on_auth_user_created` trigger defined multiple times
   - Update triggers with same names on different tables

4. **Missing Service Role Policies**
   - Some tables lack service role policies for admin access
   - Inconsistent policy naming across tables

### ⚠️ **Potential Issues**

1. **Policy Complexity**
   - Complex JOIN-based policies may impact performance
   - Nested subqueries in RLS policies can be slow

2. **NULL Handling**
   - Some policies allow NULL user_id values
   - May create security loopholes

3. **Inconsistent Naming**
   - Policy names not standardized across tables
   - Makes maintenance difficult

## Solutions and Fixes

### 1. Created Consolidated Database Setup Script

**File**: `scripts/create-all-tables-safe.sql`

This master script handles all conflicts by:

#### ✅ **Conflict Resolution**
- **Drops all existing policies** before creating new ones
- **Standardized policy naming** with prefixes (tm_, chat_, etc.)
- **Safe function replacement** using `CREATE OR REPLACE`
- **Trigger cleanup** before recreation

#### ✅ **Security Improvements**
- **Consistent RLS policies** across all tables
- **Service role access** for all admin operations
- **Proper NULL handling** in policies
- **Performance-optimized** policy queries

#### ✅ **Policy Standardization**
```sql
-- Old naming (conflict-prone)
"Users can view own submissions"
"Users can insert own submissions"

-- New naming (conflict-safe)
"tm_submissions_select_own"
"tm_submissions_insert_own"
"tm_submissions_service_role"
```

### 2. Enhanced Security Model

#### **User Access Levels**
1. **Own Data Access**: Users can only access their own submissions and profiles
2. **Team Data Access**: Users can access data for teams they're members of
3. **Service Role Access**: Admin/service role has full access to all data

#### **Policy Categories**
- **Select Policies**: Control read access
- **Insert Policies**: Control data creation
- **Update Policies**: Control data modification
- **Delete Policies**: Control data removal (where applicable)
- **Service Role Policies**: Admin override for all operations

### 3. Performance Optimizations

#### **Optimized RLS Queries**
- Reduced nested subqueries where possible
- Added proper indexes for RLS policy joins
- Simplified team membership checks

#### **Index Strategy**
```sql
-- Performance indexes for RLS policies
CREATE INDEX idx_team_matching_submissions_user_id ON team_matching_submissions(user_id);
CREATE INDEX idx_team_members_submission_id ON team_members(submission_id);
CREATE INDEX idx_team_chat_participants_active ON team_chat_participants(team_id) WHERE is_active = TRUE;
```

### 4. Migration Strategy

#### **Safe Migration Process**
1. **Backup existing data** before running new script
2. **Run consolidated script** which safely drops and recreates policies
3. **Verify policy functionality** with test queries
4. **Update application code** if needed

#### **Zero-Downtime Approach**
- Script uses `IF NOT EXISTS` for table creation
- Policies are dropped and recreated atomically
- No data loss during migration

## Implementation Guide

### 🚀 **Recommended Approach**

#### Step 1: Backup Current Database
```sql
-- Create backup of current policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Step 2: Run Consolidated Script
```bash
# Use the safe consolidated script
psql -f scripts/create-all-tables-safe.sql
```

#### Step 3: Verify Setup
```bash
# Check database status
curl http://localhost:3000/api/database/status
```

### 🔧 **Alternative Approach (Manual)**

If you prefer to run scripts individually:

1. **Run profiles setup first**:
   ```sql
   -- From create-all-tables-safe.sql, run only profiles section
   ```

2. **Run team matching setup**:
   ```sql
   -- From create-all-tables-safe.sql, run team matching section
   ```

3. **Run team chat setup**:
   ```sql
   -- From create-all-tables-safe.sql, run team chat section
   ```

## Policy Testing

### 🧪 **Test User Access**
```sql
-- Test as regular user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Should return only user's data
SELECT * FROM team_matching_submissions;
SELECT * FROM teams;
```

### 🔒 **Test Service Role Access**
```sql
-- Test as service role
SET request.jwt.claims TO '{"role": "service_role"}';

-- Should return all data
SELECT * FROM team_matching_submissions;
SELECT * FROM teams;
```

## Security Validation

### ✅ **Security Checklist**
- [ ] Users can only see their own submissions
- [ ] Users can only see teams they're members of
- [ ] Users can only access chat for their teams
- [ ] Service role can access all data
- [ ] No data leakage between users
- [ ] Proper handling of NULL user_id values

### 🛡️ **RLS Policy Verification**
```sql
-- Verify all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verify policy count
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename;
```

## Maintenance

### 📊 **Monitoring RLS Performance**
```sql
-- Monitor slow queries related to RLS
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%team_matching_submissions%'
ORDER BY mean_time DESC;
```

### 🔄 **Regular Maintenance Tasks**
1. **Monitor policy performance** monthly
2. **Review access patterns** quarterly
3. **Update policies** as features evolve
4. **Audit security** annually

## Conclusion

The consolidated script (`create-all-tables-safe.sql`) resolves all RLS policy conflicts while:

- ✅ **Preventing conflicts** through safe policy management
- ✅ **Improving security** with standardized policies
- ✅ **Enhancing performance** with optimized queries
- ✅ **Ensuring maintainability** with consistent naming

This approach provides a robust, secure, and maintainable database schema that supports all current and future features while preventing the conflicts identified in the original scripts.