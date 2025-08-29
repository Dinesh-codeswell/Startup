"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'

export function AuthStateHandler() {
  const { user, refreshProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const processedAuthSuccess = useRef(false)

  // Simplified auth state handling - just refresh profile when user becomes available
  useEffect(() => {
    if (user && !loading && !isProcessingAuth && !processedAuthSuccess.current) {
      console.log('User authenticated, refreshing profile...')
      setIsProcessingAuth(true)
      processedAuthSuccess.current = true
      
      refreshProfile().finally(() => {
        setIsProcessingAuth(false)
      })
    }
  }, [user, loading, isProcessingAuth, refreshProfile])

  return null
}