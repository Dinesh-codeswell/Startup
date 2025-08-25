import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Attempting to fix database schema...')

    // Try to add the missing updated_at column
    console.log('Step 1: Adding updated_at column...')
    
    const { data: alterResult, error: alterError } = await supabaseAdmin
      .rpc('execute_raw_sql', {
        sql: `
          ALTER TABLE team_matching_submissions 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        `
      })

    if (alterError) {
      console.log('❌ Could not add column via RPC:', alterError.message)
      
      // Alternative approach: Try to update without the problematic field
      console.log('Step 2: Trying alternative update approach...')
      
      // Get a test submission
      const { data: submissions, error: fetchError } = await supabaseAdmin
        .from('team_matching_submissions')
        .select('id, status')
        .eq('status', 'pending_match')
        .limit(1)

      if (fetchError || !submissions || submissions.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No test submissions found',
          details: fetchError?.message
        })
      }

      const testSubmission = submissions[0]
      
      // Try direct SQL update
      console.log('Attempting direct SQL update...')
      
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .rpc('execute_update', {
          table_name: 'team_matching_submissions',
          set_clause: "status = 'team_formed'",
          where_clause: `id = '${testSubmission.id}'`
        })

      if (updateError) {
        console.log('❌ Direct SQL update failed:', updateError.message)
        
        return NextResponse.json({
          success: false,
          error: 'Database schema fix failed',
          details: {
            alterError: alterError.message,
            updateError: updateError.message
          },
          recommendation: 'Manual database schema fix required'
        })
      } else {
        console.log('✅ Direct SQL update succeeded!')
        
        return NextResponse.json({
          success: true,
          message: 'Found working update method',
          data: {
            method: 'direct_sql',
            testResult: updateResult
          }
        })
      }
    } else {
      console.log('✅ Successfully added updated_at column!')
      
      // Now try a normal update
      const { data: submissions, error: fetchError } = await supabaseAdmin
        .from('team_matching_submissions')
        .select('id, status')
        .eq('status', 'pending_match')
        .limit(1)

      if (fetchError || !submissions || submissions.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Column added successfully, but no test submissions found'
        })
      }

      const testSubmission = submissions[0]
      
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('team_matching_submissions')
        .update({ 
          status: 'team_formed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testSubmission.id)
        .select('id, status')

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Column added but update still fails',
          details: updateError.message
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Database schema fixed and update working!',
          data: {
            columnAdded: true,
            testUpdate: updateResult
          }
        })
      }
    }

  } catch (error) {
    console.error('Error fixing database schema:', error)
    return NextResponse.json(
      { 
        error: 'Schema fix failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}