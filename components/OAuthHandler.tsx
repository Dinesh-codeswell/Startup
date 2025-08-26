"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function OAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Handle OAuth callback from URL parameters
    const handleOAuthCallback = () => {
      const isAuthCallback = searchParams.get('auth_callback')
      const redirectTo = searchParams.get('redirect_to')
      const authSuccess = searchParams.get('auth_success')
      
      // If this is an auth callback or auth success, handle the redirect
      if (isAuthCallback || authSuccess) {
        console.log('Handling OAuth callback:', { isAuthCallback, authSuccess, redirectTo, user: !!user })
        
        // Wait for auth state to settle
        if (!loading) {
          if (user) {
            // User is authenticated, redirect to intended destination
            const finalRedirect = redirectTo || '/'
            console.log('User authenticated, redirecting to:', finalRedirect)
            
            // Clean up URL parameters and redirect
            const cleanUrl = new URL(window.location.href)
            cleanUrl.searchParams.delete('auth_callback')
            cleanUrl.searchParams.delete('auth_success')
            cleanUrl.searchParams.delete('redirect_to')
            
            // Use replace to avoid back button issues
            window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search)
            
            // Redirect to final destination
            if (finalRedirect !== '/') {
              router.push(finalRedirect)
            }
          } else {
            // No user found, something went wrong
            console.log('OAuth callback but no user found, redirecting to login')
            router.push('/login?error=oauth_failed')
          }
        }
      }
    }

    // Handle OAuth tokens in URL hash (for implicit flow)
    const handleHashTokens = () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        console.log('OAuth tokens found in URL hash, cleaning up')
        
        // Clean up the hash
        window.history.replaceState({}, '', window.location.pathname + window.location.search)
        
        // The auth context should handle the tokens automatically
        // Just wait for the user state to update
        setTimeout(() => {
          if (user) {
            const redirectTo = searchParams.get('returnTo') || searchParams.get('redirect_to')
            if (redirectTo) {
              router.push(redirectTo)
            }
          }
        }, 1000)
      }
    }

    handleOAuthCallback()
    handleHashTokens()
  }, [searchParams, user, loading, router])

  // This component doesn't render anything
  return null
}