# Team Chat Production Schema Guide

## Overview

This document describes the production-ready team chat database schema created specifically for this application. The schema has been built from scratch to perfectly match the application's TypeScript interfaces, service layer requirements, and real-time chat functionality.

## Key Design Principles

### 1. **Application-Specific Design**
- Uses `submission_id` instead of generic `user_id` to match the team matching system
- Aligns perfectly with TypeScript interfaces in `lib/types/team-chat.ts`
- Supports the exact workflow used by `TeamChatService`
- Optimized for the API endpoints in `app/api/team-chat/`

### 2. **Storage Efficiency**
- **VARCHAR(10)** for message types (text, system, file, image)
- **VARCHAR(10)** for reaction emojis (supports Unicode emojis)
- **TEXT** with 2000 character limit for messages (matches application config)
- **TIMESTAMPTZ** for all timestamps (timezone-aware)
- **UUID** for all IDs (consistent with application)

### 3. **Real-Time Performance**
- 20+ strategic indexes for fast queries
- Partial indexes for common patterns (recent messages, popular reactions)
- Optimized views for API responses
- Efficient typing indicator cleanup

### 4. **Data Integrity**
- Comprehensive constraints and checks
- Foreign key relationships with proper cascade rules
- Row Level Security (RLS) for multi-tenant security
- Automatic timestamp updates

## Database Tables

### 1. `team_chat_messages`
**Purpose**: Store all chat messages

```sql
Key Fields:
- id: UUID (Primary Key)
- team_id: UUID (Team identifier)
- sender_submission_id: UUID (Sender's submission ID, NULL for system messages)
- message_text: TEXT (Message content, max 2000 chars)
- message_type: VARCHAR(10) (text, system, file, image)
- reply_to_message_id: UUID (For threaded conversations)
- is_edited/is_deleted: BOOLEAN (Soft delete and edit tracking)
- created_at/updated_at: TIMESTAMPTZ (Automatic timestamps)
```

**Optimizations**:
- Index on `(team_id, created_at DESC)` for message retrieval
- Full-text search index on message content
- Partial index for recent messages (last 7 days)

### 2. `team_chat_participants`
**Purpose**: Track team membership and read status

```sql
Key Fields:
- id: UUID (Primary Key)
- team_id: UUID (Team identifier)
- submission_id: UUID (Participant's submission ID)
- last_message_seen_id: UUID (For unread count calculation)
- last_seen_at: TIMESTAMPTZ (Activity tracking)
- is_active: BOOLEAN (Membership status)
```

**Optimizations**:
- Unique constraint on `(team_id, submission_id)`
- Index on active participants for fast membership checks

### 3. `team_chat_reactions`
**Purpose**: Store emoji reactions to messages

```sql
Key Fields:
- id: UUID (Primary Key)
- message_id: UUID (References team_chat_messages)
- sender_submission_id: UUID (Who reacted)
- reaction_emoji: VARCHAR(10) (Emoji character)
- created_at: TIMESTAMPTZ (When reacted)
```

**Optimizations**:
- Unique constraint prevents duplicate reactions
- Index on popular emojis for trending reactions
- Cascade delete when message is deleted

### 4. `team_chat_typing_indicators`
**Purpose**: Real-time typing status

```sql
Key Fields:
- id: UUID (Primary Key)
- team_id: UUID (Team identifier)
- submission_id: UUID (Who is typing)
- is_typing: BOOLEAN (Current typing status)
- expires_at: TIMESTAMPTZ (Auto-cleanup timestamp)
```

**Optimizations**:
- Automatic expiration after 10 seconds
- Cleanup function removes expired indicators
- Unique constraint per team/user combination

### 5. `team_chat_read_receipts`
**Purpose**: Track message read status

```sql
Key Fields:
- id: UUID (Primary Key)
- message_id: UUID (Which message was read)
- reader_submission_id: UUID (Who read it)
- team_id: UUID (Team context)
- read_at: TIMESTAMPTZ (When read)
```

**Optimizations**:
- Unique constraint prevents duplicate receipts
- Index for fast unread count calculations
- Batch insert for marking multiple messages as read

## Advanced Features

### 1. **Utility Functions**

#### `get_unread_message_count(team_id, submission_id)`
- Efficiently calculates unread messages for a user
- Uses participant's `last_message_seen_id` as baseline
- Returns integer count

#### `mark_messages_as_read(team_id, submission_id, last_message_id)`
- Updates participant's read status
- Creates read receipts for all unread messages
- Handles batch operations efficiently

#### `cleanup_expired_typing_indicators()`
- Removes expired typing indicators
- Should be called periodically (every minute)
- Returns count of cleaned up records

#### `get_team_chat_stats(team_id)`
- Returns comprehensive team statistics
- Includes message counts, active participants
- Returns JSON format for API responses

### 2. **Optimized Views**

#### `team_chat_messages_with_details`
- Pre-joins message data with reaction/read counts
- Filters out deleted messages
- Optimized for API responses

