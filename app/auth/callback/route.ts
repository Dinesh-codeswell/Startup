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
  
  // If no code but no error, this might be a successful OAuth with tokens in hash
  // Check if this is a successful OAuth callback without code (implicit flow)
  if (!code) {
    console.log('No authorization code - checking if this is implicit flow or successful auth')
    
    // Check if there are OAuth success indicators in the URL
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')
    
    if (accessToken || refreshToken) {
      console.log('OAuth tokens found in URL parameters, redirecting to handle client-side')
      // Redirect to a client-side handler that can process the tokens
      const clientHandlerUrl = new URL('/', requestUrl.origin)
      clientHandlerUrl.searchParams.set('auth_callback', 'true')
      if (redirectTo) {
        clientHandlerUrl.searchParams.set('redirect_to', redirectTo)
      }
      return NextResponse.redirect(clientHandlerUrl)
    }
    
    console.log('No authorization code and no tokens, redirecting to homepage')
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

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
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie setting errors gracefully
              console.warn('Failed to set cookie:', name, error)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookie removal errors gracefully
              console.warn('Failed to remove cookie:', name, error)
            }
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
      return NextResponse.redirect(loginUrl)
    }
    
    if (!data.user) {
      console.error('No user data received after session exchange')
      return NextResponse.redirect(new URL('/login?error=no_user_data', requestUrl.origin))
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
    
    // Add success indicator to URL for client-side handling
    const successUrl = new URL(finalRedirectUrl, requestUrl.origin)
    successUrl.searchParams.set('auth_success', 'true')
    
    return NextResponse.redirect(successUrl)
    
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'callback_error')
    loginUrl.searchParams.set('details', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.redirect(loginUrl)
  }
}
