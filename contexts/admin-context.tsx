"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "./auth-context"
import { isAuthorizedAdmin } from "@/lib/admin-utils"

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  checkAdminStatus: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
  error?: string
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const { user, loading: authLoading } = useAuth()

  const checkAdminStatus = useCallback(async () => {
    if (!user?.email || authLoading) {
      console.log('AdminContext: No user email or auth loading, resetting admin status')
      setIsAdmin(false)
      setError(undefined)
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      console.log('AdminContext: Validating admin session for email:', user.email)
      
      // Use the session validation endpoint for more reliable checking
      const response = await fetch('/api/admin/validate-session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('AdminContext: Session validation failed - unauthorized')
          setIsAdmin(false)
          setError('Session expired or invalid')
          return
        }
        throw new Error(`Validation failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('AdminContext: Session validation result:', result)
      
      setIsAdmin(result.isAdmin || false)
      
      if (!result.isAdmin) {
        console.log('AdminContext: User not authorized for admin access:', user.email)
      }
    } catch (err) {
      console.error('AdminContext: Error validating admin session:', err)
      
      // Fallback to client-side check if API fails
      console.log('AdminContext: Falling back to client-side admin check')
      const authorized = isAuthorizedAdmin(user.email)
      setIsAdmin(authorized)
      
      if (!authorized) {
        setError('Failed to verify admin status')
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.email, authLoading])

  // Check admin status when user changes or component mounts
  useEffect(() => {
    if (!authLoading && user?.email) {
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        checkAdminStatus()
      }, 100)
      
      return () => clearTimeout(timer)
    } else if (!authLoading && !user) {
      // User is not authenticated, reset admin status immediately
      setIsAdmin(false)
      setError(undefined)
      setIsLoading(false)
    }
  }, [user?.email, authLoading, checkAdminStatus])

  // Reset admin status when user logs out
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setError(undefined)
      setIsLoading(false)
    }
  }, [user])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: AdminContextType = useMemo(() => ({
    isAdmin,
    isLoading: isLoading || authLoading,
    checkAdminStatus,
    refreshAdminStatus: checkAdminStatus,
    error
  }), [isAdmin, isLoading, authLoading, checkAdminStatus, error])

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
