"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-browser"
import { getProfile } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/profile-utils"
import { useSessionSync, broadcastSessionEvent } from "@/lib/session-sync"
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
    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting initial session:', error)
          // Retry after a short delay
          setTimeout(() => getInitialSession(), 1000)
          return
        }
        
        console.log('Initial session loaded:', session?.user?.id)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profile = await getProfile(session.user.id)
          setProfile(profile)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Simplified cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sb-') && e.key.includes('auth-token')) {
        console.log('Auth token changed in another tab, refreshing session')
        getInitialSession()
      }
    }

    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }

    // Session sync for cross-tab communication
    const unsubscribeSessionSync = useSessionSync((event) => {
      console.log('Session sync event received:', event)
      
      if (event === 'signout') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else if (event === 'signin' || event === 'token_refresh') {
        // Refresh session when signin/refresh detected in another tab
        getInitialSession()
      }
    })

    // Listen for auth changes with enhanced handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id)

      // Update state immediately
      setUser(session?.user ?? null)

      if (session?.user) {
        // Broadcast signin to other tabs for new sessions
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          broadcastSessionEvent('signin')
        }
        
        // Refresh profile
        try {
          const profile = await getProfile(session.user.id)
          setProfile(profile)
        } catch (error) {
          console.error('Error refreshing profile on auth change:', error)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
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
