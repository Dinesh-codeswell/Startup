import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface ApproveTeamRequest {
  team_id: string
  action: 'approve' | 'reject'
  admin_notes?: string
}

interface ApproveTeamResponse {
  success: boolean
  message?: string
  data?: {
    team_id: string
    approval_status: string
    approved_at?: string
    chat_created: boolean
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ApproveTeamRequest = await request.json()
    
    // TODO: Get actual admin user ID from auth
    const adminUserId = 'mock-admin-user-id'
    
    // Validate required fields
    if (!body.team_id || !body.action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: team_id and action'
      } as ApproveTeamResponse, { status: 400 })
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be either "approve" or "reject"'
      } as ApproveTeamResponse, { status: 400 })
    }

    // Check if team exists
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, team_name, approval_status, status')
      .eq('id', body.team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({
        success: false,
        error: 'Team not found'
      } as ApproveTeamResponse, { status: 404 })
    }

    // Update team approval status
    const approvalStatus = body.action === 'approve' ? 'approved' : 'rejected'
    const updateData: any = {
      approval_status: approvalStatus,
      approved_by: adminUserId,
      approved_at: new Date().toISOString()
    }

    const { data: updatedTeam, error: updateError } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', body.team_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team approval status:', updateError)
      return NextResponse.json({
        success: false,
        error: `Failed to ${body.action} team: ${updateError.message}`
      } as ApproveTeamResponse, { status: 500 })
    }

    // If approved, the trigger will automatically create the welcome message
    // and add participants to chat
    let chatCreated = false
    if (body.action === 'approve') {
      // Check if chat participants were created (via trigger)
      const { data: participants } = await supabaseAdmin
        .from('team_chat_participants')
        .select('id')
        .eq('team_id', body.team_id)
        .limit(1)

      chatCreated = (participants && participants.length > 0) || false
    }

    // Create audit log entry
    try {
      await supabaseAdmin
        .from('team_formation_audit')
        .insert({
          action: body.action === 'approve' ? 'team_approved' : 'team_rejected',
          table_name: 'teams',
          record_id: body.team_id,
          old_values: { approval_status: team.approval_status },
          new_values: { approval_status: approvalStatus },
          admin_user_id: adminUserId
        })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
      // Don't fail the main operation if audit logging fails
    }

    const response: ApproveTeamResponse = {
      success: true,
      message: `Team ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: {
        team_id: body.team_id,
        approval_status: approvalStatus,
        approved_at: updateData.approved_at,
        chat_created: chatCreated
      }
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in team approval:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to process team approval: ${errorMessage}`
    } as ApproveTeamResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    
    // Get teams by approval status
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select(`
        id,
        team_name,
        team_size,
        compatibility_score,
        status,
        approval_status,
        approved_by,
        approved_at,
        formed_at,
        members:team_members(
          id,
          role_in_team,
          submission:team_matching_submissions(
            id,
            full_name,
            email,
            college_name,
            current_year,
            core_strengths,
            preferred_roles,
            availability,
            experience
          )
        )
      `)
      .eq('approval_status', status)
      .order('formed_at', { ascending: false })

    if (error) {
      console.error('Error fetching teams for approval:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch teams: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: teams || [],
      count: teams?.length || 0
    })
    
  } catch (error) {
    console.error('Error fetching teams for approval:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch teams for approval'
    }, { status: 500 })
  }
}