import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  TeamMatchingSubmission,
  TeamMatchingFormData,
  Team,
  TeamWithMembers,
  TeamMember,
  TeamMatchingStats,
  TeamMatchingQuery,
  TeamQuery,
  SubmissionWithTeam,
  TeamNotification,
  NotificationTemplate,
  NotificationContext
} from '@/lib/types/team-matching'

// =====================================================
// TEAM MATCHING SUBMISSIONS
// =====================================================

export class TeamMatchingService {
  
  /**
   * Submit a new team matching form
   */
  static async submitTeamMatchingForm(formData: TeamMatchingFormData, userId?: string): Promise<TeamMatchingSubmission> {
    const submissionData = {
      id: formData.id,
      user_id: userId || null,
      full_name: formData.fullName,
      email: formData.email,
      whatsapp_number: formData.whatsappNumber,
      college_name: formData.collegeName,
      current_year: formData.currentYear,
      core_strengths: formData.coreStrengths,
      preferred_roles: formData.preferredRoles,
      team_preference: formData.teamPreference,
      availability: formData.availability,
      experience: formData.experience,
      case_preferences: formData.casePreferences,
      preferred_team_size: parseInt(formData.preferredTeamSize),
      status: 'pending_match' as const
    }

    const { data, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) {
      console.error('Error submitting team matching form:', error)
      throw new Error(`Failed to submit team matching form: ${error.message}`)
    }

    return data
  }

  /**
   * Get submissions with optional filtering
   */
  static async getSubmissions(query: TeamMatchingQuery = {}): Promise<TeamMatchingSubmission[]> {
    let dbQuery = supabaseAdmin
      .from('team_matching_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }
    if (query.submitted_after) {
      dbQuery = dbQuery.gte('submitted_at', query.submitted_after)
    }
    if (query.submitted_before) {
      dbQuery = dbQuery.lte('submitted_at', query.submitted_before)
    }
    if (query.preferred_team_size) {
      dbQuery = dbQuery.eq('preferred_team_size', query.preferred_team_size)
    }
    if (query.availability) {
      dbQuery = dbQuery.eq('availability', query.availability)
    }
    if (query.experience) {
      dbQuery = dbQuery.eq('experience', query.experience)
    }
    if (query.college_name) {
      dbQuery = dbQuery.ilike('college_name', `%${query.college_name}%`)
    }
    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }
    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching submissions:', error)
      throw new Error(`Failed to fetch submissions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get pending submissions for team formation
   */
  static async getPendingSubmissions(): Promise<TeamMatchingSubmission[]> {
    return this.getSubmissions({ status: 'pending_match' })
  }

  /**
   * Update submission status
   */
  static async updateSubmissionStatus(
    submissionId: string, 
    status: TeamMatchingSubmission['status'],
    matchedAt?: string
  ): Promise<TeamMatchingSubmission> {
    const updateData: any = { status }
    if (matchedAt) {
      updateData.matched_at = matchedAt
    }

    const { data, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission status:', error)
      throw new Error(`Failed to update submission status: ${error.message}`)
    }

    return data
  }

  // =====================================================
  // TEAMS MANAGEMENT
  // =====================================================

  /**
   * Create a new team
   */
  static async createTeam(teamData: {
    team_name?: string
    team_size: number
    compatibility_score?: number
    member_submission_ids: string[]
  }): Promise<TeamWithMembers> {
    const { member_submission_ids, ...team } = teamData

    // Start transaction
    const { data: newTeam, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert(team)
      .select()
      .single()

    if (teamError) {
      console.error('Error creating team:', teamError)
      throw new Error(`Failed to create team: ${teamError.message}`)
    }

    // Add team members
    const teamMembers = member_submission_ids.map(submissionId => ({
      team_id: newTeam.id,
      submission_id: submissionId
    }))

    const { error: membersError } = await supabaseAdmin
      .from('team_members')
      .insert(teamMembers)

    if (membersError) {
      console.error('Error adding team members:', membersError)
      // Rollback team creation
      await supabaseAdmin.from('teams').delete().eq('id', newTeam.id)
      throw new Error(`Failed to add team members: ${membersError.message}`)
    }

    // Return team with members
    return this.getTeamWithMembers(newTeam.id)
  }

  /**
   * Get team with members
   */
  static async getTeamWithMembers(teamId: string): Promise<TeamWithMembers> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        members:team_members(
          *,
          submission:team_matching_submissions(*)
        )
      `)
      .eq('id', teamId)
      .single()

    if (error) {
      console.error('Error fetching team with members:', error)
      throw new Error(`Failed to fetch team: ${error.message}`)
    }

    return data
  }

