# Supabase to AWS Migration Inventory

## Overview

This document catalogs the current Supabase architecture and components that need to be migrated to AWS.

**Migration Date**: January 2025
**Current Stack**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
**Target Stack**: AWS (RDS PostgreSQL + Cognito + S3 + Lambda)

---

## 1. Database Schema Analysis

### Core Tables

#### Team Matching System Tables

- **team_matching_submissions** - Main user submissions for team matching

  - Primary key: `id` (UUID)
  - Foreign key: `user_id` → `auth.users(id)`
  - Contains: personal info, preferences, skills, availability
  - Status tracking: pending_match, matched, team_formed, inactive

- **teams** - Formed teams information

  - Primary key: `id` (UUID)
  - Contains: team_name, size, compatibility_score, chat_group_id
  - Status tracking: active, inactive, completed

- **team_members** - Junction table for team membership

  - Links teams to submissions
  - Unique constraint on (team_id, submission_id)

- **team_matching_batches** - Batch processing tracking

  - Tracks algorithm runs and statistics
  - Processing status and metrics

- **team_notifications** - Notification system
  - Links to submissions and teams
  - Delivery status tracking (pending, sent, failed)
  - Multiple delivery methods: email, sms, whatsapp

#### Team Chat System Tables

- **team_chat_messages** - Chat messages within teams

  - Message types: text, system, file, image
  - Reply threading support
  - Soft delete functionality

- **team_chat_participants** - Chat participation tracking

  - Last seen message tracking
  - Active status management

- **team_chat_reactions** - Message reactions/emojis

  - Unique constraint per user per message per emoji

- **team_chat_typing_indicators** - Real-time typing status
  - Auto-expiring records (10 seconds)

#### User Management Tables

- **profiles** - User profile information
  - Links to `auth.users(id)`
  - Contains: first_name, last_name, email, phone, etc.

### Database Functions

- `update_updated_at_column()` - Timestamp trigger function
- `update_submission_status_on_team_formation()` - Auto-status updates
- `add_team_members_to_chat()` - Auto-add to chat on team join
- `create_team_welcome_message()` - Welcome message creation
- `cleanup_expired_typing_indicators()` - Cleanup function
- `get_unread_message_count()` - Unread count calculation
- `get_team_matching_stats()` - Statistics aggregation

### Indexes

- Performance indexes on status fields, timestamps, foreign keys
- Composite indexes for common query patterns
- Partial indexes for active records only

---

## 2. Row Level Security (RLS) Policies

### Authentication-Based Access Control

- **User Data Access**: Users can only view/modify their own submissions
- **Team Data Access**: Users can only see teams they're members of
- **Chat Access**: Users can only access chat for their teams
- **Service Role Access**: Admin/service role has full access to all data

### Policy Categories

1. **User Ownership Policies** - Based on `auth.uid() = user_id`
2. **Team Membership Policies** - Based on team membership joins
3. **Service Role Policies** - Based on JWT role claim
4. **Chat Participation Policies** - Based on team membership

---

## 3. Authentication Methods and User Data

### Current Authentication Setup

- **Provider**: Supabase Auth
- **Method**: Email/Password authentication
- **Email Confirmation**: Disabled (handled via dashboard settings)
- **User Table**: `auth.users` (Supabase managed)

### User Registration Flow

1. User signs up with email/password
2. Automatic profile creation via trigger
3. Auto sign-in after registration
4. Profile data stored in `profiles` table

### Authentication Integration Points

- **Frontend**: Custom auth functions in `lib/auth.ts`
- **API Routes**: JWT-based authentication
- **Database**: RLS policies based on `auth.uid()`

---

## 4. API Endpoints and Custom Functions

### Team Matching API Routes

- `POST /api/team-matching/submit` - Submit team matching form
- `GET /api/team-matching/submissions` - Get submissions (admin)
- `POST /api/team-matching/form-teams` - Create teams from submissions
- `GET /api/team-matching/stats` - Get matching statistics
- `POST /api/team-matching/automated-formation` - Automated team formation
- `GET /api/team-matching/formation-stats` - Formation statistics
- `GET /api/team-matching/insights` - Matching insights
- `POST /api/team-matching/notifications` - Send notifications

### Team Chat API Routes

- `GET /api/team-chat/messages` - Get chat messages
- `POST /api/team-chat/messages` - Send chat message
- `POST /api/team-chat/reactions` - Add/remove reactions
- `PUT /api/team-chat/read` - Mark messages as read
- `POST /api/team-chat/typing` - Update typing status

