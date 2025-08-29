import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Store active connections
const connections = new Map<string, { controller: ReadableStreamDefaultController, teamId: string, userId: string }>()

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Verify user is part of the team
    const { data: participant, error: participantError } = await supabase
      .from('team_chat_participants')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized for this team' },
        { status: 403 }
      )
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `${user.id}_${teamId}_${Date.now()}`
        connections.set(connectionId, { controller, teamId, userId: user.id })

        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`)

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch (error) {
            clearInterval(heartbeat)
            connections.delete(connectionId)
          }
        }, 30000)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          connections.delete(connectionId)
          try {
            controller.close()
          } catch (error) {
            // Connection already closed
          }
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('Error in events GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Function to broadcast events to all connections for a team
export function broadcastToTeam(teamId: string, event: any) {
  const message = `data: ${JSON.stringify(event)}\n\n`
  
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.teamId === teamId) {
      try {
        connection.controller.enqueue(message)
      } catch (error) {
        // Connection closed, remove it
        connections.delete(connectionId)
      }
    }
  }
}

// Function to broadcast typing indicators
export function broadcastTyping(teamId: string, userId: string, isTyping: boolean, userName: string) {
  const event = {
    type: 'typing',
    userId,
    userName,
    isTyping,
    timestamp: new Date().toISOString()
  }
  
  const message = `data: ${JSON.stringify(event)}\n\n`
  
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.teamId === teamId && connection.userId !== userId) {
      try {
        connection.controller.enqueue(message)
      } catch (error) {
        connections.delete(connectionId)
      }
    }
  }
}

// Function to broadcast new messages
export function broadcastMessage(teamId: string, message: any) {
  const event = {
    type: 'new_message',
    message,
    timestamp: new Date().toISOString()
  }
  
  broadcastToTeam(teamId, event)
}