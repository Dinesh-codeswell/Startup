"use client"

import { useAdmin } from "@/contexts/admin-context"
import { useAuth } from "@/contexts/auth-context"
import { useCallback, useMemo } from "react"

/**
 * Hook for checking admin permissions and providing admin-related utilities
 */
export function useAdminPermissions() {
  const { isAdmin, isLoading: adminLoading, error: adminError, checkAdminStatus } = useAdmin()
  const { user, loading: authLoading } = useAuth()

  // Combined loading state
  const isLoading = useMemo(() => adminLoading || authLoading, [adminLoading, authLoading])

  // Check if user has admin access
  const hasAdminAccess = useMemo(() => {
    return !isLoading && isAdmin
  }, [isLoading, isAdmin])

  // Check if user is authenticated but not admin
  const isAuthenticatedNonAdmin = useMemo(() => {
    return !isLoading && !!user && !isAdmin
  }, [isLoading, user, isAdmin])

  // Check if user is not authenticated
  const isUnauthenticated = useMemo(() => {
    return !isLoading && !user
  }, [isLoading, user])

  // Refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    await checkAdminStatus()
  }, [checkAdminStatus])

  // Get admin status with detailed information
  const getAdminStatus = useCallback(() => {
    if (isLoading) {
      return {
        status: 'loading' as const,
        message: 'Checking admin permissions...'
      }
    }

    if (!user) {
      return {
        status: 'unauthenticated' as const,
        message: 'Please log in to continue'
      }
    }

    if (isAdmin) {
      return {
        status: 'admin' as const,
        message: 'Admin access granted',
        email: user.email
      }
    }

    return {
      status: 'unauthorized' as const,
      message: adminError || 'Admin access required',
      email: user.email
    }
  }, [isLoading, user, isAdmin, adminError])

  // Check if current user can access specific admin features
  const canAccess = useCallback((feature?: string) => {
    // For now, all admin features require the same level of access
    // This can be extended in the future for role-based permissions
    return hasAdminAccess
  }, [hasAdminAccess])

  // Get redirect URL for unauthorized users
  const getRedirectUrl = useCallback((returnTo?: string) => {
    if (isUnauthenticated) {
      const loginUrl = '/login'
      return returnTo ? `${loginUrl}?returnTo=${encodeURIComponent(returnTo)}` : loginUrl
    }
    
    if (isAuthenticatedNonAdmin) {
      return '/not-found' // or a custom access denied page
    }

    return null
  }, [isUnauthenticated, isAuthenticatedNonAdmin])

  return {
    // Status flags
    isAdmin,
    isLoading,
    hasAdminAccess,
    isAuthenticatedNonAdmin,
    isUnauthenticated,
    
    // User information
    user,
    adminError,
    
    // Functions
    refreshAdminStatus,
    getAdminStatus,
    canAccess,
    getRedirectUrl,
    
    // Detailed status
    status: getAdminStatus()
  }
}