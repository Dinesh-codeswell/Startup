# Supabase Auth Data Export Guide

## Overview
This guide provides multiple methods to extract authentication data from Supabase's `auth.users` table (not the profiles table) in CSV, JSON, and SQL formats.

## 🎯 **Quick Start**

### **Method 1: Using the Export Script (Recommended)**
```bash
# Export with metadata as CSV (most common)
node scripts/export-auth-users.js --format csv --type metadata

# Export basic data as JSON
node scripts/export-auth-users.js --format json --type basic

# Export with team data as SQL
node scripts/export-auth-users.js --format sql --type team

# Export statistics
node scripts/export-auth-users.js --format csv --type stats
```

### **Method 2: Direct SQL Queries**
Use the queries in `scripts/export-auth-users.sql` directly in Supabase Dashboard.

---

## 📊 **Export Types Available**

### **1. Basic Export**
Essential authentication fields only:
```sql
SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    role,
    aud
FROM auth.users
WHERE deleted_at IS NULL;
```

### **2. Metadata Export (Recommended)**
Includes extracted user metadata:
```sql
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'college_name' as college_name,
    raw_user_meta_data->>'full_name' as full_name,
    role
FROM auth.users
WHERE deleted_at IS NULL;
```

### **3. Team Data Export**
Auth users with their team matching submissions:
```sql
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    tms.status as team_status,
    tms.submitted_at,
    tms.matched_at,
    tms.preferred_team_size
FROM auth.users u
LEFT JOIN team_matching_submissions tms ON u.id = tms.user_id
WHERE u.deleted_at IS NULL;
```

### **4. Statistics Export**
Summary statistics about users:
```sql
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_who_logged_in,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_last_30_days
FROM auth.users
WHERE deleted_at IS NULL;
```

---

## 🛠 **Export Methods**

### **Method 1: Automated Script**

#### **Installation**
```bash
# The script is already created in scripts/export-auth-users.js
# No additional installation needed
```

#### **Usage Examples**
```bash
# Basic CSV export
node scripts/export-auth-users.js --format csv --type basic

# Detailed metadata export
node scripts/export-auth-users.js --format csv --type metadata

# Export with team matching data
node scripts/export-auth-users.js --format csv --type team

# Export as JSON
node scripts/export-auth-users.js --format json --type metadata

# Export as SQL INSERT statements
node scripts/export-auth-users.js --format sql --type metadata

# Custom filename
node scripts/export-auth-users.js --format csv --type metadata --filename my_users_export.csv
```

#### **Output Location**
Files are saved to: `exports/` directory in your project root

### **Method 2: Supabase Dashboard**

#### **Steps:**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy any query from `scripts/export-auth-users.sql`
4. Click **Run**
5. Click **Download CSV** button in results panel

#### **Recommended Query for Dashboard:**
```sql
-- Clean CSV export
SELECT 
    id,
    email,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    TO_CHAR(last_sign_in_at, 'YYYY-MM-DD HH24:MI:SS') as last_sign_in_at,
    TO_CHAR(email_confirmed_at, 'YYYY-MM-DD HH24:MI:SS') as email_confirmed_at,
    COALESCE(raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(raw_user_meta_data->>'last_name', '') as last_name,
    COALESCE(raw_user_meta_data->>'college_name', '') as college_name,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as email_confirmed,
    role
FROM auth.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### **Method 3: Command Line (psql)**

#### **Direct CSV Export:**
```bash
# Replace [password], [host] with your Supabase credentials
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -c "COPY (
    SELECT 
      id, email, created_at, last_sign_in_at, 
      raw_user_meta_data->>'first_name' as first_name,
      raw_user_meta_data->>'last_name' as last_name
    FROM auth.users 
    WHERE deleted_at IS NULL
  ) TO STDOUT WITH CSV HEADER" > auth_users.csv
```

### **Method 4: Supabase CLI**

#### **Using Supabase CLI:**
```bash
# Dump auth schema (includes users table)
supabase db dump --data-only --schema auth --table users > auth_users.sql

# Or dump specific data
supabase db dump --data-only --schema auth > auth_data.sql
```

### **Method 5: Programmatic Export**

#### **Using JavaScript/Node.js:**
```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(url, serviceKey)

async function exportAuthUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      created_at,
      last_sign_in_at,
      email_confirmed_at,
      raw_user_meta_data
    `)
    .is('deleted_at', null)

  if (error) {
    console.error('Error:', error)
    return
  }

  // Convert to CSV or process as needed
  console.log(data)
}
```

