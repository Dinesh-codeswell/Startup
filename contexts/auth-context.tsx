"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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
  const supabase = createClient()

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

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user.id).then(setProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id)

      setUser(session?.user ?? null)

      if (session?.user) {
        // Handle auth events - only refresh profile when user is signed in
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Give the database trigger a moment to create the profile
          setTimeout(() => {
            getProfile(session.user.id).then(setProfile)
          }, 200)
        } else {
          getProfile(session.user.id).then(setProfile)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
