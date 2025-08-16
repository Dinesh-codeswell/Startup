import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAuthorizedAdmin } from '@/lib/admin-utils'

/**
 * API endpoint to validate admin session and authorization
 * This helps resolve timing issues between client and server-side checks
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          isValid: false,
          isAdmin: false,
          error: 'No valid session found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Check if user is authorized admin
    const isAdmin = isAuthorizedAdmin(user.email || '')

    // Log the validation for debugging
    console.log('Admin session validation:', {
      userEmail: user.email,
      isAdmin,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      isValid: true,
      isAdmin,
      userEmail: user.email,
      userId: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin session validation error:', error)
    
    return NextResponse.json(
      {
        isValid: false,
        isAdmin: false,
        error: 'Internal server error during validation',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to refresh admin status
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Refresh the session
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError || !session?.user) {
      return NextResponse.json(
        {
          isValid: false,
          isAdmin: false,
          error: 'Failed to refresh session',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Check admin status with refreshed session
    const isAdmin = isAuthorizedAdmin(session.user.email || '')

    console.log('Admin session refreshed:', {
      userEmail: session.user.email,
      isAdmin,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      isValid: true,
      isAdmin,
      userEmail: session.user.email,
      userId: session.user.id,
      sessionRefreshed: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin session refresh error:', error)
    
    return NextResponse.json(
      {
        isValid: false,
        isAdmin: false,
        error: 'Internal server error during refresh',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}