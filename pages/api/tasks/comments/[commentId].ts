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
  const { commentId } = req.query
  const { method } = req

  if (!commentId || typeof commentId !== 'string') {
    return res.status(400).json({ error: 'Comment ID is required' })
  }

  try {
    switch (method) {
      case 'PUT':
        return await updateComment(req, res, commentId)
      case 'DELETE':
        return await deleteComment(req, res, commentId)
      default:
        res.setHeader('Allow', ['PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Comment API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Update a comment
async function updateComment(req: NextApiRequest, res: NextApiResponse, commentId: string) {
  try {
    const { comment, userId } = req.body

    if (!comment || !userId) {
      return res.status(400).json({ error: 'Comment and userId are required' })
    }

    // Verify the comment exists and belongs to the user
    const { data: existingComment, error: checkError } = await supabase
      .from('task_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' })
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('task_comments')
      .update({ comment: comment.trim() })
      .eq('id', commentId)
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

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return res.status(500).json({ error: 'Failed to update comment' })
    }

    // Transform the response
    const transformedComment = {
      id: updatedComment.id,
      comment: updatedComment.comment,
      createdAt: updatedComment.created_at,
      userId: updatedComment.user_id,
      userName: updatedComment.profiles.first_name && updatedComment.profiles.last_name 
        ? `${updatedComment.profiles.first_name} ${updatedComment.profiles.last_name}`
        : updatedComment.profiles.email,
      userEmail: updatedComment.profiles.email
    }

    return res.status(200).json({ comment: transformedComment })
  } catch (error) {
    console.error('Error in updateComment:', error)
    return res.status(500).json({ error: 'Failed to update comment' })
  }
}

// Delete a comment
async function deleteComment(req: NextApiRequest, res: NextApiResponse, commentId: string) {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Verify the comment exists and belongs to the user
    const { data: existingComment, error: checkError } = await supabase
      .from('task_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' })
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return res.status(500).json({ error: 'Failed to delete comment' })
    }

    return res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error in deleteComment:', error)
    return res.status(500).json({ error: 'Failed to delete comment' })
  }
}