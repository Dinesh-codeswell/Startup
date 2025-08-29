"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-browser"
import { getProfile } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/profile-utils"
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
      router.push('/')
    }
  }, [supabase, router])

  useEffect(() => {
    let mounted = true

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

    getInitialSession()

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
