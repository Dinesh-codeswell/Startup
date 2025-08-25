import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { submissionIds, newStatus } = await request.json()
    
    console.log(`🔧 Force updating ${submissionIds?.length || 0} submissions to status: ${newStatus}`)

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid submission IDs provided' }, { status: 400 })
    }

    if (!newStatus) {
      return NextResponse.json({ error: 'New status is required' }, { status: 400 })
    }

    // Simple approach: Update without any timestamp fields to avoid trigger issues
    console.log('Attempting simple status-only update...')
    
    const results = []
    const errors = []
    
    for (const submissionId of submissionIds) {
      try {
        // Get current submission data first
        const { data: currentData, error: fetchError } = await supabaseAdmin
          .from('team_matching_submissions')
          .select('id, email, status')
          .eq('id', submissionId)
          .single()

        if (fetchError) {
          console.log(`❌ Could not fetch submission ${submissionId}:`, fetchError.message)
          errors.push({ submissionId, error: fetchError.message })
          continue
        }

        // Try to update using upsert instead of update to bypass triggers
        const { data: upsertData, error: upsertError } = await supabaseAdmin
          .from('team_matching_submissions')
          .upsert({ 
            ...currentData,
            status: newStatus
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select('id, email, status')

        if (upsertError) {
          console.log(`❌ Upsert failed for ${submissionId}:`, upsertError.message)
          
          // Fallback: Try direct update with minimal fields
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('team_matching_submissions')
            .update({ status: newStatus })
            .eq('id', submissionId)
            .select('id, email, status')

          if (updateError) {
            console.log(`❌ Direct update also failed for ${submissionId}:`, updateError.message)
            errors.push({ submissionId, error: updateError.message })
          } else {
            console.log(`✅ Direct update succeeded for ${submissionId}`)
            results.push(updateData[0])
          }
        } else {
          console.log(`✅ Upsert succeeded for ${submissionId}`)
          results.push(upsertData[0])
        }
      } catch (individualError) {
        console.log(`❌ Exception for ${submissionId}:`, individualError)
        errors.push({ submissionId, error: individualError.message })
      }
    }
    
    if (results.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${results.length} of ${submissionIds.length} submissions`,
        data: {
          updatedSubmissions: results,
          errors: errors.length > 0 ? errors : undefined,
          method: 'upsert_fallback'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'All update attempts failed',
        details: {
          individualErrors: errors
        },
        suggestion: 'Database trigger or schema issue - manual intervention required'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in force status update:', error)
    return NextResponse.json(
      { 
        error: 'Force update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}