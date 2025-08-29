import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { broadcastTyping } from '../events/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, is_typing } = body

    if (!team_id || typeof is_typing !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Team ID and typing status are required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is participant in this team
    const { data: participant } = await supabase
      .from('team_chat_participants')
      .select('id, display_name')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized for this team' },
        { status: 403 }
      )
    }

    if (is_typing) {
      // Add or update typing indicator
      const expiresAt = new Date(Date.now() + 10000) // 10 seconds from now
      
      const { error } = await supabase
        .from('team_chat_typing')
        .upsert({
          team_id,
          user_id: user.id,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'team_id,user_id'
        })

      if (error) {
        console.error('Error updating typing indicator:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update typing status' },
          { status: 500 }
        )
      }
    } else {
      // Remove typing indicator
      const { error } = await supabase
        .from('team_chat_typing')
        .delete()
        .eq('team_id', team_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing typing indicator:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update typing status' },
          { status: 500 }
        )
      }
    }

    // Broadcast typing status to team members
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
    broadcastTyping(team_id, user.id, is_typing, userName)

    return NextResponse.json({
      success: true,
      data: { message: 'Typing status updated' }
    })

  } catch (error) {
    console.error('Error in typing POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is participant in this team
    const { data: participant } = await supabase
      .from('team_chat_participants')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized for this team' },
        { status: 403 }
      )
    }

    // Clean up expired typing indicators first
    await supabase.rpc('cleanup_expired_typing')

    // Get current typing users (excluding current user)
    const { data: typingUsers, error } = await supabase
      .from('team_chat_typing')
      .select(`
        user_id,
        expires_at,
        team_chat_participants!inner(
          display_name,
          submission_id
        )
      `)
      .eq('team_id', teamId)
      .neq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .eq('team_chat_participants.is_active', true)

    if (error) {
      console.error('Error fetching typing users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch typing users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: typingUsers || []
    })

  } catch (error) {
    console.error('Error in typing GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}