---

## 📋 **Available Fields in auth.users**

### **Core Fields**
- `id` - Unique user identifier (UUID)
- `email` - User email address
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp
- `last_sign_in_at` - Last login timestamp
- `email_confirmed_at` - Email confirmation timestamp
- `phone` - Phone number (if provided)
- `phone_confirmed_at` - Phone confirmation timestamp

### **Metadata Fields**
- `raw_user_meta_data` - JSON object with custom user data
  - `first_name`
  - `last_name`
  - `college_name`
  - `full_name`
  - `avatar_url`
  - `provider`
- `raw_app_meta_data` - JSON object with app-specific data

### **Authentication Fields**
- `role` - User role (usually 'authenticated')
- `aud` - Audience claim
- `confirmation_token` - Email confirmation token
- `recovery_token` - Password recovery token
- `email_change_token_new` - New email change token
- `email_change_token_current` - Current email change token

### **Status Fields**
- `email_change` - New email being changed to
- `email_change_confirm_status` - Email change confirmation status
- `banned_until` - Ban expiration timestamp
- `deleted_at` - Soft delete timestamp
- `is_super_admin` - Super admin flag

---

## 🔒 **Security Considerations**

### **⚠️ Important Notes**
1. **Service Role Required**: You need the service role key to access auth.users
2. **Sensitive Data**: auth.users contains sensitive information
3. **Token Security**: Never expose confirmation/recovery tokens
4. **Data Privacy**: Follow GDPR/privacy regulations when exporting user data

### **🛡️ Safe Export Practices**
```sql
-- ✅ SAFE: Export without sensitive tokens
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE deleted_at IS NULL;

-- ❌ UNSAFE: Don't export tokens
SELECT 
    confirmation_token,  -- Don't export this
    recovery_token,      -- Don't export this
    email_change_token_new  -- Don't export this
FROM auth.users;
```

---

## 📊 **Sample Export Results**

### **CSV Format:**
```csv
id,email,created_at,first_name,last_name,college_name,email_confirmed
123e4567-e89b-12d3-a456-426614174000,john@example.com,2024-01-15 10:30:00,John,Doe,MIT,Yes
987fcdeb-51a2-43d7-8f9e-123456789abc,jane@example.com,2024-01-16 14:20:00,Jane,Smith,Stanford,Yes
```

### **JSON Format:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "first_name": "John",
    "last_name": "Doe",
    "college_name": "MIT",
    "email_confirmed": "Yes"
  }
]
```

### **SQL Format:**
```sql
CREATE TABLE IF NOT EXISTS auth_users_export (
  id TEXT,
  email TEXT,
  created_at TEXT,
  first_name TEXT,
  last_name TEXT
);

INSERT INTO auth_users_export VALUES ('123e4567-e89b-12d3-a456-426614174000', 'john@example.com', '2024-01-15T10:30:00Z', 'John', 'Doe');
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Permission denied for table users"**
- **Solution**: Use service role key, not anon key
- **Check**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

#### **"relation auth.users does not exist"**
- **Solution**: Use `users` instead of `auth.users` in some contexts
- **Try**: Different query syntax based on your access method

#### **"No data returned"**
- **Check**: Users might be soft-deleted (`deleted_at IS NOT NULL`)
- **Solution**: Remove the `WHERE deleted_at IS NULL` filter to see all users

#### **Script fails with "Module not found"**
- **Solution**: Run `npm install @supabase/supabase-js` first
- **Check**: Ensure you're in the correct directory

### **Verification Steps**
```bash
# 1. Test connection
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# 2. Check exports directory
ls -la exports/

# 3. Verify file contents
head -5 exports/auth_users_metadata_2024-01-15.csv
```

---

## 🎯 **Best Practices**

### **✅ Recommended Approach**
1. **Use the automated script** for regular exports
2. **Export metadata type** for most use cases
3. **Use CSV format** for spreadsheet analysis
4. **Include date in filename** for version control
5. **Store exports securely** and delete when no longer needed

### **📅 Regular Export Schedule**
```bash
# Weekly export (add to cron job)
0 0 * * 0 cd /path/to/project && node scripts/export-auth-users.js --format csv --type metadata --filename weekly_users_$(date +\%Y-\%m-\%d).csv

# Monthly detailed export
0 0 1 * * cd /path/to/project && node scripts/export-auth-users.js --format csv --type team --filename monthly_users_$(date +\%Y-\%m).csv
```

This comprehensive guide provides everything you need to extract authentication data from Supabase safely and efficiently in multiple formats.