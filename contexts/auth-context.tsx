"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-browser"
import { getProfile } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/profile-utils"
import type { Profile } from "@/lib/supabase"
import { useCrossTabAuthSync } from "@/lib/cross-tab-auth-sync"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { broadcastSignIn, broadcastSignOut, broadcastAuthChange, addListener } = useCrossTabAuthSync()
  const router = useRouter()
  const supabase = createClient()

  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        // First try to get existing profile
        let profileData = await getProfile(user.id)
        
        // If no profile exists, try to create one (especially for OAuth users)
        if (!profileData) {
          console.log('No profile found for user, attempting to create one:', user.email)
          profileData = await ensureUserProfile(user)
        }
        
        setProfile(profileData)
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    } else {
      setProfile(null)
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      
      // Sign out from Supabase (this will trigger auth state change)
      await supabase.auth.signOut({ scope: 'global' })
      
      // Broadcast sign-out to other tabs
      broadcastSignOut()
      
      // Clear any remaining session data from localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      // Navigate to homepage without page reload
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signOut fails, clear local state and redirect
      setUser(null)
      setProfile(null)
      // Broadcast sign-out to other tabs even on error
      broadcastSignOut()
      router.push('/')
    }
  }, [supabase, router, broadcastSignOut])

  useEffect(() => {
    let mounted = true
    let refreshInterval: NodeJS.Timeout | null = null

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting initial session:', error)
          setLoading(false)
          return
        }
        
        console.log('Initial session loaded:', session?.user?.id)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id)
            if (mounted) {
              setProfile(profile)
            }
          } catch (error) {
            console.error('Error loading profile:', error)
          }
        } else {
          setProfile(null)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Check if we just came from OAuth callback
    const checkForOAuthCallback = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const hasOAuthParams = urlParams.has('code') || 
                              window.location.hash.includes('access_token') ||
                              document.referrer.includes('/auth/callback')
        
        if (hasOAuthParams) {
          console.log('OAuth callback detected, setting up session refresh')
          // Set up periodic session refresh for OAuth callbacks
          refreshInterval = setInterval(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (session?.user && session.user.id !== user?.id) {
                console.log('New session detected after OAuth, refreshing state')
                setUser(session.user)
                await refreshProfile()
                if (refreshInterval) {
                  clearInterval(refreshInterval)
                  refreshInterval = null
                }
              }
            } catch (error) {
              console.error('Error in OAuth session refresh:', error)
            }
          }, 500) // Check every 500ms for 10 seconds
          
          // Clear interval after 10 seconds
          setTimeout(() => {
            if (refreshInterval) {
              clearInterval(refreshInterval)
              refreshInterval = null
            }
          }, 10000)
        }
      }
    }

    getInitialSession()
    checkForOAuthCallback()

    // Add cross-tab authentication synchronization
    const handleCrossTabAuthEvent = async (event: any) => {
      console.log('Cross-tab auth event:', event)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (event.type === 'SIGN_OUT') {
          if (user) {
            console.log('Sign out detected from another tab')
            setUser(null)
            setProfile(null)
          }
        } else if (event.type === 'SIGN_IN' || event.type === 'AUTH_STATE_CHANGED') {
          if (session?.user && (!user || session.user.id !== user.id)) {
            console.log('Sign in detected from another tab')
            setUser(session.user)
            await refreshProfile()
          } else if (!session?.user && user) {
            console.log('Sign out state detected from another tab')
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('Error handling cross-tab auth event:', error)
      }
    }

    const removeListener = addListener(handleCrossTabAuthEvent)

    // Add window focus listener to refresh auth state when user returns to tab
    const handleWindowFocus = async () => {
      if (!user) {
        console.log('Window focused, checking for auth state changes')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && session.user.id !== user?.id) {
            console.log('New session detected on window focus')
            setUser(session.user)
            await refreshProfile()
          }
        } catch (error) {
          console.error('Error checking auth state on window focus:', error)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus)
    }

    // Listen for auth state changes (simplified)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log("Auth state change:", event, session?.user?.id)

      // Handle explicit sign out events
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing all state')
        setUser(null)
        setProfile(null)
        // Broadcast sign-out to other tabs
        broadcastSignOut()
        if (mounted) {
          setLoading(false)
        }
        return
      }

      // Update user state
      setUser(session?.user ?? null)

      if (session?.user) {
        // Load profile for authenticated user
        try {
          const profile = await getProfile(session.user.id)
          if (mounted) {
            setProfile(profile)
          }
          // Broadcast sign-in to other tabs
          broadcastSignIn(session.user.id)
        } catch (error) {
          console.error('Error loading profile on auth change:', error)
        }
      } else {
        // Clear profile for unauthenticated state
        setProfile(null)
      }
      
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus)
      }
      removeListener()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
