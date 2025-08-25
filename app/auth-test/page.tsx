'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authSuccess, setAuthSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for auth success parameter
    if (searchParams.get('auth_success') === 'true') {
      setAuthSuccess(true)
      // Clean up the URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    // Get current user
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting user:', error)
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user || null)
      if (event === 'SIGNED_IN') {
        setAuthSuccess(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/auth-test`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Sign in failed')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        setUser(null)
        setAuthSuccess(false)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {authSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ Authentication successful! You were redirected back to your website.
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Signed In</h3>
                <p className="text-sm text-blue-700">Email: {user.email}</p>
                <p className="text-sm text-blue-700">ID: {user.id}</p>
                <p className="text-sm text-blue-700">Provider: {user.app_metadata?.provider || 'email'}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  Go to Homepage
                </Button>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Test the authentication flow by signing in with Google.
              </p>
              
              <Button 
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Test Google Sign In
              </Button>

              <div className="text-center">
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login Page
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            This page tests that OAuth redirects work properly and users stay on your website.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}