"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { forceSessionSync, useSessionSync, broadcastSessionEvent, forceImmediateSessionSync } from '@/lib/session-sync'

export function AuthStateHandler() {
  const { user, refreshProfile, loading } = useAuth()
  const router = useRouter()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const processedAuthSuccess = useRef(false)
  const lastUserId = useRef<string | null>(null)
  const lastRefreshTime = useRef<number>(0)
  const supabase = createClient()

  // Enhanced session sync for cross-tab communication with immediate response
  const unsubscribeSessionSync = useSessionSync((event) => {
    console.log('AuthStateHandler: Session sync event received:', event)
    
    if (event === 'signout') {
      // Force immediate router refresh on signout
      console.log('AuthStateHandler: Forcing immediate refresh on signout')
      router.refresh()
    } else if (event === 'signin' || event === 'token_refresh') {
      // Force immediate router refresh on signin/refresh
      console.log('AuthStateHandler: Forcing immediate refresh on signin/token_refresh')
      router.refresh()
    }
  })

  // Enhanced auth success handling with immediate state sync
  useEffect(() => {
    const handleAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const hasAuthSuccess = urlParams.get('auth_success') === 'true'
      
      if (hasAuthSuccess && !processedAuthSuccess.current && !isProcessingAuth && !loading) {
        console.log('Auth success detected, forcing immediate state refresh...')
        setIsProcessingAuth(true)
        processedAuthSuccess.current = true
        
        try {
          // Force immediate session refresh from Supabase
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error refreshing session:', error)
          } else if (session?.user) {
            console.log('Session refreshed successfully, updating profile...')
            
            // Force profile refresh
            await refreshProfile()
            
            // Single router refresh after profile is loaded
            router.refresh()
          }
        } catch (error) {
          console.error('Error in auth success handling:', error)
        } finally {
          setIsProcessingAuth(false)
        }
        
        // Clean up URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('auth_success')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }

    // Only run if not loading and not already processed
    if (!loading) {
      handleAuthSuccess()
    }
  }, [user, refreshProfile, router, loading, isProcessingAuth, supabase])

  // Enhanced visibility change handling with throttling
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user && !isProcessingAuth && !loading) {
        const now = Date.now()
        // Throttle visibility changes to prevent excessive refreshes
        if (now - lastRefreshTime.current < 2000) {
          return
        }
        lastRefreshTime.current = now
        
        console.log('Tab became visible, refreshing auth state...')
        try {
          // Force session check when tab becomes visible
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            await refreshProfile()
          }
        } catch (error) {
          console.error('Error refreshing auth state on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, refreshProfile, isProcessingAuth, loading, supabase])

  // Optimized user state change handling
  useEffect(() => {
    const currentUserId = user?.id || null
    if (currentUserId !== lastUserId.current && !loading) {
      console.log('User state change detected:', { from: lastUserId.current, to: currentUserId })
      lastUserId.current = currentUserId
      
      // Single refresh when user state actually changes
      if (!isProcessingAuth) {
        router.refresh()
      }
    }
  }, [user, loading, router, isProcessingAuth])



  // Handle page focus changes with session sync and throttling
  useEffect(() => {
    const handleFocusChange = async () => {
      if (!document.hidden && !isProcessingAuth && !loading) {
        const now = Date.now()
        // Throttle focus events to prevent excessive refreshes
        if (now - lastRefreshTime.current < 1000) {
          return
        }
        lastRefreshTime.current = now
        
        console.log('Page focus detected, forcing immediate session sync...')
        forceImmediateSessionSync()
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            await refreshProfile()
          }
        } catch (error) {
          console.error('Error refreshing auth on focus:', error)
        }
      }
    }

    window.addEventListener('focus', handleFocusChange)
    
    return () => {
      window.removeEventListener('focus', handleFocusChange)
    }
  }, [user, refreshProfile, isProcessingAuth, loading, supabase])

  // Enhanced periodic authentication state check with immediate sync
  useEffect(() => {
    if (!user || loading || isProcessingAuth) return

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && session.user.id !== user.id) {
          console.log('Auth state mismatch detected, forcing immediate sync')
          
          // Force immediate session sync across all tabs
          forceImmediateSessionSync()
          
          // Refresh profile if user exists
          await refreshProfile()
          
          // Force router refresh to update UI immediately
          router.refresh()
        }
      } catch (error) {
        console.error('Error in periodic auth check:', error)
      }
    }, 3000) // Check every 3 seconds for more responsive detection

    return () => clearInterval(interval)
  }, [user, loading, isProcessingAuth, refreshProfile, supabase, router])

  return null // This component doesn't render anything
}