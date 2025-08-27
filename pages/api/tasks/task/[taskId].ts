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
  const { taskId } = req.query
  const { method } = req

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'Task ID is required' })
  }

  try {
    switch (method) {
      case 'GET':
        return await getTask(req, res, taskId)
      case 'PUT':
        return await updateTask(req, res, taskId)
      case 'DELETE':
        return await deleteTask(req, res, taskId)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Task API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Get a specific task
async function getTask(req: NextApiRequest, res: NextApiResponse, taskId: string) {
  try {
    const { data: task, error } = await supabase
      .from('task_details')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return res.status(404).json({ error: 'Task not found' })
    }

    // Transform the data to match frontend expectations
    const transformedTask = {
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
    }

    return res.status(200).json({ task: transformedTask })
  } catch (error) {
    console.error('Error in getTask:', error)
    return res.status(500).json({ error: 'Failed to fetch task' })
  }
}

// Update a task
async function updateTask(req: NextApiRequest, res: NextApiResponse, taskId: string) {
  try {
    const { title, description, priority, dueDate, status, assignees, updatedBy } = req.body

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) {
      updateData.due_date = dueDate ? new Date(dueDate).toISOString().split('T')[0] : null
    }

    // Update the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (taskError) {
      console.error('Error updating task:', taskError)
      return res.status(500).json({ error: 'Failed to update task' })
    }

    // Update assignees if provided
    if (assignees !== undefined) {
      // Remove existing assignees
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)

      // Add new assignees
      if (assignees.length > 0) {
        const assigneeData = assignees.map((userId: string) => ({
          task_id: taskId,
          user_id: userId,
          assigned_by: updatedBy || task.created_by
        }))

        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert(assigneeData)

        if (assigneeError) {
          console.error('Error updating assignees:', assigneeError)
          // Don't fail the request, just log the error
        }
      }
    }

    // Fetch the updated task with assignee details
    const { data: updatedTask, error: fetchError } = await supabase
      .from('task_details')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated task:', fetchError)
      return res.status(500).json({ error: 'Task updated but failed to fetch details' })
    }

    // Transform the response
    const transformedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      dueDate: updatedTask.due_date ? new Date(updatedTask.due_date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }) : null,
      assignees: updatedTask.assignees ? updatedTask.assignees.split(', ') : [],
      assigneeIds: updatedTask.assignee_ids ? updatedTask.assignee_ids.split(',') : [],
      createdBy: updatedTask.created_by_name,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at
    }

    return res.status(200).json({ task: transformedTask })
  } catch (error) {
    console.error('Error in updateTask:', error)
    return res.status(500).json({ error: 'Failed to update task' })
  }
}

// Delete a task (soft delete)
async function deleteTask(req: NextApiRequest, res: NextApiResponse, taskId: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ is_deleted: true })
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return res.status(500).json({ error: 'Failed to delete task' })
    }

    return res.status(200).json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error in deleteTask:', error)
    return res.status(500).json({ error: 'Failed to delete task' })
  }
}