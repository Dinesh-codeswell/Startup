import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import type { TeamMatchingQuery } from '@/lib/types/team-matching'

// Force dynamic rendering for admin routes
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Admin protection removed - endpoint is now publicly accessible
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const query: TeamMatchingQuery = {}
    
    if (searchParams.get('status')) {
      query.status = searchParams.get('status') as any
    }
    if (searchParams.get('submitted_after')) {
      query.submitted_after = searchParams.get('submitted_after')!
    }
    if (searchParams.get('submitted_before')) {
      query.submitted_before = searchParams.get('submitted_before')!
    }
    if (searchParams.get('preferred_team_size')) {
      query.preferred_team_size = parseInt(searchParams.get('preferred_team_size')!)
    }
    if (searchParams.get('availability')) {
      query.availability = searchParams.get('availability')!
    }
    if (searchParams.get('experience')) {
      query.experience = searchParams.get('experience')!
    }
    if (searchParams.get('college_name')) {
      query.college_name = searchParams.get('college_name')!
    }
    if (searchParams.get('limit')) {
      query.limit = parseInt(searchParams.get('limit')!)
    }
    if (searchParams.get('offset')) {
      query.offset = parseInt(searchParams.get('offset')!)
    }
    
    const submissions = await TeamMatchingService.getSubmissions(query)
    
    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length
    })
    
  } catch (error) {
    console.error('Error fetching team matching submissions:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch submissions: ${errorMessage}`
    }, { status: 500 })
  }
}
