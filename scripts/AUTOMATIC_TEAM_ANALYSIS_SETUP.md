# Automatic Team Analysis Setup Guide

## Overview

This guide will help you set up automatic team strength analysis calculation in your database. Once implemented, team analysis will be automatically calculated and stored whenever:

- New team members are added to teams
- Team member statuses are updated
- Teams are formed through the matching system

## Prerequisites

✅ **Required**: The `team_strengths_analysis` table and its helper functions must already exist in your database.

If you haven't set this up yet, run this script first in Supabase SQL Editor:
```sql
-- Run this file first if not already done:
scripts/create-team-strengths-analysis-table.sql
```

## Quick Setup (Recommended)

### Step 1: Run the Complete Setup Script

In your Supabase SQL Editor, copy and paste the contents of:
```
scripts/setup-automatic-team-analysis.sql
```

This single script will:
- ✅ Create all necessary trigger functions
- ✅ Set up triggers on the `team_members` table
- ✅ Automatically update submission statuses
- ✅ Provide utility functions for data fixes
- ✅ Verify the setup is working

### Step 2: Fix Existing Data (If Needed)

If you have existing teams that need analysis calculated, run these commands:

```sql
-- 1. Fix submission statuses for existing team members
SELECT * FROM fix_existing_submission_statuses();

-- 2. Calculate analysis for all existing teams
SELECT * FROM recalculate_all_team_analysis();
```

### Step 3: Verify Setup

Check that everything is working:

```sql
-- Check if triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%team%'
  AND event_object_table = 'team_members';

-- Check team analysis data
SELECT 
    t.team_name,
    t.team_size,
    tsa.complementarity_score,
    tsa.consulting_coverage,
    tsa.technology_coverage,
    tsa.finance_coverage,
    tsa.marketing_coverage,
    tsa.design_coverage,
    tsa.calculated_at
FROM teams t
LEFT JOIN team_strengths_analysis tsa ON t.id = tsa.team_id
WHERE t.status = 'active'
ORDER BY t.created_at DESC;
```

## Alternative: Manual Setup

If you prefer to run scripts individually:

### Step 1: Submission Status Trigger
```
scripts/create-submission-status-trigger.sql
```

### Step 2: Team Analysis Trigger
```
scripts/create-team-analysis-trigger.sql
```

## How It Works

### Automatic Triggers

1. **When a team member is added:**
   - `trigger_update_submission_status` updates the submission status to `'team_formed'`
   - `trigger_auto_team_analysis` calculates and stores team strength analysis

2. **When a team member is removed:**
   - Submission status is reverted to `'pending'` if not part of other teams
   - Team analysis is recalculated for the affected team

### Data Flow

```
Team Member Added → Submission Status Updated → Team Analysis Calculated → Results Stored
```

## Troubleshooting

### Common Issues

**Issue**: "Function calculate_and_store_team_analysis() not found"
- **Solution**: Run `create-team-strengths-analysis-table.sql` first

**Issue**: Team analysis shows zero values
- **Solution**: Check submission statuses with:
  ```sql
  SELECT tms.name, tms.status, t.team_name
  FROM team_matching_submissions tms
  LEFT JOIN team_members tm ON tms.id = tm.submission_id
  LEFT JOIN teams t ON tm.team_id = t.id
  WHERE t.team_name = 'YOUR_TEAM_NAME';
  ```
- **Fix**: Run `SELECT * FROM fix_existing_submission_statuses();`

**Issue**: Triggers not firing
- **Solution**: Verify triggers exist:
  ```sql
  SELECT trigger_name, event_object_table 
  FROM information_schema.triggers 
  WHERE event_object_table = 'team_members';
  ```

### Manual Recalculation

To manually recalculate analysis for a specific team:
```sql
SELECT calculate_and_store_team_analysis('TEAM_ID_HERE');
```

To recalculate for all teams:
```sql
SELECT * FROM recalculate_all_team_analysis();
```

## Testing the Setup

### Test 1: Create a New Team
1. Use your application to create a new team with members
2. Check if analysis is automatically calculated:
   ```sql
   SELECT * FROM team_strengths_analysis 
   WHERE team_id = 'NEW_TEAM_ID' 
   ORDER BY calculated_at DESC;
   ```

### Test 2: Add Member to Existing Team
1. Add a new member to an existing team
2. Verify analysis is updated:
   ```sql
   SELECT complementarity_score, calculated_at 
   FROM team_strengths_analysis 
   WHERE team_id = 'EXISTING_TEAM_ID' 
   ORDER BY calculated_at DESC 
   LIMIT 2;
   ```

## Files Created

- `setup-automatic-team-analysis.sql` - Complete setup script (recommended)
- `create-team-analysis-trigger.sql` - Team analysis calculation triggers
- `create-submission-status-trigger.sql` - Submission status update triggers
- `AUTOMATIC_TEAM_ANALYSIS_SETUP.md` - This documentation

## Support

If you encounter issues:
1. Check the Supabase logs for error messages
2. Verify all prerequisite tables and functions exist
3. Run the verification queries provided above
4. Use the manual recalculation functions to test individual components

---

**✅ Once setup is complete, team strength analysis will be automatically calculated for all new teams and team changes!**