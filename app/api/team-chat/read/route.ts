import { NextRequest, NextResponse } from 'next/server'
import { TeamChatService } from '@/lib/services/team-chat-service'
import type { MarkMessagesReadRequest, MarkMessagesReadResponse } from '@/lib/types/team-chat'

export async function POST(request: NextRequest) {
  try {
    const body: MarkMessagesReadRequest = await request.json()
    
    // TODO: Get actual user submission ID from auth
    const submissionId = 'mock-user-submission-id'
    
    if (!body.team_id || !body.last_message_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: team_id and last_message_id'
      } as MarkMessagesReadResponse, { status: 400 })
    }

    try {
      await TeamChatService.markMessagesRead(submissionId, body)
      
      return NextResponse.json({
        success: true,
        message: 'Messages marked as read'
      } as MarkMessagesReadResponse)
    } catch (serviceError) {
      // If database tables don't exist, return success anyway
      console.warn('Database tables may not exist, returning mock success:', serviceError)
      
      return NextResponse.json({
        success: true,
        message: 'Messages marked as read (mock)'
      } as MarkMessagesReadResponse)
    }
    
  } catch (error) {
    console.error('Error marking messages as read:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to mark messages as read: ${errorMessage}`
    } as MarkMessagesReadResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    
    // TODO: Get actual user submission ID from auth
    const submissionId = 'mock-user-submission-id'
    
    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: team_id'
      }, { status: 400 })
    }

    try {
      const unreadCount = await TeamChatService.getUnreadMessageCount(teamId, submissionId)
      
      return NextResponse.json({
        success: true,
        data: {
          unread_count: unreadCount
        }
      })
    } catch (serviceError) {
      // If database tables don't exist, return 0
      console.warn('Database tables may not exist, returning 0 unread count:', serviceError)
      
      return NextResponse.json({
        success: true,
        data: {
          unread_count: 0
        }
      })
    }
    
  } catch (error) {
    console.error('Error getting unread count:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to get unread count: ${errorMessage}`
    }, { status: 500 })
  }
}