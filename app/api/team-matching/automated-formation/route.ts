import { NextRequest, NextResponse } from 'next/server'
import { AutomatedTeamFormationService } from '@/lib/services/automated-team-formation'
import type { AutomatedFormationConfig } from '@/lib/services/automated-team-formation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config: Partial<AutomatedFormationConfig> = body.config || {}
    
    console.log('🤖 Manual automated formation triggered')
    
    const result = await AutomatedTeamFormationService.runAutomatedFormation(config)
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Automated formation completed: ${result.teamsFormed} teams formed, ${result.participantsMatched} participants matched`
        : `Automated formation failed: ${result.errors.join(', ')}`,
      data: result
    })
    
  } catch (error) {
    console.error('Error in automated formation API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to run automated formation: ${errorMessage}`
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config: Partial<AutomatedFormationConfig> = {}
    
    // Parse config from query parameters
    if (searchParams.get('minSubmissions')) {
      config.minSubmissions = parseInt(searchParams.get('minSubmissions')!)
    }
    if (searchParams.get('maxWaitTime')) {
      config.maxWaitTime = parseInt(searchParams.get('maxWaitTime')!)
    }
    
    const triggerCheck = await AutomatedTeamFormationService.shouldTriggerFormation(config)
    
    return NextResponse.json({
      success: true,
      data: {
        shouldTrigger: triggerCheck.shouldTrigger,
        reason: triggerCheck.reason,
        pendingCount: triggerCheck.pendingCount,
        oldestSubmissionAge: triggerCheck.oldestSubmissionAge,
        oldestSubmissionAgeFormatted: `${triggerCheck.oldestSubmissionAge.toFixed(1)} hours`
      }
    })
    
  } catch (error) {
    console.error('Error checking formation trigger:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to check formation trigger: ${errorMessage}`
    }, { status: 500 })
  }
}