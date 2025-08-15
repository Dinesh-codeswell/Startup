'use client'

import { AlertTriangle, Lock, User, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface AdminError {
  type: 'auth' | 'permission' | 'network' | 'server'
  title: string
  message: string
  details?: string
  action?: 'login' | 'contact_admin' | 'retry' | 'go_back' | 'go_home'
  actionUrl?: string
  userEmail?: string
  timestamp?: string
  requestId?: string
}

interface AdminErrorFeedbackProps {
  error: AdminError
  onRetry?: () => void
  className?: string
}

export function AdminErrorFeedback({ error, onRetry, className = '' }: AdminErrorFeedbackProps) {
  const router = useRouter()

  const getIcon = () => {
    switch (error.type) {
      case 'auth':
        return <User className="h-8 w-8" />
      case 'permission':
        return <Lock className="h-8 w-8" />
      case 'network':
        return <RefreshCw className="h-8 w-8" />
      case 'server':
        return <AlertTriangle className="h-8 w-8" />
      default:
        return <AlertTriangle className="h-8 w-8" />
    }
  }

  const getIconColor = () => {
    switch (error.type) {
      case 'auth':
        return 'text-blue-600'
      case 'permission':
        return 'text-red-600'
      case 'network':
        return 'text-yellow-600'
      case 'server':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getBgColor = () => {
    switch (error.type) {
      case 'auth':
        return 'bg-blue-50 border-blue-200'
      case 'permission':
        return 'bg-red-50 border-red-200'
      case 'network':
        return 'bg-yellow-50 border-yellow-200'
      case 'server':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (error.type) {
      case 'auth':
        return 'text-blue-800'
      case 'permission':
        return 'text-red-800'
      case 'network':
        return 'text-yellow-800'
      case 'server':
        return 'text-orange-800'
      default:
        return 'text-gray-800'
    }
  }

  const handleAction = () => {
    switch (error.action) {
      case 'login':
        router.push(error.actionUrl || '/login')
        break
      case 'retry':
        onRetry?.()
        break
      case 'go_back':
        router.back()
        break
      case 'go_home':
        router.push('/')
        break
      default:
        break
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getBgColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {error.title}
          </h3>
          <p className={`mt-1 text-sm ${getTextColor().replace('800', '700')}`}>
            {error.message}
          </p>
          
          {error.details && (
            <div className={`mt-2 text-xs ${getTextColor().replace('800', '600')}`}>
              <details className="cursor-pointer">
                <summary className="hover:underline">Show details</summary>
                <div className="mt-1 p-2 bg-white bg-opacity-50 rounded text-xs font-mono">
                  {error.details}
                </div>
              </details>
            </div>
          )}

          {error.userEmail && (
            <p className={`mt-2 text-xs ${getTextColor().replace('800', '600')}`}>
              <span className="font-medium">Current account:</span> {error.userEmail}
            </p>
          )}

          {(error.timestamp || error.requestId) && (
            <div className={`mt-2 text-xs ${getTextColor().replace('800', '500')} space-y-1`}>
              {error.timestamp && (
                <p><span className="font-medium">Time:</span> {new Date(error.timestamp).toLocaleString()}</p>
              )}
              {error.requestId && (
                <p><span className="font-medium">Request ID:</span> {error.requestId}</p>
              )}
            </div>
          )}

          {error.action && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleAction}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                  error.type === 'auth' 
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : error.type === 'permission'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : error.type === 'network'
                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                    : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                {error.action === 'login' && <User className="h-3 w-3 mr-1" />}
                {error.action === 'retry' && <RefreshCw className="h-3 w-3 mr-1" />}
                {error.action === 'go_back' && <ArrowLeft className="h-3 w-3 mr-1" />}
                {error.action === 'go_home' && <Home className="h-3 w-3 mr-1" />}
                {error.action === 'login' && 'Sign In'}
                {error.action === 'retry' && 'Try Again'}
                {error.action === 'go_back' && 'Go Back'}
                {error.action === 'go_home' && 'Go Home'}
                {error.action === 'contact_admin' && 'Contact Admin'}
              </button>
              
              {error.action !== 'go_home' && (
                <Link
                  href="/"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <Home className="h-3 w-3 mr-1" />
                  Home
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Predefined error configurations for common scenarios
export const AdminErrorPresets = {
  notAuthenticated: (returnUrl?: string): AdminError => ({
    type: 'auth',
    title: 'Authentication Required',
    message: 'You need to sign in to access admin features.',
    details: 'Admin access requires authentication with an authorized account.',
    action: 'login',
    actionUrl: `/login${returnUrl ? `?returnTo=${encodeURIComponent(returnUrl)}` : ''}`
  }),

  notAuthorized: (userEmail?: string): AdminError => ({
    type: 'permission',
    title: 'Access Denied',
    message: 'You do not have permission to access this admin feature.',
    details: 'Admin access is restricted to specific authorized email addresses. Contact your system administrator if you believe this is an error.',
    userEmail,
    action: 'contact_admin'
  }),

  sessionExpired: (returnUrl?: string): AdminError => ({
    type: 'auth',
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    details: 'For security reasons, admin sessions expire after a period of inactivity.',
    action: 'login',
    actionUrl: `/login${returnUrl ? `?returnTo=${encodeURIComponent(returnUrl)}` : ''}`
  }),

  networkError: (): AdminError => ({
    type: 'network',
    title: 'Connection Error',
    message: 'Unable to verify admin permissions due to a network error.',
    details: 'Please check your internet connection and try again.',
    action: 'retry'
  }),

  serverError: (requestId?: string): AdminError => ({
    type: 'server',
    title: 'Server Error',
    message: 'An error occurred while verifying admin access.',
    details: 'The server encountered an unexpected error. Please try again or contact support if the problem persists.',
    requestId,
    action: 'retry'
  })
}