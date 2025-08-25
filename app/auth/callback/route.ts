import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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
    fullUrl: request.url
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error in callback:', { error, errorDescription })
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', `oauth_error: ${error}`)
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }
  
  if (!code) {
    console.error('No authorization code received in callback')
    return NextResponse.redirect(new URL('/login?error=no_authorization_code', requestUrl.origin))
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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
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
    
    // Determine redirect URL
    let finalRedirectUrl = '/'
    
    if (redirectTo) {
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
    
    // Create the redirect response
    const response = NextResponse.redirect(new URL(finalRedirectUrl, requestUrl.origin))
    
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
