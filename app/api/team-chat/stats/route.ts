import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

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

    // Get stats using the optimized view
    const { data: stats, error } = await supabase
      .from('team_chat_stats')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (error) {
      console.error('Error fetching stats:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    // Get unread count for current user
    const { data: unreadData, error: unreadError } = await supabase
      .rpc('get_unread_count', {
        p_team_id: teamId,
        p_user_id: user.id
      })

    if (unreadError) {
      console.error('Error fetching unread count:', unreadError)
    }

    const response = {
      ...stats,
      unread_count: unreadData || 0
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error in stats GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}