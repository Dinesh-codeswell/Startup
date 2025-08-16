import { NextRequest, NextResponse } from 'next/server'
import { EnhancedMatchingFeedbackService } from '@/lib/services/enhanced-matching-feedback'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import { verifyAdminOrRespond } from '@/lib/admin-api-protection'

// Force dynamic rendering for admin routes
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Verify admin access
  const adminError = await verifyAdminOrRespond(request);
  if (adminError) return adminError;
  try {
    const { searchParams } = new URL(request.url)
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
