import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Enhanced cookie debugging
  const allCookies = request.cookies.getAll()
  console.log('🍪 Raw cookies in updateSession:', allCookies)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log('🔍 getAll() called, returning:', cookies.length, 'cookies')
          return cookies
        },
        setAll(cookiesToSet) {
          try {
            console.log('🔧 Setting cookies:', cookiesToSet.map(c => ({ name: c.name, hasValue: !!c.value })))
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              })
            })
          } catch (error) {
            console.warn('❌ Failed to set cookies in middleware:', error)
          }
        },
      },
    }
  )

  // Enhanced cookie analysis
  const cookieAnalysis = {
    total: allCookies.length,
    supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')),
    authCookies: allCookies.filter(c => c.name.includes('auth') || c.name.includes('session')),
    otherCookies: allCookies.filter(c => 
      c.name.includes('clerk') || 
      c.name.includes('__session') ||
      c.name.includes('__client_uat')
    )
  }
  
  console.log('🔍 Cookie analysis:', {
    total: cookieAnalysis.total,
    supabaseCount: cookieAnalysis.supabaseCookies.length,
    supabaseNames: cookieAnalysis.supabaseCookies.map(c => c.name),
    authCount: cookieAnalysis.authCookies.length,
    otherAuthCount: cookieAnalysis.otherCookies.length
  })

  // This will refresh the session if expired - required for Server Components
  console.log('🔄 Attempting to get user session...')
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('👤 Session result:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasError: !!error,
    errorMessage: error?.message
  })
  
  // Enhanced error reporting for debugging
  let enhancedError = error
  if (error && cookieAnalysis.supabaseCookies.length === 0 && cookieAnalysis.otherCookies.length > 0) {
    enhancedError = {
      ...error,
      message: 'Auth session missing! Please sign in through Supabase authentication.',
      details: 'Non-Supabase auth cookies detected. Clear cookies and sign in again.'
    }
  } else if (error && cookieAnalysis.total === 0) {
    enhancedError = {
      ...error,
      message: 'No authentication cookies found!',
      details: 'Please sign in to establish a session.'
    }
  }

  return { response, user, error: enhancedError }
}