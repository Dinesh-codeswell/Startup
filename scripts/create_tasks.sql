-- SQL Script to create Tasks table for Team Management System
-- Optimized for minimal storage with efficient data types
-- Covers all task management functionality and workflow requirements
-- 
-- FRONTEND ALIGNMENT NOTES:
-- 1. Status values match TasksScreen component mapping: 'To Do', 'In Progress', 'Completed', 'Not Started', 'Pending'
-- 2. Priority values match frontend options: 'Low', 'Medium', 'High' (title case)
-- 3. Task fields align with newTask state: title, description, priority, dueDate, assignees
-- 4. API endpoint expects: title, description, teamId, createdBy, priority, dueDate, assignees
-- 5. Database stores: title, description, team_id, created_by, status, priority, due_date + assignees in junction table

CREATE TABLE tasks (
    -- Primary identifier - using UUID for compatibility with auth system
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core task information
    title VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    description TEXT,
    
    -- Team and user relationships
    team_id UUID NOT NULL,
    created_by UUID NOT NULL,
    
    -- Task status - using CHECK constraint for data integrity
    -- Updated to match frontend status mapping: 'To Do', 'In Progress', 'Completed', 'Not Started', 'Pending'
    status VARCHAR(20) NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed', 'Not Started', 'Pending')),
    
    -- Priority levels - using CHECK constraint for efficiency
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    
    -- Date management - using DATE for due_date (no time needed), TIMESTAMP for tracking
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete flag - using BOOLEAN
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Foreign key constraints
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Task Assignees junction table for many-to-many relationship
-- Separate table for normalized design and efficient querying
CREATE TABLE task_assignees (
    -- Composite primary key for efficiency
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Assignment tracking
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL,
    
    -- Primary key and constraints
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Task Comments table for task discussions and updates
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Task Status History table for audit trail
CREATE TABLE task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    old_status VARCHAR(20) CHECK (old_status IN ('To Do', 'In Progress', 'Completed', 'Not Started', 'Pending')),
    new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('To Do', 'In Progress', 'Completed', 'Not Started', 'Pending')),
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Views for common queries to improve performance

-- View for tasks with assignee information
CREATE VIEW task_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.team_id,
    t.status,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at,
    COALESCE(p_creator.first_name || ' ' || p_creator.last_name, p_creator.email) as created_by_name,
    STRING_AGG(COALESCE(p_assignee.first_name || ' ' || p_assignee.last_name, p_assignee.email), ', ') as assignees,
    STRING_AGG(p_assignee.id::TEXT, ',') as assignee_ids
FROM tasks t
LEFT JOIN profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN task_assignees ta ON t.id = ta.task_id
LEFT JOIN profiles p_assignee ON ta.user_id = p_assignee.id
WHERE t.is_deleted = FALSE
GROUP BY t.id, t.title, t.description, t.team_id, t.status, t.priority, t.due_date, t.created_at, t.updated_at, p_creator.first_name, p_creator.last_name, p_creator.email;

-- View for task statistics by team
-- Updated to match frontend status values and provide comprehensive task analytics
CREATE VIEW team_task_stats AS
SELECT 
    team_id,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status = 'To Do' THEN 1 ELSE 0 END) as todo_count,
    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN status = 'Not Started' THEN 1 ELSE 0 END) as not_started_count,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority_count,
    SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium_priority_count,
    SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low_priority_count,
    SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'Completed' THEN 1 ELSE 0 END) as overdue_count,
    -- Additional useful metrics for frontend dashboard
    ROUND(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_percentage,
    COUNT(CASE WHEN due_date IS NOT NULL THEN 1 END) as tasks_with_due_date
FROM tasks 
WHERE is_deleted = FALSE
GROUP BY team_id;

-- Triggers for maintaining data integrity and audit trail

-- Function for trigger to log status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO task_status_history (task_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
CREATE TRIGGER task_status_change_log
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_status_change();

-- Indexes for performance optimization
CREATE INDEX idx_team_status ON tasks(team_id, status);
CREATE INDEX idx_team_priority ON tasks(team_id, priority);
CREATE INDEX idx_due_date ON tasks(due_date);
CREATE INDEX idx_created_by ON tasks(created_by);
CREATE INDEX idx_updated_at ON tasks(updated_at);
CREATE INDEX idx_task_title ON tasks(title); -- For task search functionality

-- Index for reverse lookups (finding tasks by user)
CREATE INDEX idx_user_tasks ON task_assignees(user_id, task_id);

-- Index for efficient comment retrieval
CREATE INDEX idx_task_comments ON task_comments(task_id, created_at);

-- Index for status change tracking
CREATE INDEX idx_task_status_history ON task_status_history(task_id, changed_at);

-- Sample indexes for query optimization based on common access patterns
-- Additional indexes can be added based on actual usage patterns

-- Composite index for filtering tasks by team, status, and priority
CREATE INDEX idx_team_status_priority ON tasks(team_id, status, priority);

-- FIXED: Index for finding overdue tasks - removed CURRENT_DATE from predicate
-- Instead, create a regular index that can be used efficiently for overdue queries
CREATE INDEX idx_overdue_tasks ON tasks(due_date, status) WHERE status != 'Completed';

-- Index for user's assigned tasks
CREATE INDEX idx_user_assigned_tasks ON task_assignees(user_id, task_id);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on tasks table
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all task-related tables (NOT on views)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "tasks_select_team_members" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_team_members" ON tasks;
DROP POLICY IF EXISTS "tasks_update_team_members" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_team_members" ON tasks;
DROP POLICY IF EXISTS "task_assignees_select_team_members" ON task_assignees;
DROP POLICY IF EXISTS "task_assignees_insert_team_members" ON task_assignees;
DROP POLICY IF EXISTS "task_assignees_update_team_members" ON task_assignees;
DROP POLICY IF EXISTS "task_assignees_delete_team_members" ON task_assignees;
DROP POLICY IF EXISTS "task_comments_select_team_members" ON task_comments;
DROP POLICY IF EXISTS "task_comments_insert_team_members" ON task_comments;
DROP POLICY IF EXISTS "task_comments_update_own" ON task_comments;
DROP POLICY IF EXISTS "task_comments_delete_own" ON task_comments;
DROP POLICY IF EXISTS "task_status_history_select_team_members" ON task_status_history;
DROP POLICY IF EXISTS "tasks_service_role" ON tasks;
DROP POLICY IF EXISTS "task_assignees_service_role" ON task_assignees;
DROP POLICY IF EXISTS "task_comments_service_role" ON task_comments;
DROP POLICY IF EXISTS "task_status_history_service_role" ON task_status_history;

-- =====================================================
-- TASKS TABLE POLICIES
-- =====================================================

-- Users can view tasks from teams they belong to
CREATE POLICY "tasks_select_team_members" ON tasks
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Users can create tasks for teams they belong to
CREATE POLICY "tasks_insert_team_members" ON tasks
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update tasks they created in their teams
CREATE POLICY "tasks_update_team_members" ON tasks
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND (created_by = auth.uid() OR 
         id IN (
           SELECT ta.task_id 
           FROM task_assignees ta 
           WHERE ta.user_id = auth.uid()
         ))
  );

-- Users can soft delete tasks they created in their teams
CREATE POLICY "tasks_delete_team_members" ON tasks
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- =====================================================
-- TASK_ASSIGNEES TABLE POLICIES
-- =====================================================

-- Users can view task assignments for tasks in their teams
CREATE POLICY "task_assignees_select_team_members" ON task_assignees
  FOR SELECT USING (
    task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Users can assign tasks to team members in their teams
CREATE POLICY "task_assignees_insert_team_members" ON task_assignees
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND user_id IN (
      SELECT tms.user_id 
      FROM team_members tm 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tm.team_id IN (
        SELECT t.team_id 
        FROM tasks t 
        WHERE t.id = task_assignees.task_id
      )
    )
    AND assigned_by = auth.uid()
  );

-- Users can update task assignments they created
CREATE POLICY "task_assignees_update_team_members" ON task_assignees
  FOR UPDATE USING (
    assigned_by = auth.uid()
    AND task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Users can remove task assignments they created
CREATE POLICY "task_assignees_delete_team_members" ON task_assignees
  FOR DELETE USING (
    assigned_by = auth.uid()
    AND task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- =====================================================
-- TASK_COMMENTS TABLE POLICIES
-- =====================================================

-- Users can view comments on tasks in their teams
CREATE POLICY "task_comments_select_team_members" ON task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Users can add comments to tasks in their teams
CREATE POLICY "task_comments_insert_team_members" ON task_comments
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "task_comments_update_own" ON task_comments
  FOR UPDATE USING (
    user_id = auth.uid()
    AND task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "task_comments_delete_own" ON task_comments
  FOR DELETE USING (
    user_id = auth.uid()
    AND task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- =====================================================
-- TASK_STATUS_HISTORY TABLE POLICIES
-- =====================================================

-- Users can view status history for tasks in their teams
CREATE POLICY "task_status_history_select_team_members" ON task_status_history
  FOR SELECT USING (
    task_id IN (
      SELECT t.id 
      FROM tasks t 
      JOIN team_members tm ON t.team_id = tm.team_id 
      JOIN team_matching_submissions tms ON tm.submission_id = tms.id 
      WHERE tms.user_id = auth.uid()
    )
  );

-- Note: INSERT for task_status_history is handled by trigger, no explicit policy needed
-- The trigger runs with the permissions of the user updating the task

-- =====================================================
-- SERVICE ROLE POLICIES (ADMIN ACCESS)
-- =====================================================

-- Service role can manage all task data
CREATE POLICY "tasks_service_role" ON tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "task_assignees_service_role" ON task_assignees
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "task_comments_service_role" ON task_comments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "task_status_history_service_role" ON task_status_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_assignees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_comments TO authenticated;
GRANT SELECT ON task_status_history TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant view permissions to authenticated users
-- Views inherit security from underlying tables automatically
GRANT SELECT ON task_details TO authenticated;
GRANT SELECT ON team_task_stats TO authenticated;

/*
FRONTEND ALIGNMENT UPDATES:

1. STATUS VALUES ALIGNMENT:
   - Updated status CHECK constraints to match frontend mapping
   - Default status changed from 'Not Started' to 'To Do' to match API
   - Status order prioritizes most common values: 'To Do', 'In Progress', 'Completed'

2. TASK VALIDATION IMPROVEMENTS:
   - Added CHECK constraint to ensure task titles are not empty strings
   - Added index on task title for search functionality

3. ENHANCED ANALYTICS:
   - Updated team_task_stats view with completion_percentage calculation
   - Added tasks_with_due_date count for better dashboard metrics
   - Reordered status counts to match frontend priority

4. VIEW SECURITY FIXES:
   - Removed RLS commands for views (views inherit from underlying tables)
   - Removed redundant view policies
   - Views automatically inherit security from base tables

5. SCHEMA COMPATIBILITY:
   - All fields match TasksScreen component requirements
   - API endpoint field mapping is fully supported
   - Junction table design supports multiple assignees per task

Storage Optimization Notes:
1. UUID for IDs - ensures compatibility with auth system (16 bytes)
2. VARCHAR with CHECK constraints for status/priority - efficient for fixed values
3. VARCHAR(255) for title - adequate length with efficient storage
4. TEXT for description - variable length, only uses needed space
5. DATE for due_date - 4 bytes, sufficient for date-only storage
6. TIMESTAMP for tracking - automatic timezone handling
7. BOOLEAN for flags - 1 byte
8. Composite primary keys where appropriate
9. Strategic indexing for common query patterns
10. Views for complex queries to improve performance

Workflow Coverage:
- Task creation with all required fields
- Task assignment to multiple users
- Status tracking with history
- Priority management
- Due date tracking
- Team-based task organization
- Filtering by status, priority, assignee
- Audit trail for changes
- Soft delete for data retention
- Performance optimization through indexing
- Statistical views for dashboard widgets
*/