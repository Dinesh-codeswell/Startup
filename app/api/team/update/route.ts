import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(request: NextRequest) {
  try {
    const { teamId, teamName, bio } = await request.json()

    // Validate input - at least one field must be provided
    if (!teamId || (!teamName && bio === undefined)) {
      return NextResponse.json(
        { error: 'Team ID and at least one field (teamName or bio) are required' },
        { status: 400 }
      )
    }

    // Prepare update object
    const updateData: any = {}

    // Validate and add team name if provided
    if (teamName !== undefined) {
      if (teamName.trim().length < 2 || teamName.trim().length > 100) {
        return NextResponse.json(
          { error: 'Team name must be between 2 and 100 characters' },
          { status: 400 }
        )
      }
      updateData.team_name = teamName.trim()
    }

    // Validate and add bio if provided
    if (bio !== undefined) {
      if (bio !== null && bio.length > 1000) {
        return NextResponse.json(
          { error: 'Bio must be 1000 characters or less' },
          { status: 400 }
        )
      }
      updateData.bio = bio
    }

    // Update team in database
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      team: data,
      message: 'Team updated successfully'
    })

  } catch (error) {
    console.error('Error in team update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}