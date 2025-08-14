import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import { enhancedIterativeMatching } from '@/lib/enhanced-iterative-matching'
import type { TeamFormationResponse, TeamMatchingSubmission } from '@/lib/types/team-matching'

export async function POST(request: NextRequest) {
  try {
    const { batch_name = `Batch ${new Date().toISOString()}` } = await request.json()
    
    // Get all pending submissions
    const pendingSubmissions = await TeamMatchingService.getPendingSubmissions()
    
    if (pendingSubmissions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pending submissions found for team formation'
      } as TeamFormationResponse, { status: 400 })
    }

    console.log(`Starting team formation for ${pendingSubmissions.length} submissions`)

    // Convert database submissions to the format expected by the matching algorithm
    const participantsForMatching = pendingSubmissions.map(submission => ({
      id: submission.id,
      fullName: submission.full_name,
      email: submission.email,
      whatsappNumber: submission.whatsapp_number,
      collegeName: submission.college_name,
      currentYear: submission.current_year,
      coreStrengths: submission.core_strengths,
      preferredRoles: submission.preferred_roles,
      availability: submission.availability,
      experience: submission.experience,
      casePreferences: submission.case_preferences,
      preferredTeamSize: submission.preferred_team_size,
      // Map additional fields for compatibility
      teamPreference: 'Mixed (UG + PG)', // Default value
      workingStyle: [], // Default empty array
      idealTeamStructure: [], // Default empty array
      lookingFor: submission.preferred_teammate_roles,
      workStyle: [] // Default empty array
    }))

    // Run the matching algorithm
    const matchingResult = enhancedIterativeMatching(participantsForMatching, {
      maxIterations: 30,
      enableProgressiveRelaxation: true,
      enableDetailedLogging: true
    })

    console.log(`Matching algorithm completed: ${matchingResult.teams.length} teams formed, ${matchingResult.unmatched.length} unmatched`)

    // Save teams to database
    const createdTeams = []
    
    for (let i = 0; i < matchingResult.teams.length; i++) {
      const algorithmTeam = matchingResult.teams[i]
      
      try {
        const teamData = {
          team_name: `Team ${i + 1}`,
          team_size: algorithmTeam.teamSize,
          compatibility_score: algorithmTeam.compatibilityScore,
          member_submission_ids: algorithmTeam.members.map(member => member.id)
        }

        const createdTeam = await TeamMatchingService.createTeam(teamData)
        createdTeams.push(createdTeam)
        
        console.log(`Created team ${i + 1} with ${algorithmTeam.members.length} members`)
        
      } catch (error) {
        console.error(`Error creating team ${i + 1}:`, error)
        // Continue with other teams even if one fails
      }
    }

    // Update unmatched submissions status (optional - keep them as pending for next batch)
    const unmatchedIds = matchingResult.unmatched.map(participant => participant.id)
    if (unmatchedIds.length > 0) {
      console.log(`${unmatchedIds.length} participants remain unmatched`)
      // Optionally update their status or leave as pending for next batch
    }

    // TODO: In future iterations, add:
    // 1. Create notifications for all team members
    // 2. Create WhatsApp/Discord groups
    // 3. Send email notifications with team details
    // 4. Create team matching batch record

    const response: TeamFormationResponse = {
      success: true,
      message: `Successfully formed ${createdTeams.length} teams from ${pendingSubmissions.length} submissions`,
      data: {
        batch_id: `batch_${Date.now()}`, // Temporary ID
        teams_formed: createdTeams.length,
        total_matched: createdTeams.reduce((sum, team) => sum + team.team_size, 0),
        unmatched_count: matchingResult.unmatched.length,
        teams: createdTeams
      }
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in team formation:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to form teams: ${errorMessage}`
    } as TeamFormationResponse, { status: 500 })
  }
}