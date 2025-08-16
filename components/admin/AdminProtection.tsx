"use client"

import type React from "react"
import { ComponentType, useEffect, useState } from "react"
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
  const { isAdmin, isLoading, error, checkAdminStatus } = useAdmin()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const maxRetries = 3
  const totalLoading = isLoading || authLoading || isRetrying

  // Enhanced admin status check with retry logic and session refresh
  useEffect(() => {
    if (!totalLoading && !hasRedirected && user && !isAdmin && retryCount < maxRetries) {
      // If user is authenticated but not admin, retry checking admin status
      // This helps with timing issues where the session might not be fully established
      console.log(`AdminProtection: Retrying admin status check (attempt ${retryCount + 1}/${maxRetries})`, {
        userEmail: user.email,
        isAdmin,
        error
      })
      
      setIsRetrying(true)
      const timer = setTimeout(async () => {
        try {
          // Try session refresh on the last attempt
          if (retryCount === maxRetries - 1) {
            console.log('AdminProtection: Attempting session refresh on final retry')
            try {
              const refreshResponse = await fetch('/api/admin/validate-session', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              
              if (refreshResponse.ok) {
                const refreshResult = await refreshResponse.json()
                console.log('AdminProtection: Session refresh result:', refreshResult)
              }
            } catch (refreshError) {
              console.error('AdminProtection: Session refresh failed:', refreshError)
            }
          }
          
          if (checkAdminStatus) {
            await checkAdminStatus()
          }
          setRetryCount(prev => prev + 1)
        } catch (error) {
          console.error('AdminProtection: Error during retry:', error)
          setRetryCount(prev => prev + 1)
        } finally {
          setIsRetrying(false)
        }
      }, 1000 * (retryCount + 1)) // Exponential backoff: 1s, 2s, 3s
      
      return () => clearTimeout(timer)
    }
  }, [user, isAdmin, totalLoading, hasRedirected, retryCount, checkAdminStatus, error])

  useEffect(() => {
    // If not loading and user is not authenticated, redirect to login
    if (!authLoading && !user && redirectTo && !hasRedirected) {
      // Get current URL to preserve as return URL
      const currentUrl = window.location.pathname + window.location.search
      const loginUrl = `${redirectTo}?returnTo=${encodeURIComponent(currentUrl)}&reason=admin_required&message=${encodeURIComponent('Admin access required')}`
      console.log('AdminProtection: Redirecting to login:', loginUrl)
      setHasRedirected(true)
      router.push(loginUrl)
    }
  }, [user, authLoading, redirectTo, router, hasRedirected])

  // Show loading state while checking authentication and admin status
  if (totalLoading) {
    const loadingText = isRetrying 
      ? `Verifying admin access... (${retryCount + 1}/${maxRetries})`
      : loadingMessage
      
    return (
      <AdminLoadingState 
        message={loadingText} 
        showRetryInfo={isRetrying}
      />
    )
  }

  // Show error state if there's an error and showError is true
  if (error && showError && retryCount >= maxRetries) {
    return <AdminErrorState error={error} />
  }

  // If user is not authenticated, show fallback or redirect
  if (!user) {
    if (redirectTo) {
      return <AdminLoadingState />
    }
    return <>{fallback}</>
  }

  // If user is authenticated but not admin, show access denied (only after retries)
  if (!isAdmin && retryCount >= maxRetries) {
    return <>{fallback}</>
  }

  // If still retrying, show loading
  if (!isAdmin && retryCount < maxRetries) {
    return (
      <AdminLoadingState 
        message={`Verifying admin access... (${retryCount + 1}/${maxRetries})`}
        showRetryInfo={true}
      />
    )
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
function AdminLoadingState({ 
  message = "Verifying admin access...", 
  showRetryInfo = false 
}: { 
  message?: string
  showRetryInfo?: boolean
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">{message}</p>
        {showRetryInfo && (
          <p className="text-sm text-gray-500 mt-2">
            Ensuring session is properly established...
          </p>
        )}
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
