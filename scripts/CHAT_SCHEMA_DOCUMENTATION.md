# Comprehensive Chat System Database Schema Documentation

## Overview

This document describes the comprehensive chat system database schema designed for real-time messaging with optimal performance, scalability, and data integrity.

## Schema Design Principles

### 1. Storage Optimization
- **SMALLINT** for enumerated values (message types, user status, roles)
- **VARCHAR** with appropriate limits for text fields
- **TIMESTAMPTZ** for timezone-aware timestamps
- **JSONB** for flexible metadata storage
- **UUID** for primary keys ensuring global uniqueness

### 2. Performance Optimization
- Strategic indexing for common query patterns
- Partial indexes for filtered queries
- Materialized views for expensive aggregations
- Efficient foreign key relationships

### 3. Real-Time Capabilities
- Typing indicators with automatic expiration
- Read receipts with efficient tracking
- Message threading for organized conversations
- Real-time status updates

## Core Tables

### chat_messages
**Purpose**: Primary message storage with optimized data types

**Key Features**:
- Content limit of 4000 characters for reasonable message sizes
- Message type enumeration (1-5) for different message kinds
- Thread support for organized conversations
- Soft deletion with timestamps
- JSONB metadata for extensibility

**Storage Optimization**:
- SMALLINT for message_type (2 bytes vs 4+ bytes for VARCHAR)
- Boolean flags for efficient filtering
- Proper indexing for common queries

### chat_user_profiles
**Purpose**: User information for chat context

**Key Features**:
- Display name with 100 character limit
- User status enumeration (online, away, busy, offline)
- Avatar URL storage
- JSONB preferences for user settings
- Last seen tracking

### chat_threads
**Purpose**: Conversation threading for organized discussions

**Key Features**:
- Thread title and description
- Message count tracking
- Archive capability
- Creator tracking
- Last message timestamp

### chat_read_receipts
**Purpose**: Efficient read receipt tracking

**Key Features**:
- Unique constraint preventing duplicate receipts
- Team-scoped for proper isolation
- Timestamp tracking for read time
- Efficient querying with proper indexes

### chat_participants
**Purpose**: Team membership and participation tracking

**Key Features**:
- Role-based permissions (member, moderator, admin)
- Last activity tracking
- Notification settings in JSONB
- Last read message tracking
- Active status management

### chat_reactions
**Purpose**: Message reactions with emoji support

**Key Features**:
- Unicode emoji code storage
- Unique constraint per user per message per emoji
- Efficient querying and aggregation
- Cascade deletion with messages

### chat_typing_indicators
**Purpose**: Real-time typing indicators

**Key Features**:
- Automatic expiration (8 seconds)
- Thread-specific typing
- Unique constraint per user per team per thread
- Efficient cleanup mechanism

### chat_attachments
**Purpose**: File attachment metadata

**Key Features**:
- File size limits (100MB)
- MIME type validation
- Upload status tracking
- Thumbnail support
- URL storage for file access

### chat_mentions
**Purpose**: User mentions for notifications

**Key Features**:
- Different mention types (direct, everyone, here)
- Read status tracking
- Efficient notification queries
- Unique constraint preventing duplicates

## Indexing Strategy

### Primary Indexes
1. **Team-based queries**: `(team_id, created_at DESC)`
2. **Thread-based queries**: `(thread_id, created_at DESC)`
3. **User-based queries**: `(user_id, created_at DESC)`
4. **Status-based queries**: Partial indexes on active records

### Performance Indexes
1. **Full-text search**: GIN index on user display names
2. **Expiration cleanup**: Index on expires_at for typing indicators
3. **Unread messages**: Composite indexes for efficient counting
4. **File management**: Indexes on upload status and file types

## Functions and Procedures

### Core Functions

#### `update_timestamp()`
- Automatically updates `updated_at` fields
- Triggered on UPDATE operations
- Ensures consistent timestamp management

#### `update_thread_stats()`
- Maintains message count in threads
- Updates last message timestamp
- Triggered on message INSERT/DELETE

#### `cleanup_expired_typing()`
- Removes expired typing indicators
- Should be called periodically
- Maintains clean real-time state