### Case Match API Routes

- `POST /api/case-match/upload` - Upload CSV files
- `POST /api/case-match/analyze` - Analyze and match participants

### Reinforcement Learning API Routes

- `GET /api/rl-metrics` - Get RL performance metrics

### Resources API Routes

- `GET /api/resources/[id]/views` - Track resource views

---

## 5. Storage Buckets and File Structure

### Current File Storage

- **CSV Uploads**: Case match participant data
- **File Storage**: Limited usage, mainly for CSV processing
- **No Media Storage**: No images, documents, or user-uploaded files currently

### Storage Requirements for AWS

- **S3 Bucket**: For CSV file uploads and processing
- **Temporary Storage**: For algorithm processing files
- **Backup Storage**: For data exports and backups

---

## 6. Environment Variables and Configuration

### Current Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL="https://ehvqmrqxauvhnapfsamk.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="[Not visible in .env]"
NEXT_PUBLIC_LOGO_DEV_API_KEY="pk_RhoEcQeiTyy1kK1PHHSEaA"
```

### AWS Migration Environment Variables Needed

```env
# Database
AWS_RDS_HOST="your-rds-endpoint"
AWS_RDS_PORT="5432"
AWS_RDS_DATABASE="beyond_career"
AWS_RDS_USERNAME="postgres"
AWS_RDS_PASSWORD="your-password"

# Authentication
AWS_COGNITO_USER_POOL_ID="your-user-pool-id"
AWS_COGNITO_CLIENT_ID="your-client-id"
AWS_COGNITO_REGION="us-east-1"

# Storage
AWS_S3_BUCKET="beyond-career-storage"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Lambda Functions
AWS_LAMBDA_REGION="us-east-1"
```

---

## 7. Third-Party Integrations

### Current Integrations

1. **Logo.dev API** - For company logos

   - API Key: `NEXT_PUBLIC_LOGO_DEV_API_KEY`
   - Usage: Company logo fetching

2. **Google Drive** - For resource sharing

   - Links to shared folders for case study resources
   - No API integration, just static links

3. **Notification Services** (Configured but not fully implemented)
   - SMS providers: Twilio, AWS SNS
   - WhatsApp integration planned
   - Email notifications via Supabase

### Integration Migration Requirements

1. **Logo.dev** - No changes needed (external API)
2. **Google Drive** - No changes needed (static links)
3. **Notifications** - Migrate to AWS SES for email, AWS SNS for SMS

---

## 8. Real-time Features

### Current Real-time Functionality

1. **Team Chat** - Real-time messaging using Supabase Realtime
2. **Typing Indicators** - Live typing status updates
3. **Message Reactions** - Real-time reaction updates
4. **Notification System** - Real-time notification delivery

### AWS Migration for Real-time

- **WebSocket API Gateway** - For real-time connections
- **Lambda Functions** - For message processing
- **DynamoDB** - For session management
- **EventBridge** - For event-driven notifications

---

## 9. Data Export Requirements

### Tables to Export

- All team matching data (~1000+ submissions estimated)
- Team formations and chat history
- User profiles and authentication data
- Notification history and preferences

### Export Scripts Available

- `scripts/export-supabase-data.js` - Data export utility
- `scripts/import-to-aws.js` - AWS import utility

---

## 10. Migration Complexity Assessment

### High Complexity Components

1. **Authentication System** - Complete migration from Supabase Auth to Cognito
2. **Real-time Chat** - Migration from Supabase Realtime to WebSocket API
3. **RLS Policies** - Convert to application-level security

### Medium Complexity Components

1. **Database Schema** - Direct PostgreSQL migration
2. **API Routes** - Update database connections
3. **File Storage** - Migrate to S3

### Low Complexity Components

1. **Static Resources** - No changes needed
2. **Frontend Components** - Minimal changes to API calls
3. **Business Logic** - Algorithms remain unchanged

---

## 11. Migration Timeline Estimate

### Phase 1: Infrastructure Setup (1-2 weeks)

- Set up AWS RDS PostgreSQL
- Configure Cognito User Pool
- Set up S3 buckets
- Create Lambda functions

### Phase 2: Data Migration (1 week)

- Export Supabase data
- Import to AWS RDS
- Migrate user authentication data

### Phase 3: Application Migration (2-3 weeks)

- Update database connections
- Implement Cognito authentication
- Migrate real-time features
- Update API routes

### Phase 4: Testing and Deployment (1 week)

- End-to-end testing
- Performance optimization
- Production deployment

**Total Estimated Timeline: 5-7 weeks**
