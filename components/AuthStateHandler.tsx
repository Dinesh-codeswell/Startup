"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export function AuthStateHandler() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Handle auth success from URL params (after OAuth redirect)
    const handleAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth_success') === 'true') {
        console.log('Auth success detected, forcing state refresh...')
        
        // Force a profile refresh to ensure UI updates
        if (user) {
          await refreshProfile()
        }
        
        // Clean up URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('auth_success')
        window.history.replaceState({}, '', newUrl.toString())
        
        // Force a router refresh to ensure all components re-render
        router.refresh()
      }
    }

    handleAuthSuccess()
  }, [user, refreshProfile, router])

  // Handle visibility change to refresh auth state when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        // User returned to tab, refresh profile to ensure UI is up to date
        await refreshProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, refreshProfile])

  return null // This component doesn't render anything
}