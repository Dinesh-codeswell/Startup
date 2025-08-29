import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, message_id, emoji } = body

    if (!team_id || !message_id || !emoji?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID, message ID, and emoji are required' },
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

    // Verify message exists in this team
    const { data: message } = await supabase
      .from('team_chat_messages')
      .select('id')
      .eq('id', message_id)
      .eq('team_id', team_id)
      .single()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user already reacted with this emoji
    const { data: existingReaction } = await supabase
      .from('team_chat_reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .eq('emoji', emoji.trim())
      .single()

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      const { error } = await supabase
        .from('team_chat_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (error) {
        console.error('Error removing reaction:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to remove reaction' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { message: 'Reaction removed', action: 'removed' }
      })
    } else {
      // Add new reaction
      const { data: newReaction, error } = await supabase
        .from('team_chat_reactions')
        .insert({
          message_id,
          user_id: user.id,
          emoji: emoji.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding reaction:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to add reaction' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { reaction: newReaction, action: 'added' }
      })
    }

  } catch (error) {
    console.error('Error in reactions POST:', error)
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
    const messageId = searchParams.get('message_id')

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

    let query = supabase
      .from('team_chat_reactions')
      .select(`
        id,
        message_id,
        emoji,
        created_at,
        team_chat_participants!inner(
          display_name,
          submission_id
        ),
        team_chat_messages!inner(
          team_id
        )
      `)
      .eq('team_chat_messages.team_id', teamId)

    if (messageId) {
      query = query.eq('message_id', messageId)
    }

    const { data: reactions, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching reactions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reactions' },
        { status: 500 }
      )
    }

    // Group reactions by message and emoji
    const groupedReactions = reactions?.reduce((acc, reaction) => {
      const key = `${reaction.message_id}-${reaction.emoji}`
      if (!acc[key]) {
        acc[key] = {
          message_id: reaction.message_id,
          emoji: reaction.emoji,
          count: 0,
          users: []
        }
      }
      acc[key].count++
      acc[key].users.push({
        display_name: reaction.team_chat_participants.display_name,
        submission_id: reaction.team_chat_participants.submission_id
      })
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      success: true,
      data: Object.values(groupedReactions)
    })

  } catch (error) {
    console.error('Error in reactions GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}