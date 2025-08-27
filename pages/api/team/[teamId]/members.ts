import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { TeamMemberDisplay } from '../../../../types/team'

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
    // First verify the team exists
    const { data: teamExists, error: teamCheckError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single()

    if (teamCheckError || !teamExists) {
      return res.status(404).json({ success: false, error: 'Team not found' })
    }

    // Fetch team members with detailed information from multiple tables
    const { data: teamMembersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        submission_id,
        role_in_team,
        joined_at,
        team_member_details(
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
        team_matching_submissions(
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

    // Transform and combine data from multiple sources
    const members: TeamMemberDisplay[] = (teamMembersData || []).map((member: any) => {
      const details = member.team_member_details
      const submission = member.team_matching_submissions
      
      // Prioritize team_member_details data, fallback to team_matching_submissions
      return {
        id: details?.id || member.id,
        name: details?.name || submission?.full_name || 'Unknown',
        role: details?.role || member.role_in_team || 'Member',
        college: details?.college || submission?.college_name || 'Unknown College',
        classYear: details?.classYear || submission?.current_year || 'Unknown Year',
        experience: details?.experience || submission?.experience || 'No experience listed',
        strengths: (() => {
          // Parse strengths from either source
          const strengthsStr = details?.strengths || submission?.core_strengths || ''
          return strengthsStr ? strengthsStr.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        })(),
        isLeader: details?.isLeader || false,
        email: details?.email || submission?.email || '',
        bio: details?.bio || '',
        teamBenefit: details?.teamBenefit || '',
        preferredRoles: (() => {
          // Parse preferred roles from submission
          const rolesStr = submission?.preferred_roles || ''
          return rolesStr ? rolesStr.split(',').map((r: string) => r.trim()).filter(Boolean) : []
        })(),
        availability: submission?.availability || 'Not specified'
      }
    })

    // Sort members to show leader first
    members.sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1
      if (!a.isLeader && b.isLeader) return 1
      return a.name.localeCompare(b.name)
    })

    return res.status(200).json({ 
      success: true, 
      data: members,
      count: members.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}