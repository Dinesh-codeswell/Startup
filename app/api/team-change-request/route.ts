import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      teamId, 
      requestType, 
      reason,
      details
    } = body

    // Validate required fields
    if (!userId || !requestType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, requestType, reason' },
        { status: 400 }
      )
    }

    // Validate request type
    const validRequestTypes = ['leave_team', 'switch_team', 'dissolve_team']
    if (!validRequestTypes.includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type. Must be: leave_team, switch_team, or dissolve_team' },
        { status: 400 }
      )
    }

    // Validate reason and details length
    if (reason.length < 10 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be between 10 and 500 characters' },
        { status: 400 }
      )
    }

    if (details && details.length > 2000) {
      return NextResponse.json(
        { error: 'Details must not exceed 2000 characters' },
        { status: 400 }
      )
    }

    // Use provided teamId or null if not provided
    const userTeamId = teamId || null

    // Insert team change request
    const { data, error } = await supabaseAdmin
      .from('team_change_requests')
      .insert({
        user_id: userId,
        team_id: userTeamId,
        request_type: requestType,
        reason: reason.trim(),
        details: details?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating team change request:', error)
      return NextResponse.json(
        { error: 'Failed to submit team change request', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Team change request submitted successfully',
        requestId: data.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in team change request API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('team_change_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching team change requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch team change requests' },
        { status: 500 }
      )
    }

    // Get user and team details separately
    const userIds = [...new Set(data?.map(r => r.user_id).filter(Boolean))]
    const teamIds = [...new Set(data?.map(r => r.team_id).filter(Boolean))]
    
    const [usersData, teamsData] = await Promise.all([
      userIds.length > 0 ? supabaseAdmin.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] },
      teamIds.length > 0 ? supabaseAdmin.from('teams').select('id, team_name').in('id', teamIds) : { data: [] }
    ])
    
    const usersMap = new Map((usersData.data || []).map(u => [u.id, u]))
    const teamsMap = new Map((teamsData.data || []).map(t => [t.id, t]))
    
    // Transform data to match frontend expectations
    const transformedData = data?.map(request => {
      const user = usersMap.get(request.user_id)
      const team = teamsMap.get(request.team_id)
      
      return {
        id: request.id,
        userId: request.user_id,
        userName: user?.full_name || 'Unknown User',
        userEmail: user?.email || 'unknown@email.com',
        teamId: request.team_id,
        teamName: team?.team_name || 'No Team',
        requestType: request.request_type,
        message: `${request.reason}${request.details ? '\n\nDetails: ' + request.details : ''}`,
        status: request.status,
        adminResponse: request.admin_response,
        createdAt: request.created_at,
        updatedAt: request.updated_at
      }
    }) || []

    return NextResponse.json({ success: true, data: transformedData })

  } catch (error) {
    console.error('Error in team change request GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, status, adminResponse, adminId } = body

    // Validate required fields
    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, status' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'processed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, rejected, or processed' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (adminId) {
      updateData.reviewed_by = adminId
    }
    if (adminResponse) {
      updateData.admin_response = adminResponse
    }
    if (status === 'processed' || status === 'approved' || status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('team_change_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team change request:', error)
      return NextResponse.json(
        { error: 'Failed to update team change request' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Team change request updated successfully',
        request: data
      }
    )

  } catch (error) {
    console.error('Error in team change request PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}