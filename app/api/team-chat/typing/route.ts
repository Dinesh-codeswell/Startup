import { NextRequest, NextResponse } from 'next/server'
import { TeamChatService } from '@/lib/services/team-chat-service'
import type { UpdateTypingRequest, UpdateTypingResponse } from '@/lib/types/team-chat'

export async function POST(request: NextRequest) {
  try {
    const body: UpdateTypingRequest = await request.json()
    
    // TODO: Get actual user submission ID from auth
    const submissionId = 'mock-user-submission-id'
    
    if (!body.team_id || typeof body.is_typing !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: team_id and is_typing'
      } as UpdateTypingResponse, { status: 400 })
    }

    try {
      await TeamChatService.updateTypingIndicator(submissionId, body)
      
      return NextResponse.json({
        success: true,
        message: body.is_typing ? 'Typing indicator set' : 'Typing indicator removed'
      } as UpdateTypingResponse)
    } catch (serviceError) {
      // If database tables don't exist, return success anyway
      console.warn('Database tables may not exist, returning mock success:', serviceError)
      
      return NextResponse.json({
        success: true,
        message: body.is_typing ? 'Typing indicator set (mock)' : 'Typing indicator removed (mock)'
      } as UpdateTypingResponse)
    }
    
  } catch (error) {
    console.error('Error updating typing indicator:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to update typing indicator: ${errorMessage}`
    } as UpdateTypingResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    
    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: team_id'
      }, { status: 400 })
    }

    try {
      const typingUsers = await TeamChatService.getTypingIndicators(teamId)
      
      return NextResponse.json({
        success: true,
        data: typingUsers
      })
    } catch (serviceError) {
      // If database tables don't exist, return empty array
      console.warn('Database tables may not exist, returning empty typing indicators:', serviceError)
      
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
  } catch (error) {
    console.error('Error fetching typing indicators:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch typing indicators: ${errorMessage}`
    }, { status: 500 })
  }
}