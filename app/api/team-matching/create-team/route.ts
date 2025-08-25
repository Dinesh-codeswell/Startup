import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'

export async function POST(request: NextRequest) {
  try {
    const teamData = await request.json()
    
    console.log('Direct team creation request:', teamData)
    
    // Validate required fields
    if (!teamData.team_size || !teamData.member_submission_ids || !Array.isArray(teamData.member_submission_ids)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid team data: team_size and member_submission_ids are required' 
        },
        { status: 400 }
      )
    }

    if (teamData.member_submission_ids.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No member submission IDs provided' 
        },
        { status: 400 }
      )
    }

    // Create team using the service
    const team = await TeamMatchingService.createTeam(teamData)
    
    console.log('Team created successfully:', team.id)

    return NextResponse.json({
      success: true,
      data: team
    })

  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}