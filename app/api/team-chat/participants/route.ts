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

    // Verify user is participant in this team
    // Note: team_chat_participants uses submission_id, not user_id
    const { data: userParticipant } = await supabase
      .from('team_chat_participants')
      .select(`
        *,
        team_matching_submissions!inner(
          user_id
        )
      `)
      .eq('team_id', teamId)
      .eq('team_matching_submissions.user_id', userId)
      .eq('is_active', true)
      .single()

    if (!userParticipant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized for this team' },
        { status: 403 }
      )
    }

    // Get all active participants for this team
    const { data: participants, error } = await supabase
      .from('team_chat_participants')
      .select(`
        id,
        team_id,
        user_id,
        submission_id,
        display_name,
        last_read_message_id,
        last_active_at,
        joined_at,
        is_active
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: participants || []
    })

  } catch (error) {
    console.error('Error in participants GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, submission_id, display_name } = body

    if (!team_id || !submission_id || !display_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Team ID, submission ID, and display name are required' },
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

    // Check if participant already exists
    const { data: existingParticipant } = await supabase
      .from('team_chat_participants')
      .select('id, is_active')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      if (existingParticipant.is_active) {
        return NextResponse.json(
          { success: false, error: 'User is already a participant' },
          { status: 409 }
        )
      } else {
        // Reactivate participant
        const { data: updatedParticipant, error } = await supabase
          .from('team_chat_participants')
          .update({
            is_active: true,
            display_name: display_name.trim(),
            submission_id,
            last_active_at: new Date().toISOString()
          })
          .eq('id', existingParticipant.id)
          .select()
          .single()

        if (error) {
          console.error('Error reactivating participant:', error)
          return NextResponse.json(
            { success: false, error: 'Failed to join team chat' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: { participant: updatedParticipant }
        })
      }
    }

    // Create new participant
    const { data: newParticipant, error } = await supabase
      .from('team_chat_participants')
      .insert({
        team_id,
        user_id: user.id,
        submission_id,
        display_name: display_name.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating participant:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to join team chat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { participant: newParticipant }
    })

  } catch (error) {
    console.error('Error in participants POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}