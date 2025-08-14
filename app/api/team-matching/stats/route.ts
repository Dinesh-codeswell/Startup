import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'

export async function GET(request: NextRequest) {
  try {
    const stats = await TeamMatchingService.getTeamMatchingStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Error fetching team matching stats:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch team matching statistics: ${errorMessage}`
    }, { status: 500 })
  }
}