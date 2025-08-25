import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testing status update directly...')

    // Get one submission to test with
    const { data: submissions, error: fetchError } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('id, email, status')
      .eq('status', 'pending_match')
      .limit(1)

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch submissions', details: fetchError.message }, { status: 500 })
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No pending submissions found' }, { status: 400 })
    }

    const testSubmission = submissions[0]
    console.log(`Testing with submission: ${testSubmission.email} (${testSubmission.id})`)
    console.log(`Current status: ${testSubmission.status}`)

    // Try a simple update without any extra fields
    console.log('\n🧪 Attempting status update...')
    
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('team_matching_submissions')
      .update({ status: 'team_formed' })
      .eq('id', testSubmission.id)
      .select('id, email, status')

    if (updateError) {
      console.error('❌ Status update failed:', updateError)
      
      // Try to get more details about the error
      console.log('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'Status update failed', 
        details: updateError.message,
        errorInfo: {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        },
        testSubmission: testSubmission
      })
    }

    console.log('✅ Status update successful!')
    console.log('Updated submission:', updatedData)

    return NextResponse.json({
      success: true,
      message: 'Status update test completed successfully',
      data: {
        originalSubmission: testSubmission,
        updatedSubmission: updatedData?.[0]
      }
    })

  } catch (error) {
    console.error('Error in status update test:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}