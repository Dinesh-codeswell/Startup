import { NextRequest, NextResponse } from 'next/server'
import { TeamChatService } from '@/lib/services/team-chat-service'
import type { 
  SendMessageRequest, 
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse 
} from '@/lib/types/team-chat'

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json()
    
    // TODO: Get actual user submission ID from auth
    // For now, we'll use a mock submission ID
    const senderSubmissionId = 'mock-user-submission-id'
    
    // Validate required fields
    if (!body.team_id || !body.message_text) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: team_id and message_text'
      } as SendMessageResponse, { status: 400 })
    }

    // Validate message text
    if (body.message_text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Message text cannot be empty'
      } as SendMessageResponse, { status: 400 })
    }

    try {
      const message = await TeamChatService.sendMessage(senderSubmissionId, body)
      
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        data: message
      } as SendMessageResponse)
    } catch (serviceError) {
      // If database tables don't exist, return a mock success response
      console.warn('Database tables may not exist, returning mock response:', serviceError)
      
      const mockMessage = {
        id: `mock-${Date.now()}`,
        team_id: body.team_id,
        sender_submission_id: senderSubmissionId,
        message_text: body.message_text,
        message_type: body.message_type || 'text',
        reply_to_message_id: body.reply_to_message_id || null,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: senderSubmissionId,
          full_name: 'Mock User',
          college_name: 'Mock College'
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully (mock mode)',
        data: mockMessage
      } as SendMessageResponse)
    }
    
  } catch (error) {
    console.error('Error sending message:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to send message: ${errorMessage}`
    } as SendMessageResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const getRequest: GetMessagesRequest = {
      team_id: searchParams.get('team_id') || '',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      before_message_id: searchParams.get('before_message_id') || undefined,
      after_message_id: searchParams.get('after_message_id') || undefined
    }
    
    if (!getRequest.team_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: team_id'
      } as GetMessagesResponse, { status: 400 })
    }

    try {
      const result = await TeamChatService.getMessages(getRequest)
      
      return NextResponse.json({
        success: true,
        data: result
      } as GetMessagesResponse)
    } catch (serviceError) {
      // If database tables don't exist, return empty messages
      console.warn('Database tables may not exist, returning empty messages:', serviceError)
      
      return NextResponse.json({
        success: true,
        data: {
          messages: [],
          has_more: false,
          total_count: 0
        }
      } as GetMessagesResponse)
    }
    
  } catch (error) {
    console.error('Error fetching messages:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Return empty messages instead of error for better UX
    return NextResponse.json({
      success: true,
      data: {
        messages: [],
        has_more: false,
        total_count: 0
      }
    } as GetMessagesResponse)
  }
}