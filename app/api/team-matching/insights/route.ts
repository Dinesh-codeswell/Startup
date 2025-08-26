import { NextRequest, NextResponse } from 'next/server'
import { EnhancedMatchingFeedbackService } from '@/lib/services/enhanced-matching-feedback'
import { TeamMatchingService } from '@/lib/services/team-matching-db'

// Force dynamic rendering for admin routes
// Runtime configuration removed to fix Edge Runtime build errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Admin protection removed - endpoint is now publicly accessible
  try{
    const searchParams = request.nextUrl.searchParams
    const minCompatibilityScore = parseInt(searchParams.get('minScore') || '80')
    const includeRecommendations = searchParams.get('recommendations') === 'true'
    
    console.log('🔍 Generating matching insights...')
    
    // Get team analysis insights
    const insights = await EnhancedMatchingFeedbackService.analyzeSuccessfulTeams(minCompatibilityScore)
    
    let recommendations = null
    if (includeRecommendations) {
      // Get pending submissions for recommendations
      const pendingSubmissions = await TeamMatchingService.getPendingSubmissions()
      if (pendingSubmissions.length > 1) {
        recommendations = await EnhancedMatchingFeedbackService.getMatchingRecommendations(pendingSubmissions)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        insights,
        recommendations,
        generatedAt: new Date().toISOString(),
        parameters: {
          minCompatibilityScore,
          includeRecommendations
        }
      }
    })
    
  } catch (error) {
    console.error('Error generating matching insights:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to generate matching insights: ${errorMessage}`
    }, { status: 500 })
  }
}
