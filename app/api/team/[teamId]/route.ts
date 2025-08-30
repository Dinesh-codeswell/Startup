import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CompleteTeamData, TeamMemberDisplay } from '@/types/team'

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Fetch team data
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team data:', teamError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team data' },
        { status: 500 }
      )
    }

    if (!teamData) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // Fetch team members with their submissions
    const { data: teamMembersData, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select(`
        id,
        team_id,
        submission_id,
        role_in_team,
        joined_at,
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
          experience,
          team_preference,
          case_preferences
        )
      `)
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Transform team members data to match expected format
    const members: TeamMemberDisplay[] = (teamMembersData || []).map((member: any) => {
      const submission = member.team_matching_submissions
      
      return {
        id: member.id,
        name: submission?.full_name || 'Unknown',
        role: member.role_in_team || (submission?.preferred_roles && submission.preferred_roles[0]) || 'Member',
        college: submission?.college_name || 'Unknown College',
        classYear: submission?.current_year || 'Unknown Year',
        experience: submission?.experience || 'Unknown',
        strengths: submission?.core_strengths || [],
        isLeader: member.role_in_team === 'Team Lead' || false,
        displayName: submission?.full_name || 'Unknown',
        email: submission?.email || '',
        bio: '',
        teamBenefit: '',
        joinedAt: member.joined_at,
        availability: submission?.availability || 'Unknown',
        preferredRoles: submission?.preferred_roles || [],
        teamPreference: submission?.team_preference || 'No preference',
        casePreferences: submission?.case_preferences || []
      }
    })

    // Construct complete team data
    const completeTeamData: CompleteTeamData = {
      id: teamData.id,
      team: {
        id: teamData.id,
        name: teamData.team_name,
        created_at: teamData.formed_at || teamData.created_at,
        status: teamData.status,
        approval_status: teamData.approval_status,
        compatibility_score: teamData.compatibility_score,
        team_size: teamData.team_size,
        bio: teamData.bio
      },
      name: teamData.team_name,
      formationDate: teamData.formed_at || teamData.created_at,
      members,
      memberCount: members.length,
      status: teamData.status,
      approvalStatus: teamData.approval_status,
      compatibilityScore: teamData.compatibility_score,
      teamSize: teamData.team_size,
      bio: teamData.bio
    }

    return NextResponse.json({
      success: true,
      data: completeTeamData
    })

  } catch (error) {
    console.error('Error in team API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}