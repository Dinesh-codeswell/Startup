import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = {
      status: searchParams.get('status') || undefined,
      formed_after: searchParams.get('formed_after') || undefined,
      formed_before: searchParams.get('formed_before') || undefined,
      min_compatibility_score: searchParams.get('min_compatibility_score') 
        ? parseFloat(searchParams.get('min_compatibility_score')!) 
        : undefined,
      team_size: searchParams.get('team_size') 
        ? parseInt(searchParams.get('team_size')!) 
        : undefined,
      limit: searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : 50,
      offset: searchParams.get('offset') 
        ? parseInt(searchParams.get('offset')!) 
        : 0
    }

    const teams = await TeamMatchingService.getTeams(query)

    return NextResponse.json({
      success: true,
      data: teams,
      count: teams.length
    })

  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}