import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { CompleteTeamData, TeamMemberDisplay } from '../../../types/team'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { teamId } = req.query

  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ success: false, error: 'Team ID is required' })
  }

  try {
    // Fetch team data
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team data:', teamError)
      return res.status(500).json({ success: false, error: 'Failed to fetch team data' })
    }

    if (!teamData) {
      return res.status(404).json({ success: false, error: 'Team not found' })
    }

    // Fetch team members with their details and submissions
    const { data: teamMembersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        submission_id,
        role_in_team,
        joined_at,
        team_member_details!inner(
          id,
          name,
          role,
          college,
          classYear,
          experience,
          strengths,
          isLeader,
          displayName,
          email,
          bio,
          teamBenefit
        ),
        team_matching_submissions!inner(
          id,
          user_id,
          full_name,
          email,
          college_name,
          course,
          current_year,
          core_strengths,
          preferred_roles,
          availability,
          experience
        )
      `)
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return res.status(500).json({ success: false, error: 'Failed to fetch team members' })
    }

    // Transform the data to match our interface
    const members: TeamMemberDisplay[] = (teamMembersData || []).map((member: any) => {
      const details = member.team_member_details
      const submission = member.team_matching_submissions
      
      return {
        id: details.id,
        name: details.name || submission.full_name,
        role: details.role || member.role_in_team,
        college: details.college || submission.college_name,
        classYear: details.classYear || submission.current_year,
        experience: details.experience || submission.experience,
        strengths: details.strengths ? details.strengths.split(',').map((s: string) => s.trim()) : 
                  submission.core_strengths ? submission.core_strengths.split(',').map((s: string) => s.trim()) : [],
        isLeader: details.isLeader || false,
        email: details.email || submission.email,
        bio: details.bio || '',
        teamBenefit: details.teamBenefit || '',
        preferredRoles: submission.preferred_roles ? submission.preferred_roles.split(',').map((r: string) => r.trim()) : [],
        availability: submission.availability || ''
      }
    })

    const completeTeamData: CompleteTeamData = {
      team: {
        id: teamData.id,
        team_name: teamData.team_name,
        team_size: teamData.team_size,
        compatibility_score: teamData.compatibility_score,
        status: teamData.status,
        approval_status: teamData.approval_status,
        approved_by: teamData.approved_by,
        approved_at: teamData.approved_at,
        chat_group_id: teamData.chat_group_id,
        chat_group_invite_link: teamData.chat_group_invite_link,
        created_at: teamData.created_at
      },
      members,
      memberCount: members.length,
      formationDate: teamData.created_at
    }

    return res.status(200).json({ success: true, data: completeTeamData })

  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}