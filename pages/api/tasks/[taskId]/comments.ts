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
        return await getComments(req, res, taskId)
      case 'POST':
        return await createComment(req, res, taskId)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Task comments API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all comments for a task
async function getComments(req: NextApiRequest, res: NextApiResponse, taskId: string) {
  try {
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        id,
        comment,
        created_at,
        user_id,
        profiles!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }

    // Transform the data to match frontend expectations
    const transformedComments = comments?.map(comment => ({
      id: comment.id,
      comment: comment.comment,
      createdAt: comment.created_at,
      userId: comment.user_id,
      userName: comment.profiles.first_name && comment.profiles.last_name 
        ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
        : comment.profiles.email,
      userEmail: comment.profiles.email
    })) || []

    return res.status(200).json({ comments: transformedComments })
  } catch (error) {
    console.error('Error in getComments:', error)
    return res.status(500).json({ error: 'Failed to fetch comments' })
  }
}

// Create a new comment
async function createComment(req: NextApiRequest, res: NextApiResponse, taskId: string) {
  try {
    const { comment, userId } = req.body

    if (!comment || !userId) {
      return res.status(400).json({ error: 'Comment and userId are required' })
    }

    // Verify the task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('is_deleted', false)
      .single()

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Create the comment
    const { data: newComment, error: commentError } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        comment: comment.trim()
      })
      .select(`
        id,
        comment,
        created_at,
        user_id,
        profiles!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return res.status(500).json({ error: 'Failed to create comment' })
    }

    // Transform the response
    const transformedComment = {
      id: newComment.id,
      comment: newComment.comment,
      createdAt: newComment.created_at,
      userId: newComment.user_id,
      userName: newComment.profiles.first_name && newComment.profiles.last_name 
        ? `${newComment.profiles.first_name} ${newComment.profiles.last_name}`
        : newComment.profiles.email,
      userEmail: newComment.profiles.email
    }

    return res.status(201).json({ comment: transformedComment })
  } catch (error) {
    console.error('Error in createComment:', error)
    return res.status(500).json({ error: 'Failed to create comment' })
  }
}