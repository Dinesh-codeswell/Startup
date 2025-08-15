'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminError, AdminErrorPresets } from '@/components/admin/AdminErrorFeedback'

interface UseAdminErrorHandlerReturn {
  error: AdminError | null
  setError: (error: AdminError | null) => void
  handleApiError: (response: Response, requestId?: string) => Promise<void>
  handleNetworkError: (error: Error) => void
  clearError: () => void
  retryLastAction: () => void
}

export function useAdminErrorHandler(): UseAdminErrorHandlerReturn {
  const [error, setError] = useState<AdminError | null>(null)
  const [lastAction, setLastAction] = useState<(() => void) | null>(null)
  const router = useRouter()

  const handleApiError = useCallback(async (response: Response, requestId?: string) => {
    try {
      const errorData = await response.json()
      
      switch (response.status) {
        case 401:
          if (errorData.code === 'UNAUTHENTICATED') {
            setError({
              ...AdminErrorPresets.notAuthenticated(window.location.pathname),
              details: errorData.details || errorData.message,
              timestamp: errorData.timestamp,
              requestId: errorData.requestId || requestId
            })
          } else {
            setError({
              ...AdminErrorPresets.sessionExpired(window.location.pathname),
              details: errorData.details || errorData.message,
              timestamp: errorData.timestamp,
              requestId: errorData.requestId || requestId
            })
          }
          break
          
        case 403:
          setError({
            ...AdminErrorPresets.notAuthorized(),
            details: errorData.details || errorData.message,
            timestamp: errorData.timestamp,
            requestId: errorData.requestId || requestId
          })
          break
          
        case 500:
          setError({
            ...AdminErrorPresets.serverError(errorData.requestId || requestId),
            details: errorData.details || errorData.message,
            timestamp: errorData.timestamp
          })
          break
          
        default:
          setError({
            type: 'server',
            title: 'Unexpected Error',
            message: errorData.message || 'An unexpected error occurred.',
            details: errorData.details,
            timestamp: errorData.timestamp,
            requestId: errorData.requestId || requestId,
            action: 'retry'
          })
      }
    } catch (parseError) {
      // If we can't parse the error response, show a generic error
      setError({
        ...AdminErrorPresets.serverError(requestId),
        details: `HTTP ${response.status}: ${response.statusText}`
      })
    }
  }, [])

  const handleNetworkError = useCallback((networkError: Error) => {
    setError({
      ...AdminErrorPresets.networkError(),
      details: `Network error: ${networkError.message}`
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setLastAction(null)
  }, [])

  const retryLastAction = useCallback(() => {
    if (lastAction) {
      clearError()
      lastAction()
    }
  }, [lastAction, clearError])

  // Enhanced setError that can store retry actions
  const setErrorWithRetry = useCallback((newError: AdminError | null, retryAction?: () => void) => {
    setError(newError)
    if (retryAction) {
      setLastAction(() => retryAction)
    }
  }, [])

  return {
    error,
    setError: setErrorWithRetry,
    handleApiError,
    handleNetworkError,
    clearError,
    retryLastAction
  }
}

// Helper function to create admin-protected API calls
export function createAdminApiCall<T = any>(
  url: string,
  options: RequestInit = {},
  errorHandler?: UseAdminErrorHandlerReturn
) {
  return async (): Promise<T> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        if (errorHandler) {
          await errorHandler.handleApiError(response)
          throw new Error('Admin API call failed')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      return await response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error
        if (errorHandler) {
          errorHandler.handleNetworkError(error)
        }
        throw error
      } else {
        // Re-throw other errors
        throw error
      }
    }
  }
}

// Hook for making admin API calls with built-in error handling
export function useAdminApiCall<T = any>(
  url: string,
  options: RequestInit = {}
) {
  const errorHandler = useAdminErrorHandler()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    errorHandler.clearError()
    
    try {
      const apiCall = createAdminApiCall<T>(url, options, errorHandler)
      const result = await apiCall()
      setData(result)
      return result
    } catch (error) {
      // Error is already handled by errorHandler
      throw error
    } finally {
      setLoading(false)
    }
  }, [url, options, errorHandler])

  // Store the execute function as the retry action
  const executeWithRetry = useCallback(async () => {
    errorHandler.setError(null, execute)
    return execute()
  }, [execute, errorHandler])

  return {
    ...errorHandler,
    loading,
    data,
    execute: executeWithRetry
  }
}