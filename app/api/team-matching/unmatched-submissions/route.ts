import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting truly unmatched submissions...')

    // Get all submissions
    const { data: allSubmissions, error: submissionsError } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    // Get all team members to see which submissions are already in teams
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('submission_id')

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Create a set of submission IDs that are already in teams
    const matchedSubmissionIds = new Set(teamMembers?.map(member => member.submission_id) || [])

    // Filter out submissions that are already in teams
    const unmatchedSubmissions = allSubmissions?.filter(submission => 
      !matchedSubmissionIds.has(submission.id)
    ) || []

    console.log(`Total submissions: ${allSubmissions?.length || 0}`)
    console.log(`Matched submissions (in teams): ${matchedSubmissionIds.size}`)
    console.log(`Unmatched submissions: ${unmatchedSubmissions.length}`)

    // Update the response to match the expected format
    return NextResponse.json({
      success: true,
      data: unmatchedSubmissions,
      meta: {
        total: unmatchedSubmissions.length,
        matched: matchedSubmissionIds.size,
        totalSubmissions: allSubmissions?.length || 0
      }
    })

  } catch (error) {
    console.error('Error getting unmatched submissions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get unmatched submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}