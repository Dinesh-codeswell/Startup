import { NextRequest, NextResponse } from 'next/server'
import { TeamChatService } from '@/lib/services/team-chat-service'
import type { AddReactionRequest, AddReactionResponse } from '@/lib/types/team-chat'

export async function POST(request: NextRequest) {
  try {
    const body: AddReactionRequest = await request.json()
    
    // TODO: Get actual user submission ID from auth
    const senderSubmissionId = 'mock-user-submission-id'
    
    if (!body.message_id || !body.reaction_emoji) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: message_id and reaction_emoji'
      } as AddReactionResponse, { status: 400 })
    }

    const reaction = await TeamChatService.addReaction(senderSubmissionId, body)
    
    return NextResponse.json({
      success: true,
      data: reaction
    } as AddReactionResponse)
    
  } catch (error) {
    console.error('Error adding reaction:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to add reaction: ${errorMessage}`
    } as AddReactionResponse, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('message_id')
    const reactionEmoji = searchParams.get('reaction_emoji')
    
    // TODO: Get actual user submission ID from auth
    const senderSubmissionId = 'mock-user-submission-id'
    
    if (!messageId || !reactionEmoji) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: message_id and reaction_emoji'
      }, { status: 400 })
    }

    await TeamChatService.removeReaction(senderSubmissionId, messageId, reactionEmoji)
    
    return NextResponse.json({
      success: true,
      message: 'Reaction removed successfully'
    })
    
  } catch (error) {
    console.error('Error removing reaction:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to remove reaction: ${errorMessage}`
    }, { status: 500 })
  }
}