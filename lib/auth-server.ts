import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Get current user from server-side session
 * Used in API routes to authenticate and get user information
 */
export async function getCurrentUser(request?: NextRequest) {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log('🍪 Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('🔐 Auth result:', { hasUser: !!user, error: error?.message })
    
    if (error || !user) {
      return { user: null, error: error?.message || 'No user found' }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error: 'Failed to get user session' }
  }
}

/**
 * Get user submission ID from team_matching_submissions table
 * This maps the authenticated user to their submission record
 */
export async function getUserSubmissionId(userId: string) {
  try {
    const { supabaseAdmin } = await import('./supabase-admin')
    
    const { data: submission, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (error || !submission) {
      console.warn(`No submission found for user ${userId}:`, error?.message)
      return null
    }
    
    return submission.id
  } catch (error) {
    console.error('Error getting user submission ID:', error)
    return null
  }
}

/**
 * Authentication response helper for API routes
 */
export function createAuthErrorResponse(message: string = 'Authentication required') {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  )
}

/**
 * Check if user has access to a specific team
 * Used for team chat authorization
 */
export async function checkTeamAccess(userId: string, teamId: string) {
  try {
    const { supabaseAdmin } = await import('./supabase-admin')
    
    // First get the user's submission ID
    const submissionId = await getUserSubmissionId(userId)
    if (!submissionId) {
      console.warn(`No submission ID found for user ${userId}`)
      return false
    }
    
    // Check if user is a member of the team using submission_id
    const { data: teamMember, error } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('submission_id', submissionId)
      .single()
    
    if (error || !teamMember) {
      console.warn(`User ${userId} (submission: ${submissionId}) is not a member of team ${teamId}:`, error?.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking team access:', error)
    return false
  }
}