#### `team_chat_active_participants`
- Shows only active team members
- Includes calculated unread counts
- Ready for participant list APIs

### 3. **Row Level Security (RLS)**

**Security Model**:
- Users can only access data from teams they belong to
- Users can only modify their own messages/reactions
- Automatic filtering based on `auth.uid()`
- Prevents data leakage between teams

**Policies Applied**:
- View messages from joined teams only
- Insert messages to joined teams only
- Update/delete own messages only
- Manage own typing indicators and reactions

## Performance Characteristics

### **Query Performance**
- Message retrieval: `O(log n)` with team_id + created_at index
- Unread count: `O(log n)` with optimized function
- Typing indicators: `O(1)` with unique constraints
- Reaction queries: `O(log n)` with message_id index

### **Storage Efficiency**
- Messages: ~100-200 bytes per message (depending on content)
- Reactions: ~50 bytes per reaction
- Typing indicators: ~40 bytes per indicator (auto-cleanup)
- Read receipts: ~50 bytes per receipt

### **Scalability Features**
- Partial indexes reduce index size for large datasets
- Soft delete preserves data while maintaining performance
- Automatic cleanup prevents unbounded growth
- Efficient pagination support with offset/limit

## Integration with Application

### **TypeScript Interface Alignment**

```typescript
// Perfect match with TeamChatMessage interface
interface TeamChatMessage {
  id: string                    // UUID from database
  team_id: string              // team_id column
  sender_submission_id: string // sender_submission_id column
  message_text: string         // message_text column
  message_type: string         // message_type column
  reply_to_message_id?: string // reply_to_message_id column
  is_edited: boolean           // is_edited column
  is_deleted: boolean          // is_deleted column
  created_at: string           // created_at column (ISO string)
  updated_at: string           // updated_at column (ISO string)
}
```

### **Service Layer Integration**

The schema supports all `TeamChatService` methods:
- `sendMessage()` - Insert into team_chat_messages
- `getMessages()` - Query with pagination and filters
- `addReaction()` - Insert into team_chat_reactions
- `updateTypingIndicator()` - Upsert typing indicators
- `markMessagesRead()` - Use mark_messages_as_read function
- `getTeamParticipants()` - Query active participants view
- `getUnreadMessageCount()` - Use get_unread_message_count function

### **API Endpoint Support**

Direct support for all API endpoints:
- `POST /api/team-chat/messages` - Message creation
- `GET /api/team-chat/messages` - Message retrieval with filters
- `POST /api/team-chat/reactions` - Reaction management
- `POST /api/team-chat/typing` - Typing indicator updates
- `POST /api/team-chat/read` - Read status updates

## Deployment Instructions

### **1. Prerequisites**
```sql
-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### **2. Schema Creation**
```bash
# Run the production schema script
psql $DATABASE_URL -f scripts/team-chat-production-schema.sql
```

### **3. Verification**
The script includes automatic verification:
- Checks that all 5 tables were created
- Validates indexes and functions
- Confirms RLS policies are active

### **4. Maintenance Setup**
```sql
-- Set up periodic cleanup (run every minute)
-- Add to your cron job or scheduled task system
SELECT cleanup_expired_typing_indicators();
```

## Monitoring and Maintenance

### **Performance Monitoring**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename LIKE 'team_chat_%'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE tablename LIKE 'team_chat_%';
```

### **Regular Maintenance**
```sql
-- Update table statistics (run weekly)
ANALYZE team_chat_messages;
ANALYZE team_chat_participants;
ANALYZE team_chat_reactions;
ANALYZE team_chat_typing_indicators;
ANALYZE team_chat_read_receipts;

-- Cleanup expired typing indicators (run every minute)
SELECT cleanup_expired_typing_indicators();
```

## Security Considerations

### **Data Protection**
- All sensitive operations protected by RLS
- No direct table access without proper team membership
- Automatic filtering prevents data leakage
- Audit trail through timestamps and soft deletes

### **Input Validation**
- Message length limits prevent abuse
- Message type constraints ensure data integrity
- Emoji validation for reactions
- Timestamp constraints prevent invalid data

### **Access Control**
- Team-based isolation through RLS policies
- User can only modify their own content
- Read access limited to team members
- System messages handled separately

## Conclusion

This production schema provides:

✅ **Perfect Application Alignment** - Matches TypeScript interfaces exactly  
✅ **Optimal Performance** - Strategic indexing and query optimization  
✅ **Real-Time Ready** - Efficient typing indicators and live updates  
✅ **Scalable Design** - Handles growth with partial indexes and cleanup  
✅ **Secure by Default** - Comprehensive RLS and data validation  
✅ **Maintainable** - Clear structure with automated maintenance  
✅ **Production Ready** - Comprehensive error handling and monitoring  

The schema is ready for immediate deployment and will support high-volume real-time chat functionality while maintaining excellent performance and security.