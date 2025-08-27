import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { teamId } = req.query
  const { method } = req

  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Team ID is required' })
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${method} not allowed` })
  }

  try {
    return await getTaskStats(req, res, teamId)
  } catch (error) {
    console.error('Task stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Get task statistics for a team
async function getTaskStats(req: NextApiRequest, res: NextApiResponse, teamId: string) {
  try {
    // Get task statistics using the team_task_stats view
    const { data: stats, error: statsError } = await supabase
      .from('team_task_stats')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching task stats:', statsError)
      return res.status(500).json({ error: 'Failed to fetch task statistics' })
    }

    // If no stats found, return default values
    const taskStats = stats || {
      total_tasks: 0,
      todo_count: 0,
      in_progress_count: 0,
      completed_count: 0,
      not_started_count: 0,
      pending_count: 0,
      high_priority_count: 0,
      medium_priority_count: 0,
      low_priority_count: 0,
      overdue_count: 0,
      completion_percentage: 0,
      tasks_with_due_date: 0
    }

    // Get recent task activity (last 7 days)
    const { data: recentTasks, error: recentError } = await supabase
      .from('tasks')
      .select('id, title, status, created_at, updated_at')
      .eq('team_id', teamId)
      .eq('is_deleted', false)
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent tasks:', recentError)
      // Don't fail the request, just return empty array
    }

    // Get upcoming deadlines (next 7 days)
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('task_details')
      .select('id, title, due_date, priority, assignees')
      .eq('team_id', teamId)
      .neq('status', 'Completed')
      .gte('due_date', new Date().toISOString().split('T')[0])
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5)

    if (upcomingError) {
      console.error('Error fetching upcoming tasks:', upcomingError)
      // Don't fail the request, just return empty array
    }

    // Transform the response
    const response = {
      statistics: {
        totalTasks: taskStats.total_tasks,
        todoCount: taskStats.todo_count,
        inProgressCount: taskStats.in_progress_count,
        completedCount: taskStats.completed_count,
        notStartedCount: taskStats.not_started_count,
        pendingCount: taskStats.pending_count,
        highPriorityCount: taskStats.high_priority_count,
        mediumPriorityCount: taskStats.medium_priority_count,
        lowPriorityCount: taskStats.low_priority_count,
        overdueCount: taskStats.overdue_count,
        completionPercentage: taskStats.completion_percentage,
        tasksWithDueDate: taskStats.tasks_with_due_date
      },
      recentActivity: recentTasks?.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      })) || [],
      upcomingDeadlines: upcomingTasks?.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.due_date,
        priority: task.priority,
        assignees: task.assignees ? task.assignees.split(', ') : []
      })) || []
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error in getTaskStats:', error)
    return res.status(500).json({ error: 'Failed to fetch task statistics' })
  }
}