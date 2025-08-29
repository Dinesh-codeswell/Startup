import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { broadcastMessage } from '../events/route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Chat API Request:', { teamId, limit, offset })

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
        { 
          success: false, 
          error: 'Unauthorized', 
          details: 'User ID required in headers',
          debug: {
            hasUserId: !!userId,
            message: 'Please provide x-user-id header'
          }
        },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for simplified authentication
    const supabase = supabaseAdmin
    
    // First check if user is a team member
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select(`
        *,
        team_matching_submissions!inner(
          user_id,
          full_name
        )
      `)
      .eq('team_id', teamId)
      .eq('team_matching_submissions.user_id', userId)
      .single()
    
    if (memberError || !teamMember) {
      console.warn(`User ${userId} attempted to access team ${teamId} without membership:`, memberError?.message)
      return NextResponse.json(
        { success: false, error: 'Access denied to this team' },
        { status: 403 }
      )
    }

    // Auto-enroll user in chat if not already enrolled
    const { data: participant, error: participantError } = await supabase
      .from('team_chat_participants')
      .select('*')
      .eq('team_id', teamId)
      .eq('submission_id', teamMember.submission_id)
      .eq('is_active', true)
      .single()
    
    if (participantError || !participant) {
      // Auto-enroll user in team chat
      const { data: newParticipant, error: enrollError } = await supabase
        .from('team_chat_participants')
        .insert({
          team_id: teamId,
          submission_id: teamMember.submission_id,
          display_name: teamMember.team_matching_submissions.full_name || 'Unknown User',
          is_active: true,
          joined_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (enrollError) {
        console.error(`Failed to auto-enroll user ${userId} in team chat:`, enrollError)
        return NextResponse.json(
          { success: false, error: 'Failed to join team chat' },
          { status: 500 }
        )
      }
      
      console.log(`✅ Auto-enrolled user ${userId} in team ${teamId} chat`)
    }

    console.log(`✅ User ${userId} has access to team ${teamId}`)

    // Fetch messages with sender information
    const { data: messages, error: fetchError } = await supabase
      .from('team_chat_messages')
      .select(`
        id,
        team_id,
        sender_id,
        message_text,
        message_type,
        parent_message_id,
        is_edited,
        created_at,
        updated_at
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching messages:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get sender names separately
    const senderIds = [...new Set(messages?.map(msg => msg.sender_id).filter(Boolean))] || [];
    
    let senderNames = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);
      
      senderNames = profiles?.reduce((acc, profile) => {
        acc[profile.id] = `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User';
        return acc;
      }, {}) || {};
    }
    
    // Transform messages to include sender names
    const transformedMessages = messages?.map(msg => ({
      id: msg.id,
      team_id: msg.team_id,
      sender_id: msg.sender_id,
      message_text: msg.message_text,
      message_type: msg.message_type,
      parent_message_id: msg.parent_message_id,
      is_edited: msg.is_edited,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender_name: senderNames[msg.sender_id] || 'Unknown User'
    })) || []

    console.log(`📨 Fetched ${transformedMessages.length} messages for team ${teamId}`)

    return NextResponse.json({
      success: true,
      data: {
        messages: transformedMessages,
        hasMore: transformedMessages.length === limit,
        user: {
          id: userId,
          name: 'User'
        }
      }
    })

  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, message_text, message_type = 'text', parent_message_id } = body

    // Convert message_type string to numeric value for database
    const messageTypeMap: { [key: string]: number } = {
      'text': 1,
      'system': 2,
      'file': 3
    }
    const numericMessageType = messageTypeMap[message_type] || 1

    console.log('📝 Send message request:', { team_id, messageLength: message_text?.length, message_type, numericMessageType })

    if (!team_id || !message_text?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID and message text are required' },
        { status: 400 }
      )
    }

    if (message_text.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Get user ID from headers (simplified authentication)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          details: 'User ID required in headers'
        },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for simplified authentication
    const supabase = supabaseAdmin
    
    // First check if user is a team member
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select(`
        *,
        team_matching_submissions!inner(
          user_id,
          full_name
        )
      `)
      .eq('team_id', team_id)
      .eq('team_matching_submissions.user_id', userId)
      .single()
    
    if (memberError || !teamMember) {
      console.warn(`User ${userId} attempted to send message to team ${team_id} without membership:`, memberError?.message)
      return NextResponse.json(
        { success: false, error: 'Access denied to this team' },
        { status: 403 }
      )
    }

    // Auto-enroll user in chat if not already enrolled
    const { data: participant, error: participantError } = await supabase
      .from('team_chat_participants')
      .select('*')
      .eq('team_id', team_id)
      .eq('submission_id', teamMember.submission_id)
      .eq('is_active', true)
      .single()
    
    if (participantError || !participant) {
      // Auto-enroll user in team chat
      const { data: newParticipant, error: enrollError } = await supabase
        .from('team_chat_participants')
        .insert({
          team_id: team_id,
          submission_id: teamMember.submission_id,
          display_name: teamMember.team_matching_submissions.full_name || 'Unknown User',
          is_active: true,
          joined_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (enrollError) {
        console.error(`Failed to auto-enroll user ${userId} in team chat:`, enrollError)
        return NextResponse.json(
          { success: false, error: 'Failed to join team chat' },
          { status: 500 }
        )
      }
      
      console.log(`✅ Auto-enrolled user ${userId} in team ${team_id} chat`)
    }

    console.log(`✅ User ${userId} has access to team ${team_id}`)
  
      // Insert new message
      const { data: newMessage, error: insertError } = await supabase
        .from('team_chat_messages')
        .insert({
          team_id: team_id,
          sender_id: userId,
          message_text: message_text.trim(),
          message_type: numericMessageType,
          parent_message_id: parent_message_id || null
        })
        .select(`
          id,
          team_id,
          sender_id,
          message_text,
          message_type,
          parent_message_id,
          is_edited,
          created_at,
          updated_at
        `)
        .single()

    if (insertError) {
      console.error('Error creating message:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Return the message with sender details
    const messageWithSender = {
      id: newMessage.id,
      team_id: newMessage.team_id,
      sender_id: userId,
      message_text: newMessage.message_text,
      message_type: newMessage.message_type,
      created_at: newMessage.created_at,
      sender: {
        id: userId,
        full_name: 'User',
        college_name: 'Your College'
      }
    }

    // Broadcast the new message to all team members via SSE
    broadcastMessage(team_id, messageWithSender)

    return NextResponse.json({
      success: true,
      data: messageWithSender
    })

  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}