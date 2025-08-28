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
      reportType,
      description,
      priority,
      userDetails,
      teamDetails 
    } = body

    // Validate required fields
    if (!userId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, description' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 2000 characters' },
        { status: 400 }
      )
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be: low, medium, high, or urgent' },
        { status: 400 }
      )
    }

    // Get user's team if teamId is not provided
    let userTeamId = teamId
    if (!userTeamId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('team_id')
        .eq('id', userId)
        .single()
      
      if (userError || !userData?.team_id) {
        return NextResponse.json(
          { error: 'User team not found. Please ensure you are part of a team.' },
          { status: 400 }
        )
      }
      userTeamId = userData.team_id
    }

    // Insert issue report
    const { data, error } = await supabaseAdmin
      .from('issue_reports')
      .insert({
        user_id: userId,
        team_id: userTeamId,
        report_type: reportType || 'bug',
        description: description.trim(),
        priority: priority || 'medium'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating issue report:', error)
      return NextResponse.json(
        { error: 'Failed to submit issue report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Issue report submitted successfully',
        reportId: data.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in issue report API:', error)
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
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const teamId = searchParams.get('teamId')
    const reportType = searchParams.get('reportType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('issue_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (teamId) {
      query = query.eq('team_id', teamId)
    }
    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching issue reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch issue reports' },
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
    const transformedData = data?.map(report => {
      const user = usersMap.get(report.user_id)
      const team = teamsMap.get(report.team_id)
      
      return {
        id: report.id,
        userId: report.user_id,
        userName: user?.full_name || 'Unknown User',
        userEmail: user?.email || 'unknown@email.com',
        teamId: report.team_id,
        teamName: team?.team_name || 'No Team',
        subject: `${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1).replace('_', ' ')} Report`,
        description: report.description,
        priority: report.priority,
        status: report.status,
        adminResponse: report.admin_response,
        adminId: report.resolved_by,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }
    }) || []

    return NextResponse.json({ success: true, data: transformedData })

  } catch (error) {
    console.error('Error in issue report GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, status, priority, adminResponse, adminId } = body

    // Validate required fields
    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing required field: reportId' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Validate and update status if provided
    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: open, in_progress, resolved, or closed' },
          { status: 400 }
        )
      }
      updateData.status = status
      
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    // Validate and update priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be: low, medium, high, or urgent' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }

    if (adminId) {
      updateData.resolved_by = adminId
    }

    const { data, error } = await supabaseAdmin
      .from('issue_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      console.error('Error updating issue report:', error)
      return NextResponse.json(
        { error: 'Failed to update issue report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Issue report updated successfully',
        report: data
      }
    )

  } catch (error) {
    console.error('Error in issue report PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}