"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

/**
 * Component to handle immediate auth state refresh after OAuth callbacks
 * This ensures the UI updates immediately without requiring tab switches
 */
export function OAuthCallbackHandler() {
  const { refreshProfile, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if we're on a page that might have come from OAuth callback
    const handleOAuthCallback = async () => {
      if (typeof window === 'undefined') return

      const urlParams = new URLSearchParams(window.location.search)
      const currentPath = window.location.pathname
      
      // Detect OAuth callback scenarios
      const isOAuthCallback = 
        urlParams.has('code') ||
        window.location.hash.includes('access_token') ||
        document.referrer.includes('/auth/callback') ||
        sessionStorage.getItem('oauth_in_progress') === 'true'

      if (isOAuthCallback) {
        console.log('OAuth callback detected, forcing auth state refresh')
        
        // Clear the OAuth progress flag
        sessionStorage.removeItem('oauth_in_progress')
        
        // Force immediate profile refresh
        try {
          await refreshProfile()
          console.log('Auth state refreshed successfully after OAuth')
          
          // Clean up URL parameters if they exist
          if (urlParams.has('code') || urlParams.has('state')) {
            const cleanUrl = new URL(window.location.href)
            cleanUrl.searchParams.delete('code')
            cleanUrl.searchParams.delete('state')
            cleanUrl.searchParams.delete('scope')
            cleanUrl.searchParams.delete('authuser')
            cleanUrl.searchParams.delete('prompt')
            
            // Replace the current URL without triggering a page reload
            window.history.replaceState({}, '', cleanUrl.toString())
          }
        } catch (error) {
          console.error('Error refreshing auth state after OAuth:', error)
        }
      }
    }

    // Run immediately
    handleOAuthCallback()

    // Also run when user state changes from null to a user (successful login)
    if (user && !loading) {
      console.log('User state updated, ensuring profile is current')
      refreshProfile().catch(error => {
        console.error('Error refreshing profile on user state change:', error)
      })
    }
  }, [user, loading, refreshProfile])

  // This component doesn't render anything
  return null
}

/**
 * Hook to mark OAuth process as in progress
 * Call this before redirecting to OAuth provider
 */
export function useOAuthProgress() {
  const markOAuthInProgress = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_in_progress', 'true')
    }
  }

  const clearOAuthProgress = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_in_progress')
    }
  }

  return { markOAuthInProgress, clearOAuthProgress }
}