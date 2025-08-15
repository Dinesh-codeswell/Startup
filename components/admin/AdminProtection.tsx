"use client"

import type React from "react"
import { ComponentType, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/contexts/admin-context"
import { useAuth } from "@/contexts/auth-context"

interface AdminProtectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  loadingMessage?: string
  showError?: boolean
}

/**
 * Component that protects its children by requiring admin access
 */
export function AdminProtection({ 
  children, 
  fallback = <AdminAccessDenied />, 
  redirectTo,
  loadingMessage = "Verifying admin access...",
  showError = true
}: AdminProtectionProps) {
  const { isAdmin, isLoading, error } = useAdmin()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and user is not authenticated, redirect to login
    if (!authLoading && !user && redirectTo) {
      router.push(redirectTo)
    }
  }, [user, authLoading, redirectTo, router])

  // Show loading state while checking authentication and admin status
  if (isLoading || authLoading) {
    return <AdminLoadingState message={loadingMessage} />
  }

  // Show error state if there's an error and showError is true
  if (error && showError) {
    return <AdminErrorState error={error} />
  }

  // If user is not authenticated, show fallback or redirect
  if (!user) {
    if (redirectTo) {
      return <AdminLoadingState />
    }
    return <>{fallback}</>
  }

  // If user is authenticated but not admin, show access denied
  if (!isAdmin) {
    return <>{fallback}</>
  }

  // User is authenticated and is admin, show protected content
  return <>{children}</>
}

/**
 * Higher-order component for admin route protection
 */
export function withAdminProtection<T extends object>(
  Component: ComponentType<T>,
  options: {
    fallback?: React.ReactNode
    redirectTo?: string
    loadingMessage?: string
    showError?: boolean
  } = {}
): ComponentType<T> {
  const ProtectedComponent = (props: T) => {
    return (
      <AdminProtection 
        fallback={options.fallback} 
        redirectTo={options.redirectTo}
        loadingMessage={options.loadingMessage}
        showError={options.showError}
      >
        <Component {...props} />
      </AdminProtection>
    )
  }

  ProtectedComponent.displayName = `withAdminProtection(${Component.displayName || Component.name})`
  
  return ProtectedComponent
}

/**
 * Loading state component for admin checks
 */
function AdminLoadingState({ message = "Verifying admin access..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">{message}</p>
        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error state component for admin check failures
 */
function AdminErrorState({ error }: { error: string }) {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4">
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-4">
          There was an error verifying your admin access:
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Access denied component for non-admin users
 */
function AdminAccessDenied() {
  const router = useRouter()
  
  // Redirect to the custom unauthorized page
  useEffect(() => {
    router.push('/admin/unauthorized')
  }, [router])

  // Show loading state while redirecting
  return <AdminLoadingState />
}