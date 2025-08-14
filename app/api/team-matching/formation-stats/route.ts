import { NextRequest, NextResponse } from 'next/server'
import { AutomatedTeamFormationService } from '@/lib/services/automated-team-formation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const stats = await AutomatedTeamFormationService.getFormationStats(days)
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        period: `${days} days`,
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error fetching formation stats:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch formation statistics: ${errorMessage}`
    }, { status: 500 })
  }
}