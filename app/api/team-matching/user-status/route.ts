import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import type { SubmissionWithTeam } from '@/lib/types/team-matching'

interface UserStatusResponse {
  success: boolean
  data?: {
    hasSubmitted: boolean
    hasTeam: boolean
    submission?: SubmissionWithTeam
    team?: any
    teamStatus?: 'no_team' | 'team_pending' | 'team_formed' | 'team_approved'
    redirectTo?: 'find-team' | 'my-team'
  }
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')
    
    if (!userId && !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: user_id or email'
      } as UserStatusResponse, { status: 400 })
    }

    let submission: SubmissionWithTeam | null = null

    if (userId) {
      // Get submission by user ID
      submission = await TeamMatchingService.getUserSubmissionWithTeam(userId)
    } else if (email) {
      // Get submission by email (we need to add this method)
      const submissions = await TeamMatchingService.getSubmissions({ limit: 1 })
      const emailSubmission = submissions.find(s => s.email === email)
      
      if (emailSubmission) {
        // Get full submission with team data
        submission = await TeamMatchingService.getUserSubmissionWithTeam(emailSubmission.user_id || '')
      }
    }

    const hasSubmitted = !!submission
    const hasTeam = !!(submission?.team)
    let teamStatus: 'no_team' | 'team_pending' | 'team_formed' | 'team_approved' = 'no_team'
    let redirectTo: 'find-team' | 'my-team' = 'find-team'

    if (hasSubmitted && submission) {
      if (submission.team) {
        // User has a team
        switch (submission.team.approval_status) {
          case 'approved':
            teamStatus = 'team_approved'
            break
          case 'pending':
            teamStatus = 'team_pending'
            break
          case 'rejected':
            teamStatus = 'no_team'
            break
          default:
            teamStatus = 'team_formed'
        }
        redirectTo = 'my-team'
      } else {
        // User submitted but no team yet
        teamStatus = 'no_team'
        redirectTo = 'my-team' // Still redirect to My Team to show waiting state
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSubmitted,
        hasTeam,
        submission: submission || undefined,
        team: submission?.team || undefined,
        teamStatus,
        redirectTo
      }
    } as UserStatusResponse)
    
  } catch (error) {
    console.error('Error checking user status:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to check user status: ${errorMessage}`
    } as UserStatusResponse, { status: 500 })
  }
}