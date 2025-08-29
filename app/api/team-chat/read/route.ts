import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Get user ID from headers (simplified authentication)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required in headers' },
        { status: 401 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get user's submission ID
    const { data: submission } = await supabase
      .from('team_matching_submissions')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'User submission not found' },
        { status: 404 }
      )
    }

    // Verify user is participant in this team
    // Note: team_chat_participants uses submission_id, not user_id
    const { data: participant } = await supabase
      .from('team_chat_participants')
      .select('id')
      .eq('team_id', teamId)
      .eq('submission_id', submission.id)
      .eq('is_active', true)
      .single()

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not a participant of this team' },
        { status: 403 }
      )
    }

    // Get read receipts for team messages
    const { data: readReceipts, error: fetchError } = await supabase
      .from('team_chat_read_receipts')
      .select(`
        message_id,
        user_submission_id,
        read_at,
        user_submissions!inner(
          full_name
        )
      `)
      .in('message_id', 
        supabase
          .from('team_chat_messages')
          .select('id')
          .eq('team_id', teamId)
      )

    if (fetchError) {
      console.error('Error fetching read receipts:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch read receipts' },
        { status: 500 }
      )
    }

    // Group read receipts by message ID
    const groupedReceipts: Record<string, any[]> = {}
    readReceipts?.forEach(receipt => {
      if (!groupedReceipts[receipt.message_id]) {
        groupedReceipts[receipt.message_id] = []
      }
      groupedReceipts[receipt.message_id].push({
        user_submission_id: receipt.user_submission_id,
        user_name: receipt.user_submissions.full_name,
        read_at: receipt.read_at
      })
    })

    return NextResponse.json({
      success: true,
      data: groupedReceipts
    })
  } catch (error) {
    console.error('Error in read receipts GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { teamId, messageIds } = await request.json()
    
    if (!teamId || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { success: false, error: 'Team ID and message IDs are required' },
        { status: 400 }
      )
    }

    // Get user ID from headers (simplified authentication)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required in headers' },
        { status: 401 }
      )
    }

    // Create supabase client for database operations
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get user's submission ID
    const { data: submission } = await supabase
      .from('team_matching_submissions')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'User submission not found' },
        { status: 404 }
      )
    }

    // Verify user is part of the team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('submission_id', submission.id)
      .single()

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this team' },
        { status: 403 }
      )
    }

    // Mark messages as read
    const readReceipts = messageIds.map(messageId => ({
      message_id: messageId,
      user_submission_id: submission.id,
      read_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('team_chat_read_receipts')
      .upsert(readReceipts, {
        onConflict: 'message_id,user_submission_id'
      })

    if (insertError) {
      console.error('Error inserting read receipts:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in read receipts API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}