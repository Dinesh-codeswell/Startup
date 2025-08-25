import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Enhanced team formation algorithm
function formTeamsFromSubmissions(submissions: any[], maxTeamSize: number = 4, minTeamSize: number = 2) {
  const teams: any[] = []
  const unmatched: any[] = []
  const availableParticipants = [...submissions]

  console.log(`Starting team formation with ${availableParticipants.length} participants`)
  console.log(`Team size range: ${minTeamSize}-${maxTeamSize}`)

  // Sort by preferred team size to prioritize smaller teams first
  availableParticipants.sort((a, b) => a.preferred_team_size - b.preferred_team_size)

  let teamCounter = 1

  while (availableParticipants.length >= minTeamSize) {
    const teamMembers: any[] = []
    const targetSize = Math.min(maxTeamSize, availableParticipants.length)
    
    // Pick the first participant as team lead
    const teamLead = availableParticipants.shift()
    if (!teamLead) break
    
    teamMembers.push(teamLead)
    console.log(`Creating Team ${teamCounter} with lead: ${teamLead.full_name}`)

    // Try to find compatible team members
    for (let i = 0; i < targetSize - 1 && availableParticipants.length > 0; i++) {
      // Simple compatibility: same team preference or "Either UG or PG"
      const compatibleIndex = availableParticipants.findIndex(participant => {
        const leadPreference = teamLead.team_preference
        const participantPreference = participant.team_preference
        
        return (
          leadPreference === participantPreference ||
          leadPreference === 'Either UG or PG' ||
          participantPreference === 'Either UG or PG'
        )
      })

      if (compatibleIndex !== -1) {
        const member = availableParticipants.splice(compatibleIndex, 1)[0]
        teamMembers.push(member)
        console.log(`  Added member: ${member.full_name}`)
      } else if (availableParticipants.length > 0) {
        // If no compatible member found, just take the next available
        const member = availableParticipants.shift()
        teamMembers.push(member)
        console.log(`  Added member (no compatibility): ${member.full_name}`)
      }
    }

    // Only create team if it meets minimum size
    if (teamMembers.length >= minTeamSize) {
      const team = {
        id: `auto-team-${teamCounter}`,
        teamName: `Auto Team ${teamCounter}`,
        teamSize: teamMembers.length,
        compatibilityScore: 75, // Default score for auto-formed teams
        members: teamMembers,
        formationMethod: 'auto'
      }
      
      teams.push(team)
      console.log(`✅ Created ${team.teamName} with ${teamMembers.length} members`)
      teamCounter++
    } else {
      // If team is too small, add members back to unmatched
      unmatched.push(...teamMembers)
      console.log(`❌ Team too small (${teamMembers.length}), added to unmatched`)
    }
  }

  // Add remaining participants to unmatched
  unmatched.push(...availableParticipants)
  
  console.log(`Team formation complete: ${teams.length} teams, ${unmatched.length} unmatched`)
  
  return { teams, unmatched }
}

export async function POST(request: NextRequest) {
  try {
    const { maxTeamSize = 4, minTeamSize = 2 } = await request.json()
    
    console.log('🚀 Starting automatic team formation...')
    console.log(`Parameters: maxTeamSize=${maxTeamSize}, minTeamSize=${minTeamSize}`)

    // Get all submissions
    const { data: allSubmissions, error: fetchError } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('*')
      .order('submitted_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: fetchError.message },
        { status: 500 }
      )
    }

    // Get all team members to see which submissions are already in teams
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('submission_id')

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members', details: membersError.message },
        { status: 500 }
      )
    }

    // Create a set of submission IDs that are already in teams
    const existingMatchedIds = new Set(teamMembers?.map(member => member.submission_id) || [])

    // Filter out submissions that are already in teams - only process truly unmatched ones
    const unmatchedSubmissions = allSubmissions?.filter(submission => 
      !existingMatchedIds.has(submission.id)
    ) || []

    if (unmatchedSubmissions.length === 0) {
      return NextResponse.json(
        { error: 'No unmatched submissions found for team formation. All participants are already in teams.' },
        { status: 400 }
      )
    }

    console.log(`Total submissions: ${allSubmissions?.length || 0}`)
    console.log(`Already matched: ${existingMatchedIds.size}`)
    console.log(`Available for matching: ${unmatchedSubmissions.length}`)

    // Form teams using the algorithm - only process unmatched submissions
    const { teams, unmatched } = formTeamsFromSubmissions(unmatchedSubmissions, maxTeamSize, minTeamSize)

    if (teams.length === 0) {
      return NextResponse.json(
        { error: 'No teams could be formed with the given parameters' },
        { status: 400 }
      )
    }

    // Save teams to database
    console.log(`💾 Saving ${teams.length} teams to database...`)
    
    const savedTeams: any[] = []
    const errors: string[] = []

    for (const team of teams) {
      try {
        // Get submission IDs for team members
        const memberSubmissionIds = team.members.map((member: any) => member.id)
        
        // Create team in database
        const teamData = {
          team_name: team.teamName,
          team_size: team.teamSize,
          compatibility_score: team.compatibilityScore,
          member_submission_ids: memberSubmissionIds,
          status: 'active'
        }

        console.log(`Creating team: ${team.teamName} with ${memberSubmissionIds.length} members`)
        
        const savedTeam = await TeamMatchingService.createTeam(teamData)
        savedTeams.push(savedTeam)
        
        console.log(`✅ Saved team: ${savedTeam.team_name}`)
      } catch (error) {
        console.error(`Error saving team ${team.teamName}:`, error)
        errors.push(`Error saving team ${team.teamName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Get IDs of participants who were just matched into new teams
    const newlyMatchedIds = teams.flatMap(team => team.members.map((member: any) => member.id))
    
    // Note: We don't need to update submission statuses anymore
    // The dashboard now uses team membership to determine matched/unmatched status
    console.log(`✅ Teams created successfully. Dashboard will automatically show updated data based on team membership.`)
    console.log(`Newly matched participants: ${newlyMatchedIds.length}`)

    // Send success response
    const response = {
      success: true,
      message: `Successfully formed ${savedTeams.length} teams from ${unmatchedSubmissions.length} unmatched participants`,
      data: {
        teamsFormed: savedTeams.length,
        participantsMatched: newlyMatchedIds.length,
        participantsUnmatched: unmatched.length,
        totalParticipants: unmatchedSubmissions.length,
        previouslyMatched: existingMatchedIds.size,
        errors: errors.length > 0 ? errors : undefined
      },
      teams: savedTeams.map(team => ({
        id: team.id,
        name: team.team_name,
        size: team.team_size,
        score: team.compatibility_score
      }))
    }

    console.log('🎉 Team formation completed successfully!')
    console.log(`Results: ${savedTeams.length} new teams, ${newlyMatchedIds.length} newly matched, ${unmatched.length} still unmatched`)
    console.log(`Previously matched: ${existingMatchedIds.size}, Total processed: ${unmatchedSubmissions.length}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in team formation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to form teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}