"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-browser"
import { getProfile } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/profile-utils"
import { useSessionSync, broadcastSessionEvent, forceImmediateSessionSync, getCurrentSessionState } from "@/lib/session-sync"
import type { Profile } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      // First try to get existing profile
      let profileData = await getProfile(user.id)
      
      // If no profile exists, try to create one (especially for OAuth users)
      if (!profileData) {
        console.log('No profile found for user, attempting to create one:', user.email)
        profileData = await ensureUserProfile(user)
      }
      
      setProfile(profileData)
    }
  }, [user])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Broadcast signout to other tabs
    broadcastSessionEvent('signout')
  }, [supabase])

  useEffect(() => {
    // Get initial session with enhanced loading state management
    const getInitialSession = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting initial session:', error)
          // Retry after a short delay
          setTimeout(() => getInitialSession(), 1000)
          return
        }
        
        console.log('Initial session loaded:', session?.user?.id)
        
        // Set user state first
        const newUser = session?.user ?? null
        setUser(newUser)
        
        // Handle profile loading
        if (newUser) {
          try {
            const profile = await getProfile(newUser.id)
            setProfile(profile)
          } catch (profileError) {
            console.error('Error loading profile:', profileError)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        // Only set loading to false after everything is complete
        setLoading(false)
        setInitialLoadComplete(true)
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setLoading(false)
        setInitialLoadComplete(true)
      }
    }

    getInitialSession()

    // Enhanced cross-tab synchronization using storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sb-') && e.key.includes('auth-token')) {
        console.log('Auth token changed in another tab, refreshing session immediately')
        // Force immediate session refresh when auth token changes
        getInitialSession()
      }
    }

    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }

    // Enhanced session sync for cross-tab communication
    const unsubscribeSessionSync = useSessionSync((event) => {
      console.log('Session sync event received:', event)
      
      if (event === 'signout') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else if (event === 'signin' || event === 'token_refresh') {
        // Force immediate session refresh when signin/refresh detected
        console.log('Forcing immediate session refresh due to sync event')
        getInitialSession()
      }
    })

    // Listen for auth changes with enhanced handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id)

      // Only process auth changes after initial load is complete
      if (!initialLoadComplete && event !== 'INITIAL_SESSION') {
        return
      }

      // Set loading state for auth changes (but not initial load)
      if (initialLoadComplete) {
        setLoading(true)
      }

      // Update user state immediately
      const newUser = session?.user ?? null
      setUser(newUser)

      if (newUser) {
        // Broadcast signin to other tabs for new sessions
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          broadcastSessionEvent('signin')
          // Force immediate sync across all tabs
          forceImmediateSessionSync()
        }
        
        // Handle auth events - refresh profile for all events
        try {
          const profile = await getProfile(newUser.id)
          setProfile(profile)
        } catch (error) {
          console.error('Error refreshing profile on auth change:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
        // Force immediate sync when user signs out
        if (event === 'SIGNED_OUT') {
          forceImmediateSessionSync()
        }
      }
      
      // Only set loading to false after everything is processed
      if (initialLoadComplete) {
        setLoading(false)
      }
    })

    // Note: Auth success handling is now managed by AuthStateHandler component
    // to prevent duplicate processing and race conditions

    return () => {
      subscription.unsubscribe()
      unsubscribeSessionSync()
      // Clean up storage event listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [user, profile, loading, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