#### `get_unread_count(user_id, team_id)`
- Efficiently calculates unread message count
- Uses last read message tracking
- Optimized for frequent calls

#### `mark_messages_read(user_id, team_id, message_id)`
- Updates participant's last read message
- Creates read receipts
- Marks mentions as read
- Atomic operation for consistency

#### `archive_old_messages(days_old)`
- Archives messages older than specified days
- Moves to separate archive table
- Returns count of archived messages
- Helps maintain performance

## Security Implementation

### Row Level Security (RLS)
- Enabled on all tables
- Team-based access control
- User-specific data protection
- Service role bypass for admin operations

### Key Policies
1. **Message Access**: Users can only see messages from their teams
2. **Profile Management**: Users can update their own profiles
3. **Participant Visibility**: Team members can see other participants
4. **Reaction Control**: Users can react to team messages
5. **Typing Indicators**: Team-scoped visibility

## Performance Features

### Materialized Views

#### `chat_team_stats`
- Pre-calculated team statistics
- Total messages, active users, recent activity
- Refreshed periodically
- Optimizes dashboard queries

### Query Optimization Views

#### `chat_messages_with_details`
- Joins messages with sender information
- Includes reaction and read counts
- Filters deleted messages
- Optimizes common UI queries

#### `chat_active_participants`
- Shows active team participants
- Includes user profile information
- Filters inactive users
- Optimizes participant lists

## Scalability Considerations

### Partitioning Strategy
- Messages can be partitioned by date
- Improves query performance on large datasets
- Enables efficient archiving
- Example partition structure included

### Archive Strategy
- Automatic archiving of old messages
- Separate archive tables
- Maintains performance on active data
- Configurable retention periods

### Cleanup Procedures
- Expired typing indicators cleanup
- Old attachment cleanup
- Archive old conversations
- Vacuum and analyze scheduling

## Data Types Rationale

### Storage Efficiency
- **SMALLINT** (2 bytes) vs **INTEGER** (4 bytes) for enums
- **VARCHAR(n)** vs **TEXT** for bounded strings
- **BOOLEAN** (1 byte) for flags
- **TIMESTAMPTZ** for timezone handling
- **JSONB** for flexible metadata

### Performance Impact
- Smaller data types = better cache utilization
- Proper constraints enable query optimization
- Strategic NULL handling
- Efficient foreign key relationships

## Real-Time Features

### Typing Indicators
- 8-second expiration for natural feel
- Thread-specific typing
- Automatic cleanup
- Efficient real-time queries

### Read Receipts
- Per-message tracking
- Team-scoped visibility
- Efficient aggregation
- Privacy-conscious design

### Live Updates
- Optimized for real-time applications
- Minimal database load
- Efficient change detection
- WebSocket-friendly structure

## Migration and Deployment

### Deployment Steps
1. Run the comprehensive schema script
2. Verify all tables and indexes created
3. Test security policies
4. Initialize materialized views
5. Set up cleanup procedures

### Monitoring
- Query performance metrics
- Table size monitoring
- Index usage statistics
- Archive effectiveness

### Maintenance
- Regular VACUUM and ANALYZE
- Materialized view refresh
- Archive old data
- Monitor query performance

## Integration Guidelines

### API Design
- Use prepared statements for security
- Implement connection pooling
- Cache frequently accessed data
- Use transactions for multi-table operations

### Real-Time Integration
- WebSocket connections for live updates
- Efficient polling for typing indicators
- Push notifications for mentions
- Optimistic UI updates

### Error Handling
- Graceful constraint violation handling
- Retry logic for temporary failures
- Proper error logging
- User-friendly error messages

## Conclusion

This comprehensive chat schema provides:
- **Optimal Performance**: Strategic indexing and data types
- **Real-Time Capability**: Typing indicators and live updates
- **Scalability**: Partitioning and archiving strategies
- **Security**: Row-level security and proper constraints
- **Maintainability**: Clear structure and documentation
- **Extensibility**: JSONB fields for future features

The schema is production-ready and designed to handle high-volume real-time chat applications while maintaining data integrity and performance.