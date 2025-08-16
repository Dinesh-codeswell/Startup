import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to')
  
  if (code) {
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
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
      }
      
      if (data.user) {
        console.log('User authenticated via OAuth:', data.user.email)
        
        // Check if profile exists, if not create one
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          console.log('Creating profile for OAuth user:', data.user.email)
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              first_name: data.user.user_metadata?.first_name || data.user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: data.user.user_metadata?.last_name || data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              email: data.user.email || '',
              college_name: data.user.user_metadata?.college_name || '',
              full_access: data.user.user_metadata?.full_access ?? true
            })
          
          if (insertError) {
            console.error('Error creating profile:', insertError)
          } else {
            console.log('Profile created successfully for:', data.user.email)
          }
        }
      }
      
      // Redirect to the intended destination or home
      const redirectUrl = redirectTo || '/'
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin))
    }
  }
  
  // No code parameter, redirect to login
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}
