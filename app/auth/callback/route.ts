import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirect_to')
  
  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    redirectTo,
    fullUrl: request.url,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error in callback:', { error, errorDescription })
    
    // For certain errors, redirect to homepage instead of login to avoid loops
    if (error === 'access_denied' || error === 'cancelled') {
      console.log('User cancelled OAuth, redirecting to homepage')
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
    
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', `oauth_error: ${error}`)
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }
  
  // If no code but no error, redirect to homepage
  if (!code) {
    console.log('No authorization code, redirecting to homepage')
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  try {
    // Store cookies to be set on the final response
    const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = []
    const cookiesToRemove: Array<{ name: string; options: CookieOptions }> = []
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('🍪 Queuing cookie to set:', { name, hasValue: !!value, options })
            cookiesToSet.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            console.log('🗑️ Queuing cookie to remove:', name)
            cookiesToRemove.push({ name, options })
          },
        },
      }
    )
    
    // Exchange the code for a session
    console.log('Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'session_exchange_failed')
      loginUrl.searchParams.set('details', exchangeError.message)
      
      const errorResponse = NextResponse.redirect(loginUrl)
      // Apply any cookies that were queued
      cookiesToSet.forEach(({ name, value, options }) => {
        errorResponse.cookies.set(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
      })
      cookiesToRemove.forEach(({ name, options }) => {
        errorResponse.cookies.set(name, '', {
          ...options,
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
      })
      return errorResponse
    }
    
    if (!data.user) {
      console.error('No user data received after session exchange')
      const errorResponse = NextResponse.redirect(new URL('/login?error=no_user_data', requestUrl.origin))
      // Apply any cookies that were queued
      cookiesToSet.forEach(({ name, value, options }) => {
        errorResponse.cookies.set(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
      })
      cookiesToRemove.forEach(({ name, options }) => {
        errorResponse.cookies.set(name, '', {
          ...options,
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
      })
      return errorResponse
    }

    console.log('User authenticated successfully:', {
      email: data.user.email,
      id: data.user.id,
      provider: data.user.app_metadata?.provider
    })
    
    // Try to create/update user profile
    try {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating new profile for user:', data.user.email)
        
        const profileData = {
          id: data.user.id,
          first_name: data.user.user_metadata?.first_name || 
                     data.user.user_metadata?.full_name?.split(' ')[0] || 
                     data.user.user_metadata?.name?.split(' ')[0] || '',
          last_name: data.user.user_metadata?.last_name || 
                    data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                    data.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
          email: data.user.email || '',
          college_name: data.user.user_metadata?.college_name || '',
          full_access: true
        }
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData)
        
        if (insertError) {
          console.error('Error creating profile:', insertError)
          // Don't fail the auth flow for profile creation errors
        } else {
          console.log('Profile created successfully for:', data.user.email)
        }
      } else if (existingProfile) {
        console.log('Profile already exists for user:', data.user.email)
      }
    } catch (profileError) {
      console.error('Profile handling error (non-fatal):', profileError)
      // Continue with auth flow even if profile operations fail
    }
    
    // Determine redirect URL - default to homepage for better UX
    let finalRedirectUrl = '/'
    
    if (redirectTo && redirectTo !== '/login') {
      // Validate redirect URL to prevent open redirects
      try {
        const redirectUrl = new URL(redirectTo, requestUrl.origin)
        if (redirectUrl.origin === requestUrl.origin) {
          finalRedirectUrl = redirectTo
        } else {
          console.warn('Invalid redirect URL (different origin):', redirectTo)
        }
      } catch (urlError) {
        console.warn('Invalid redirect URL format:', redirectTo)
      }
    }
    
    console.log('Redirecting authenticated user to:', finalRedirectUrl)
    
    // Create redirect response with cookies properly applied
    const redirectResponse = NextResponse.redirect(new URL(finalRedirectUrl, requestUrl.origin))
    
    // Apply all queued cookies to the redirect response
    cookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    })
    
    cookiesToRemove.forEach(({ name, options }) => {
      redirectResponse.cookies.set(name, '', {
        ...options,
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    })
    
    console.log('🍪 Cookies applied to redirect response:', cookiesToSet.map(c => c.name))
    
    return redirectResponse
    
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'callback_error')
    loginUrl.searchParams.set('details', error instanceof Error ? error.message : 'Unknown error')
    
    const errorResponse = NextResponse.redirect(loginUrl)
    // Try to preserve any cookies that might have been queued before the error
    try {
      if (typeof cookiesToSet !== 'undefined') {
        cookiesToSet.forEach(({ name, value, options }) => {
          errorResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        })
      }
      if (typeof cookiesToRemove !== 'undefined') {
        cookiesToRemove.forEach(({ name, options }) => {
          errorResponse.cookies.set(name, '', {
            ...options,
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        })
      }
    } catch (cookieError) {
      console.warn('Failed to preserve cookies in error response:', cookieError)
    }
    
    return errorResponse
  }
}
