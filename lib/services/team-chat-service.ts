import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  TeamChatMessage,
  TeamChatMessageWithSender,
  TeamChatParticipant,
  TeamChatParticipantWithDetails,
  TeamChatReaction,
  TeamChatTypingIndicator,
  SendMessageRequest,
  GetMessagesRequest,
  UpdateTypingRequest,
  AddReactionRequest,
  MarkMessagesReadRequest,
  TeamChatStats,
  DEFAULT_CHAT_CONFIG
} from '@/lib/types/team-chat'

export class TeamChatService {
  
  /**
   * Send a message to team chat
   */
  static async sendMessage(
    senderSubmissionId: string,
    request: SendMessageRequest
  ): Promise<TeamChatMessageWithSender> {
    // Validate message length
    if (request.message_text.length > DEFAULT_CHAT_CONFIG.max_message_length) {
      throw new Error(`Message too long. Maximum ${DEFAULT_CHAT_CONFIG.max_message_length} characters allowed.`)
    }

    // Validate user is part of the team
    await this.validateTeamMembership(request.team_id, senderSubmissionId)

    const messageData = {
      team_id: request.team_id,
      sender_submission_id: senderSubmissionId,
      message_text: request.message_text.trim(),
      message_type: request.message_type || 'text',
      reply_to_message_id: request.reply_to_message_id || null
    }

    const { data, error } = await supabaseAdmin
      .from('team_chat_messages')
      .insert(messageData)
      .select(`
        *,
        sender:team_matching_submissions!sender_submission_id(
          id,
          full_name,
          college_name
        ),
        reply_to:team_chat_messages!reply_to_message_id(
          id,
          message_text,
          sender_submission_id,
          created_at
        )
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw new Error(`Failed to send message: ${error.message}`)
    }

    return data
  }

  /**
   * Get messages for a team with pagination
   */
  static async getMessages(request: GetMessagesRequest): Promise<{
    messages: TeamChatMessageWithSender[]
    has_more: boolean
    total_count: number
  }> {
    try {
      const limit = Math.min(request.limit || 50, 100) // Max 100 messages per request
      const offset = request.offset || 0

      let query = supabaseAdmin
        .from('team_chat_messages')
        .select(`
          *,
          sender:team_matching_submissions!sender_submission_id(
            id,
            full_name,
            college_name
          ),
          reply_to:team_chat_messages!reply_to_message_id(
            id,
            message_text,
            sender_submission_id,
            created_at
          ),
          reactions:team_chat_reactions(
            id,
            reaction_emoji,
            sender_submission_id,
            created_at
          )
        `, { count: 'exact' })
        .eq('team_id', request.team_id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Add filters if provided
      if (request.before_message_id) {
        const { data: beforeMessage } = await supabaseAdmin
          .from('team_chat_messages')
          .select('created_at')
          .eq('id', request.before_message_id)
          .single()
        
        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at)
        }
      }

      if (request.after_message_id) {
        const { data: afterMessage } = await supabaseAdmin
          .from('team_chat_messages')
          .select('created_at')
          .eq('id', request.after_message_id)
          .single()
        
        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at)
        }
      }

      const { data, error, count } = await query

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Team chat tables not found, returning empty messages')
          return {
            messages: [],
            has_more: false,
            total_count: 0
          }
        }
        console.error('Error fetching messages:', error)
        throw new Error(`Failed to fetch messages: ${error.message}`)
      }

      // Reverse to show oldest first
      const messages = (data || []).reverse()
      const has_more = (count || 0) > offset + limit

      return {
        messages,
        has_more,
        total_count: count || 0
      }
    } catch (error) {
      // Handle any unexpected errors gracefully
      console.error('Unexpected error in getMessages:', error)
      return {
        messages: [],
        has_more: false,
        total_count: 0
      }
    }
  }

  /**
   * Update typing indicator for a user
   */
  static async updateTypingIndicator(
    submissionId: string,
    request: UpdateTypingRequest
  ): Promise<void> {
    // Validate user is part of the team
    await this.validateTeamMembership(request.team_id, submissionId)

    if (request.is_typing) {
      // Set typing indicator
      const { error } = await supabaseAdmin
        .from('team_chat_typing_indicators')
        .upsert({
          team_id: request.team_id,
          submission_id: submissionId,
          is_typing: true,
          expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds
        })

      if (error) {
        console.error('Error setting typing indicator:', error)
        throw new Error(`Failed to set typing indicator: ${error.message}`)
      }
    } else {
      // Remove typing indicator
      const { error } = await supabaseAdmin
        .from('team_chat_typing_indicators')
        .delete()
        .eq('team_id', request.team_id)
        .eq('submission_id', submissionId)

      if (error) {
        console.error('Error removing typing indicator:', error)
        // Don't throw error for removal failures
      }
    }
  }

  /**
   * Get current typing indicators for a team
   */
  static async getTypingIndicators(teamId: string): Promise<{
    user_name: string
    submission_id: string
  }[]> {
    // Clean up expired indicators first
    await supabaseAdmin.rpc('cleanup_expired_typing_indicators')

    const { data, error } = await supabaseAdmin
      .from('team_chat_typing_indicators')
      .select(`
        submission_id,
        submission:team_matching_submissions!submission_id(
          full_name
        )
      `)
      .eq('team_id', teamId)
      .eq('is_typing', true)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error fetching typing indicators:', error)
      return []
    }

    return (data || []).map(item => ({
      user_name: item.submission.full_name,
      submission_id: item.submission_id
    }))
  }

  /**
   * Add reaction to a message
   */
  static async addReaction(
    senderSubmissionId: string,
    request: AddReactionRequest
  ): Promise<TeamChatReaction> {
    // Validate the message exists and user has access
    const { data: message } = await supabaseAdmin
      .from('team_chat_messages')
      .select('team_id')
      .eq('id', request.message_id)
      .single()

    if (!message) {
      throw new Error('Message not found')
    }

    await this.validateTeamMembership(message.team_id, senderSubmissionId)

    const reactionData = {
      message_id: request.message_id,
      sender_submission_id: senderSubmissionId,
      reaction_emoji: request.reaction_emoji
    }

    const { data, error } = await supabaseAdmin
      .from('team_chat_reactions')
      .upsert(reactionData)
      .select()
      .single()

    if (error) {
      console.error('Error adding reaction:', error)
      throw new Error(`Failed to add reaction: ${error.message}`)
    }

    return data
  }

  /**
   * Remove reaction from a message
   */
  static async removeReaction(
    senderSubmissionId: string,
    messageId: string,
    reactionEmoji: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('sender_submission_id', senderSubmissionId)
      .eq('reaction_emoji', reactionEmoji)

    if (error) {
      console.error('Error removing reaction:', error)
      throw new Error(`Failed to remove reaction: ${error.message}`)
    }
  }

  /**
   * Mark messages as read for a user
   */
  static async markMessagesRead(
    submissionId: string,
    request: MarkMessagesReadRequest
  ): Promise<void> {
    // Validate user is part of the team
    await this.validateTeamMembership(request.team_id, submissionId)

    const { error } = await supabaseAdmin
      .from('team_chat_participants')
      .update({
        last_message_seen_id: request.last_message_id,
        last_seen_at: new Date().toISOString()
      })
      .eq('team_id', request.team_id)
      .eq('submission_id', submissionId)

    if (error) {
      console.error('Error marking messages as read:', error)
      throw new Error(`Failed to mark messages as read: ${error.message}`)
    }
  }

  /**
   * Get team chat participants with details
   */
  static async getTeamParticipants(teamId: string): Promise<TeamChatParticipantWithDetails[]> {
    const { data, error } = await supabaseAdmin
      .from('team_chat_participants')
      .select(`
        *,
        submission:team_matching_submissions!submission_id(
          id,
          full_name,
          college_name,
          current_year
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching team participants:', error)
      throw new Error(`Failed to fetch team participants: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get unread message count for a user in a team
   */
  static async getUnreadMessageCount(teamId: string, submissionId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_unread_message_count', {
          user_team_id: teamId,
          user_submission_id: submissionId
        })

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Get team chat statistics
   */
  static async getTeamChatStats(teamId: string): Promise<TeamChatStats> {
    try {
      // Get total message count
      const { count: totalMessages } = await supabaseAdmin
        .from('team_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .neq('message_type', 'system')

      // Get messages from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: messagesToday } = await supabaseAdmin
        .from('team_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .neq('message_type', 'system')
        .gte('created_at', today.toISOString())

      // Get active participants count
      const { count: activeParticipants } = await supabaseAdmin
        .from('team_chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true)

      // Get most active member
      const { data: messageCountByUser } = await supabaseAdmin
        .from('team_chat_messages')
        .select(`
          sender_submission_id,
          sender:team_matching_submissions!sender_submission_id(full_name)
        `)
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .neq('message_type', 'system')
        .not('sender_submission_id', 'is', null)

      const userMessageCounts = (messageCountByUser || []).reduce((acc, msg) => {
        const userId = msg.sender_submission_id
        const userName = msg.sender?.full_name || 'Unknown'
        acc[userId] = acc[userId] || { name: userName, count: 0 }
        acc[userId].count++
        return acc
      }, {} as Record<string, { name: string, count: number }>)

      const mostActiveUser = Object.values(userMessageCounts)
        .sort((a, b) => b.count - a.count)[0] || { name: 'No activity', count: 0 }

      return {
        total_messages: totalMessages || 0,
        messages_today: messagesToday || 0,
        active_participants: activeParticipants || 0,
        most_active_member: {
          name: mostActiveUser.name,
          message_count: mostActiveUser.count
        },
        recent_activity: [] // Could be implemented with more complex query
      }
    } catch (error) {
      console.error('Error getting chat stats:', error)
      return {
        total_messages: 0,
        messages_today: 0,
        active_participants: 0,
        most_active_member: { name: 'No activity', message_count: 0 },
        recent_activity: []
      }
    }
  }

  /**
   * Edit a message (only by sender)
   */
  static async editMessage(
    senderSubmissionId: string,
    messageId: string,
    newText: string
  ): Promise<TeamChatMessageWithSender> {
    if (newText.length > DEFAULT_CHAT_CONFIG.max_message_length) {
      throw new Error(`Message too long. Maximum ${DEFAULT_CHAT_CONFIG.max_message_length} characters allowed.`)
    }

    const { data, error } = await supabaseAdmin
      .from('team_chat_messages')
      .update({
        message_text: newText.trim(),
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_submission_id', senderSubmissionId)
      .select(`
        *,
        sender:team_matching_submissions!sender_submission_id(
          id,
          full_name,
          college_name
        )
      `)
      .single()

    if (error) {
      console.error('Error editing message:', error)
      throw new Error(`Failed to edit message: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a message (only by sender)
   */
  static async deleteMessage(
    senderSubmissionId: string,
    messageId: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_submission_id', senderSubmissionId)

    if (error) {
      console.error('Error deleting message:', error)
      throw new Error(`Failed to delete message: ${error.message}`)
    }
  }

  // Private helper methods

  /**
   * Validate that a user is a member of a team
   */
  private static async validateTeamMembership(teamId: string, submissionId: string): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('submission_id', submissionId)
        .single()

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Team members table not found, skipping validation')
          return // Allow access if tables don't exist yet
        }
        throw new Error('User is not a member of this team')
      }

      if (!data) {
        throw new Error('User is not a member of this team')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User is not a member')) {
        throw error
      }
      // For other errors, log and allow access (development mode)
      console.warn('Team membership validation failed, allowing access:', error)
    }
  }

  /**
   * Clean up old messages (for maintenance)
   */
  static async cleanupOldMessages(retentionDays: number = DEFAULT_CHAT_CONFIG.message_retention_days): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { data, error } = await supabaseAdmin
      .from('team_chat_messages')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up old messages:', error)
      return 0
    }

    return data?.length || 0
  }
}