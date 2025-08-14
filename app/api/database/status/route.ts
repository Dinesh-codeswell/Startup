import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const status = {
      connection: false,
      team_matching_tables: false,
      team_chat_tables: false,
      tables_checked: [] as string[],
      errors: [] as string[]
    }

    // Test basic connection
    try {
      const { data, error } = await supabaseAdmin.from('_').select('*').limit(1)
      status.connection = true
    } catch (error) {
      status.errors.push(`Connection failed: ${error}`)
    }

    // Check team matching tables
    const teamMatchingTables = [
      'team_matching_submissions',
      'teams',
      'team_members',
      'team_matching_batches',
      'team_notifications'
    ]

    for (const table of teamMatchingTables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('*').limit(1)
        if (!error) {
          status.tables_checked.push(table)
        } else {
          status.errors.push(`Table ${table}: ${error.message}`)
        }
      } catch (error) {
        status.errors.push(`Table ${table}: ${error}`)
      }
    }

    if (status.tables_checked.length >= 3) {
      status.team_matching_tables = true
    }

    // Check team chat tables
    const teamChatTables = [
      'team_chat_messages',
      'team_chat_participants',
      'team_chat_reactions',
      'team_chat_typing_indicators'
    ]

    let chatTablesFound = 0
    for (const table of teamChatTables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('*').limit(1)
        if (!error) {
          status.tables_checked.push(table)
          chatTablesFound++
        } else {
          status.errors.push(`Table ${table}: ${error.message}`)
        }
      } catch (error) {
        status.errors.push(`Table ${table}: ${error}`)
      }
    }

    if (chatTablesFound >= 2) {
      status.team_chat_tables = true
    }

    return NextResponse.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('Error checking database status:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to check database status: ${error}`,
      data: {
        connection: false,
        team_matching_tables: false,
        team_chat_tables: false,
        tables_checked: [],
        errors: [`Global error: ${error}`]
      }
    })
  }
}