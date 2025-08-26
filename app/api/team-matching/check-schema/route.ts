import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...')

    // Simple table existence check instead of information_schema queries
    const { data: testData, error: testError } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('Error accessing team_matching_submissions table:', testError)
      return NextResponse.json({
        success: false,
        error: 'Table access failed',
        details: testError.message
      }, { status: 500 })
    }

    console.log('✅ Database schema check completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Database schema is accessible',
      tableExists: true
    })

  } catch (error) {
    console.error('Error checking schema:', error)
    return NextResponse.json(
      { 
        error: 'Schema check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}