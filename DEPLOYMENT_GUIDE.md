# 🚀 Production Deployment Guide

## Overview
Your enhanced SQL script is ready for production deployment. Due to Supabase's security model, the SQL needs to be executed manually through the Supabase dashboard for maximum security.

## ✅ **What's Ready**

### **Enhanced SQL Script**
- **File**: `scripts/create-all-tables-safe.sql`
- **Status**: ✅ Production-ready with all enhancements
- **Features**: Team approval workflow, audit trail, comprehensive RLS policies

### **API Endpoints**
- **Team Approval API**: `app/api/team-matching/approve/route.ts` ✅
- **All existing APIs**: Enhanced and compatible ✅

## 🎯 **Deployment Steps**

### **Step 1: Deploy SQL Schema**

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Execute Enhanced Schema**
   ```sql
   -- Copy the entire contents of scripts/create-all-tables-safe.sql
   -- Paste into Supabase SQL Editor
   -- Click "Run" to execute
   ```

3. **Verify Deployment**
   - Check that all tables are created
   - Verify RLS policies are active
   - Confirm triggers and functions are installed

### **Step 2: Test Database Status**

Run the database status check:
```bash
# Test the API endpoint
curl http://localhost:3000/api/database/status
```

Expected response:
```json
{
  "status": "healthy",
  "tables": {
    "profiles": true,
    "team_matching_submissions": true,
    "teams": true,
    "team_members": true,
    "team_chat_messages": true,
    "team_chat_participants": true,
    "team_formation_audit": true
  },
  "enhanced_features": {
    "approval_workflow": true,
    "audit_trail": true,
    "csv_export": true
  }
}
```

### **Step 3: Test Enhanced Features**

#### **Test Team Approval Workflow**
```bash
# List pending teams
curl http://localhost:3000/api/team-matching/approve

# Approve a team
curl -X POST http://localhost:3000/api/team-matching/approve \
  -H "Content-Type: application/json" \
  -d '{"team_id":"uuid-here","action":"approve"}'
```

#### **Test Audit Trail**
```sql
-- Check audit logs in Supabase
SELECT * FROM team_formation_audit ORDER BY created_at DESC LIMIT 10;
```

#### **Test CSV Export**
```sql
-- Test CSV export function
SELECT * FROM export_pending_submissions_for_csv();
```

## 🔧 **Manual SQL Execution (Recommended)**

Since automated execution has security limitations, here's the manual approach:

### **Option A: Supabase SQL Editor (Recommended)**

1. **Copy SQL Content**
   ```bash
   # View the SQL file
   cat scripts/create-all-tables-safe.sql
   ```

2. **Execute in Supabase**
   - Open Supabase Dashboard → SQL Editor
   - Create new query
   - Paste the entire SQL content
   - Click "Run"

3. **Verify Success**
   - Check for any error messages
   - Verify all tables are created
   - Test a few API endpoints

### **Option B: Command Line (Advanced)**

If you have direct database access:
```bash
# Using psql (if you have direct access)
psql "postgresql://[connection-string]" -f scripts/create-all-tables-safe.sql
```

## 📊 **Post-Deployment Verification**

### **1. Database Health Check**
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = ['profiles', 'team_matching_submissions', 'teams', 'team_members', 'team_chat_messages', 'team_formation_audit'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(\`\${table}: \${error ? '❌' : '✅'}\`);
  }
}

check();
"
```

### **2. Test Core Functionality**
- **Team Matching**: Visit `/team` and submit a questionnaire
- **Admin Dashboard**: Visit `/admin/dashboard` to see submissions
- **Team Approval**: Test the approval workflow
- **Team Chat**: Verify chat works after team approval

### **3. Test Enhanced Features**
- **Audit Trail**: Check that all actions are logged
- **CSV Export**: Test the export function
- **Statistics**: Verify enhanced stats include approval metrics

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Table already exists" errors**
- ✅ **Expected**: The script uses `IF NOT EXISTS` - these are safe warnings
- ✅ **Action**: Continue with deployment

#### **"Permission denied" errors**
- ❌ **Issue**: Insufficient database permissions
- 🔧 **Fix**: Ensure you're using the service role key

#### **"Function already exists" errors**
- ✅ **Expected**: The script uses `CREATE OR REPLACE` - these are safe
- ✅ **Action**: Continue with deployment

### **Verification Commands**

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 🎉 **Success Indicators**

### **✅ Deployment Successful When:**
- All tables created without errors
- RLS policies are active
- API endpoints return expected responses
- Team approval workflow functions
- Audit trail captures actions
- CSV export works correctly

### **🚀 Ready for Production When:**
- Database health check passes
- Core team matching works
- Admin approval workflow tested
- Chat activation works after approval
- All enhanced features verified

## 📋 **Next Steps After Deployment**

1. **Configure Admin Users**
   - Set up admin roles in your application
   - Test admin dashboard functionality

2. **Test Complete Workflow**
   - Submit questionnaires
   - Export to CSV
   - Form teams
   - Approve teams
   - Verify chat activation

3. **Monitor Performance**
   - Check query performance
   - Monitor audit trail growth
   - Verify index effectiveness

4. **Set Up Monitoring**
   - Database performance monitoring
   - Error tracking for API endpoints
   - Audit trail analysis

## 🔐 **Security Notes**

- ✅ All RLS policies are properly configured
- ✅ Audit trail is service-role only access
- ✅ Team approval requires admin permissions
- ✅ Chat access restricted to approved team members
- ✅ All existing security maintained and enhanced

Your enhanced database schema is now production-ready with comprehensive team management, approval workflows, and audit capabilities! 🚀