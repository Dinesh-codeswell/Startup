"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { isAuthorizedAdmin } from "@/lib/admin-utils"

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  checkAdminStatus: () => Promise<void>
  error?: string
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const { user, loading: authLoading } = useAuth()

  const checkAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)

      if (!user?.email) {
        setIsAdmin(false)
        return
      }

      // Check if the user's email is in the authorized admin list
      const adminStatus = isAuthorizedAdmin(user.email)
      setIsAdmin(adminStatus)
      
      if (!adminStatus) {
        setError('Email not authorized for admin access')
      }
    } catch (err) {
      console.error('Error checking admin status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check admin status')
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [user?.email])

  // Check admin status when user changes or component mounts
  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus()
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

  const contextValue: AdminContextType = {
    isAdmin,
    isLoading: isLoading || authLoading,
    checkAdminStatus,
    error
  }

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