  /**
   * Get all teams with optional filtering
   */
  static async getTeams(query: TeamQuery = {}): Promise<TeamWithMembers[]> {
    let dbQuery = supabaseAdmin
      .from('teams')
      .select(`
        *,
        members:team_members(
          *,
          submission:team_matching_submissions(*)
        )
      `)
      .order('formed_at', { ascending: false })

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }
    if (query.formed_after) {
      dbQuery = dbQuery.gte('formed_at', query.formed_after)
    }
    if (query.formed_before) {
      dbQuery = dbQuery.lte('formed_at', query.formed_before)
    }
    if (query.min_compatibility_score) {
      dbQuery = dbQuery.gte('compatibility_score', query.min_compatibility_score)
    }
    if (query.team_size) {
      dbQuery = dbQuery.eq('team_size', query.team_size)
    }
    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }
    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching teams:', error)
      throw new Error(`Failed to fetch teams: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update team chat group information
   */
  static async updateTeamChatGroup(
    teamId: string, 
    chatGroupId: string, 
    inviteLink?: string
  ): Promise<Team> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        chat_group_id: chatGroupId,
        chat_group_invite_link: inviteLink
      })
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team chat group:', error)
      throw new Error(`Failed to update team chat group: ${error.message}`)
    }

    return data
  }

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get team matching statistics
   */
  static async getTeamMatchingStats(): Promise<TeamMatchingStats> {
    const { data, error } = await supabaseAdmin
      .rpc('get_team_matching_stats')

    if (error) {
      console.error('Error fetching team matching stats:', error)
      throw new Error(`Failed to fetch statistics: ${error.message}`)
    }

    return data[0] || {
      total_submissions: 0,
      pending_submissions: 0,
      matched_submissions: 0,
      total_teams: 0,
      active_teams: 0,
      avg_team_size: 0,
      avg_compatibility_score: 0
    }
  }

  /**
   * Get user's submission with team information
   */
  static async getUserSubmissionWithTeam(userId: string): Promise<SubmissionWithTeam | null> {
    const { data, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .select(`
        *,
        team_members(
          team:teams(
            *,
            members:team_members(
              *,
              submission:team_matching_submissions(*)
            )
          )
        ),
        notifications:team_notifications(*)
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user submission:', error)
      throw new Error(`Failed to fetch user submission: ${error.message}`)
    }

    if (!data) return null

    // Transform the data structure
    const submission: SubmissionWithTeam = {
      ...data,
      team: data.team_members?.[0]?.team || undefined,
      notifications: data.notifications || []
    }

    return submission
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  /**
   * Create a notification
   */
  static async createNotification(
    submissionId: string,
    teamId: string | null,
    template: NotificationTemplate,
    context: NotificationContext
  ): Promise<TeamNotification> {
    // Replace template variables
    const title = this.replaceTemplateVariables(template.title, context)
    const message = this.replaceTemplateVariables(template.message, context)

    const notificationData = {
      submission_id: submissionId,
      team_id: teamId,
      notification_type: template.type,
      title,
      message,
      delivery_method: template.delivery_methods
    }

    const { data, error } = await supabaseAdmin
      .from('team_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return data
  }

  /**
   * Mark notification as sent
   */
  static async markNotificationSent(notificationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_notifications')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as sent:', error)
      throw new Error(`Failed to mark notification as sent: ${error.message}`)
    }
  }

  /**
   * Get pending notifications
   */
  static async getPendingNotifications(): Promise<TeamNotification[]> {
    const { data, error } = await supabaseAdmin
      .from('team_notifications')
      .select('*')
      .eq('delivery_status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending notifications:', error)
      throw new Error(`Failed to fetch pending notifications: ${error.message}`)
    }

    return data || []
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Replace template variables in strings
   */
  private static replaceTemplateVariables(template: string, context: NotificationContext): string {
    return template
      .replace(/\{user_name\}/g, context.user_name)
      .replace(/\{team_name\}/g, context.team_name || 'Your Team')
      .replace(/\{team_members\}/g, context.team_members?.join(', ') || '')
      .replace(/\{chat_invite_link\}/g, context.chat_invite_link || '')
      .replace(/\{team_size\}/g, context.team_size.toString())
      .replace(/\{compatibility_score\}/g, context.compatibility_score?.toString() || 'N/A')
  }

  /**
   * Batch update submission statuses
   */
  static async batchUpdateSubmissionStatus(
    submissionIds: string[],
    status: TeamMatchingSubmission['status']
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_matching_submissions')
      .update({ 
        status,
        matched_at: status === 'team_formed' ? new Date().toISOString() : null
      })
      .in('id', submissionIds)

    if (error) {
      console.error('Error batch updating submission statuses:', error)
      throw new Error(`Failed to batch update submission statuses: ${error.message}`)
    }
  }

  /**
   * Delete submission (soft delete by setting status to inactive)
   */
  static async deleteSubmission(submissionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_matching_submissions')
      .update({ status: 'inactive' })
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting submission:', error)
      throw new Error(`Failed to delete submission: ${error.message}`)
    }
  }
}
