import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET endpoint to fetch team strengths analysis
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('team_id')
    const forceRecalculate = searchParams.get('force_recalculate') === 'true'

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'team_id parameter is required'
      }, { status: 400 })
    }

    // Check if analysis already exists and is recent (unless force recalculate)
    if (!forceRecalculate) {
      const { data: existingAnalysis, error: fetchError } = await supabaseAdmin
        .from('team_strengths_analysis')
        .select('*')
        .eq('team_id', teamId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      if (!fetchError && existingAnalysis) {
        // Check if analysis is less than 24 hours old
        const analysisAge = Date.now() - new Date(existingAnalysis.calculated_at).getTime()
        const twentyFourHours = 24 * 60 * 60 * 1000

        if (analysisAge < twentyFourHours) {
          return NextResponse.json({
            success: true,
            data: {
              teamComplementarity: {
                score: existingAnalysis.complementarity_score,
                description: existingAnalysis.complementarity_description,
                keyObservations: existingAnalysis.key_observations || []
              },
              skillCoverage: {
                consulting: parseFloat(existingAnalysis.consulting_coverage),
                technology: parseFloat(existingAnalysis.technology_coverage),
                finance: parseFloat(existingAnalysis.finance_coverage),
                marketing: parseFloat(existingAnalysis.marketing_coverage),
                design: parseFloat(existingAnalysis.design_coverage)
              },
              detailedComponents: {
                breadthCoverage: parseFloat(existingAnalysis.breadth_coverage_score),
                domainDistribution: parseFloat(existingAnalysis.domain_distribution_score),
                essentialSkills: parseFloat(existingAnalysis.essential_skills_score),
                redundancyOptimization: parseFloat(existingAnalysis.redundancy_optimization_score)
              },
              metadata: {
                calculatedAt: existingAnalysis.calculated_at,
                teamMemberCount: existingAnalysis.team_member_count,
                coreStrengthsAnalyzed: existingAnalysis.core_strengths_analyzed,
                cached: true
              }
            }
          })
        }
      }
    }

    // Calculate new analysis
    console.log(`🔄 Calculating team strengths analysis for team: ${teamId}`)
    
    const { data: analysisId, error: calculationError } = await supabaseAdmin
      .rpc('calculate_and_store_team_analysis', { p_team_id: teamId })

    if (calculationError) {
      console.error('Error calculating team analysis:', calculationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to calculate team analysis',
        details: calculationError.message
      }, { status: 500 })
    }

    // Fetch the newly calculated analysis
    const { data: newAnalysis, error: fetchNewError } = await supabaseAdmin
      .from('team_strengths_analysis')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (fetchNewError || !newAnalysis) {
      console.error('Error fetching calculated analysis:', fetchNewError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch calculated analysis'
      }, { status: 500 })
    }

    console.log(`✅ Team analysis calculated successfully for team: ${teamId}`)

    return NextResponse.json({
      success: true,
      data: {
        teamComplementarity: {
          score: newAnalysis.complementarity_score,
          description: newAnalysis.complementarity_description,
          keyObservations: newAnalysis.key_observations || []
        },
        skillCoverage: {
          consulting: parseFloat(newAnalysis.consulting_coverage),
          technology: parseFloat(newAnalysis.technology_coverage),
          finance: parseFloat(newAnalysis.finance_coverage),
          marketing: parseFloat(newAnalysis.marketing_coverage),
          design: parseFloat(newAnalysis.design_coverage)
        },
        detailedComponents: {
          breadthCoverage: parseFloat(newAnalysis.breadth_coverage_score),
          domainDistribution: parseFloat(newAnalysis.domain_distribution_score),
          essentialSkills: parseFloat(newAnalysis.essential_skills_score),
          redundancyOptimization: parseFloat(newAnalysis.redundancy_optimization_score)
        },
        metadata: {
          calculatedAt: newAnalysis.calculated_at,
          teamMemberCount: newAnalysis.team_member_count,
          coreStrengthsAnalyzed: newAnalysis.core_strengths_analyzed,
          cached: false
        }
      }
    })

  } catch (error) {
    console.error('Error in team strengths analysis API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to force recalculation of team analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'teamId is required in request body'
      }, { status: 400 })
    }

    console.log(`🔄 Force recalculating team strengths analysis for team: ${teamId}`)
    
    // Delete existing analysis to force recalculation
    await supabaseAdmin
      .from('team_strengths_analysis')
      .delete()
      .eq('team_id', teamId)

    // Calculate new analysis
    const { data: analysisId, error: calculationError } = await supabaseAdmin
      .rpc('calculate_and_store_team_analysis', { p_team_id: teamId })

    if (calculationError) {
      console.error('Error calculating team analysis:', calculationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to calculate team analysis',
        details: calculationError.message
      }, { status: 500 })
    }

    // Fetch the newly calculated analysis
    const { data: newAnalysis, error: fetchError } = await supabaseAdmin
      .from('team_strengths_analysis')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (fetchError || !newAnalysis) {
      console.error('Error fetching calculated analysis:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch calculated analysis'
      }, { status: 500 })
    }

    console.log(`✅ Team analysis recalculated successfully for team: ${teamId}`)

    return NextResponse.json({
      success: true,
      message: 'Team analysis recalculated successfully',
      data: {
        teamComplementarity: {
          score: newAnalysis.complementarity_score,
          description: newAnalysis.complementarity_description,
          keyObservations: newAnalysis.key_observations || []
        },
        skillCoverage: {
          consulting: parseFloat(newAnalysis.consulting_coverage),
          technology: parseFloat(newAnalysis.technology_coverage),
          finance: parseFloat(newAnalysis.finance_coverage),
          marketing: parseFloat(newAnalysis.marketing_coverage),
          design: parseFloat(newAnalysis.design_coverage)
        },
        detailedComponents: {
          breadthCoverage: parseFloat(newAnalysis.breadth_coverage_score),
          domainDistribution: parseFloat(newAnalysis.domain_distribution_score),
          essentialSkills: parseFloat(newAnalysis.essential_skills_score),
          redundancyOptimization: parseFloat(newAnalysis.redundancy_optimization_score)
        },
        metadata: {
          calculatedAt: newAnalysis.calculated_at,
          teamMemberCount: newAnalysis.team_member_count,
          coreStrengthsAnalyzed: newAnalysis.core_strengths_analyzed,
          cached: false
        }
      }
    })

  } catch (error) {
    console.error('Error in team strengths analysis POST API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}