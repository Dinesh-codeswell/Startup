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

  try {
    switch (method) {
      case 'GET':
        return await getTasks(req, res, teamId)
      case 'POST':
        return await createTask(req, res, teamId)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Tasks API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all tasks for a team
async function getTasks(req: NextApiRequest, res: NextApiResponse, teamId: string) {
  try {
    // Get tasks with assignee details using the task_details view
    const { data: tasks, error } = await supabase
      .from('task_details')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return res.status(500).json({ error: 'Failed to fetch tasks' })
    }

    // Transform the data to match frontend expectations
    const transformedTasks = tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }) : null,
      assignees: task.assignees ? task.assignees.split(', ') : [],
      assigneeIds: task.assignee_ids ? task.assignee_ids.split(',') : [],
      createdBy: task.created_by_name,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    })) || []

    return res.status(200).json({ tasks: transformedTasks })
  } catch (error) {
    console.error('Error in getTasks:', error)
    return res.status(500).json({ error: 'Failed to fetch tasks' })
  }
}

// Create a new task
async function createTask(req: NextApiRequest, res: NextApiResponse, teamId: string) {
  try {
    const { title, description, priority, dueDate, assignees, createdBy } = req.body

    if (!title || !createdBy) {
      return res.status(400).json({ error: 'Title and createdBy are required' })
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        team_id: teamId,
        created_by: createdBy,
        priority: priority || 'Medium',
        due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
        status: 'To Do'
      })
      .select()
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return res.status(500).json({ error: 'Failed to create task' })
    }

    // Add assignees if provided
    if (assignees && assignees.length > 0) {
      const assigneeData = assignees.map((userId: string) => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: createdBy
      }))

      const { error: assigneeError } = await supabase
        .from('task_assignees')
        .insert(assigneeData)

      if (assigneeError) {
        console.error('Error assigning task:', assigneeError)
        // Don't fail the request, just log the error
      }
    }

    // Fetch the created task with assignee details
    const { data: createdTask, error: fetchError } = await supabase
      .from('task_details')
      .select('*')
      .eq('id', task.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created task:', fetchError)
      return res.status(500).json({ error: 'Task created but failed to fetch details' })
    }

    // Transform the response
    const transformedTask = {
      id: createdTask.id,
      title: createdTask.title,
      description: createdTask.description,
      status: createdTask.status,
      priority: createdTask.priority,
      dueDate: createdTask.due_date ? new Date(createdTask.due_date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }) : null,
      assignees: createdTask.assignees ? createdTask.assignees.split(', ') : [],
      assigneeIds: createdTask.assignee_ids ? createdTask.assignee_ids.split(',') : [],
      createdBy: createdTask.created_by_name,
      createdAt: createdTask.created_at,
      updatedAt: createdTask.updated_at
    }

    return res.status(201).json({ task: transformedTask })
  } catch (error) {
    console.error('Error in createTask:', error)
    return res.status(500).json({ error: 'Failed to create task' })
  }
}