import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...')

    // Check the table schema
    const { data: schemaData, error: schemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'team_matching_submissions')
      .order('ordinal_position')

    if (schemaError) {
      console.error('Error fetching schema:', schemaError)
    } else {
      console.log('Table schema:')
      schemaData?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // Check for triggers
    const { data: triggerData, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_table', 'team_matching_submissions')

    if (triggerError) {
      console.error('Error fetching triggers:', triggerError)
    } else {
      console.log('\nTable triggers:')
      triggerData?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation}`)
        console.log(`    Action: ${trigger.action_statement}`)
      })
    }

    return NextResponse.json({
      success: true,
      schema: schemaData,
      triggers: triggerData
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