"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export function AuthStateHandler() {
  const { user, refreshProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const processedAuthSuccess = useRef(false)
  const supabase = createClient()

  // Handle auth success from URL parameters (OAuth callback)
  useEffect(() => {
    const handleAuthSuccess = async () => {
      const authSuccess = searchParams.get('auth_success')
      
      if (authSuccess && !processedAuthSuccess.current && !loading && !isProcessingAuth) {
        console.log('Processing auth success...')
        setIsProcessingAuth(true)
        processedAuthSuccess.current = true
        
        try {
          // Clean up URL parameters
          const cleanUrl = new URL(window.location.href)
          cleanUrl.searchParams.delete('auth_success')
          cleanUrl.searchParams.delete('auth_callback')
          cleanUrl.searchParams.delete('redirect_to')
          window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search)
          
          // Refresh profile if user is authenticated
          if (user) {
            await refreshProfile()
            console.log('Auth success processed, profile refreshed')
          }
          
          // Single router refresh to update UI
          router.refresh()
        } catch (error) {
          console.error('Error processing auth success:', error)
        } finally {
          setIsProcessingAuth(false)
        }
      }
    }

    if (!loading) {
      handleAuthSuccess()
    }
  }, [user, refreshProfile, router, loading, searchParams, isProcessingAuth, supabase])

  // Handle visibility change for tab switching
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user && !isProcessingAuth && !loading) {
        console.log('Tab became visible, refreshing auth state...')
        try {
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

  return null // This component doesn't render anything
}