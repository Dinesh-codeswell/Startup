# Database Setup Instructions

## Phase 2A: Database Setup - COMPLETED ✅

This document provides instructions for setting up the team matching database schema in Supabase.

## 🗃️ Database Schema Overview

The team matching system uses the following tables:

1. **`team_matching_submissions`** - Stores user questionnaire submissions
2. **`teams`** - Stores formed teams information
3. **`team_members`** - Junction table linking teams and submissions
4. **`team_matching_batches`** - Tracks batch processing of team formation
5. **`team_notifications`** - Stores notifications for users

## 🚀 Setup Instructions

### Option 1: Manual Setup (Recommended)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Execute the SQL Schema**
   - Copy the contents of `scripts/create-team-matching-tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the new tables listed

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## 🔧 Environment Variables

Ensure you have the following environment variables in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" # Optional but recommended
```

## 📊 Database Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Service role can access all data for admin operations

### Automatic Triggers
- `updated_at` timestamps are automatically maintained
- Submission status updates when teams are formed
- Statistics functions for dashboard analytics

### Indexes
- Optimized indexes for common queries
- Performance-focused design for large datasets

## 🧪 Testing the Setup

After setting up the database, you can test it by:

1. **Submit a Team Matching Form**
   - Go to `/team` in your application
   - Fill out and submit the questionnaire
   - Check the `team_matching_submissions` table in Supabase

2. **View Admin Dashboard**
   - Go to `/admin/dashboard`
   - You should see statistics and pending submissions

3. **Form Teams**
   - In the admin dashboard, click "Form Teams"
   - This will run the matching algorithm and create teams

## 🔍 Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - The database tables haven't been created yet
   - Run the SQL schema script in Supabase dashboard

2. **Permission denied errors**
   - Check that RLS policies are correctly set up
   - Verify your service role key is correct

3. **API connection issues**
   - Verify your Supabase URL and keys in `.env`
   - Check that your Supabase project is active

### Verification Queries

Run these queries in Supabase SQL Editor to verify setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'team_%';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'team_%';

-- Test statistics function
SELECT * FROM get_team_matching_stats();
```

## 📈 Next Steps

Once the database is set up, you can:

1. **Test Form Submissions** - Users can submit team matching forms
2. **Run Team Formation** - Admin can create teams from pending submissions
3. **View Analytics** - Dashboard shows real-time statistics
4. **Implement Notifications** - Add email/SMS notifications (Phase 2B)
5. **Create Chat Groups** - Integrate with WhatsApp/Discord (Phase 2C)

## 🔗 API Endpoints

The following API endpoints are now available:

- `POST /api/team-matching/submit` - Submit team matching form
- `GET /api/team-matching/stats` - Get dashboard statistics
- `GET /api/team-matching/submissions` - Get submissions (with filters)
- `POST /api/team-matching/form-teams` - Create teams from pending submissions

## 📝 Database Schema Details

### team_matching_submissions
- Stores all user questionnaire responses
- Includes skills, preferences, availability, etc.
- Status tracking (pending_match, matched, team_formed, inactive)

### teams
- Stores formed team information
- Includes compatibility scores and chat group links
- Team size and formation timestamps

### team_members
- Links teams to their members
- Junction table with role assignments
- Automatic status updates via triggers

### team_notifications
- Notification queue for users
- Multiple delivery methods (email, SMS, WhatsApp)
- Delivery status tracking

---

## ✅ Phase 2A Status: COMPLETED

- ✅ Database schema designed and documented
- ✅ TypeScript types and interfaces created
- ✅ Database service layer implemented
- ✅ API endpoints created and tested
- ✅ Admin dashboard components built
- ✅ Integration with existing matching algorithm
- ✅ Row Level Security policies configured
- ✅ Performance optimizations (indexes, triggers)

**Ready for Phase 2B: Team Formation Algorithm Integration**