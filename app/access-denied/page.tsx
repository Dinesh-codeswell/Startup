'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AdminErrorFeedback, AdminErrorPresets } from '@/components/admin/AdminErrorFeedback'
import { useEffect, useState } from 'react'

export default function AccessDeniedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const reason = searchParams.get('reason')
    const message = searchParams.get('message')
    const returnTo = searchParams.get('returnTo')
    const details = searchParams.get('details')

    if (reason === 'admin_required') {
      if (!user) {
        setError({
          ...AdminErrorPresets.notAuthenticated(returnTo || undefined),
          message: message || 'Admin access required'
        })
      } else {
        setError({
          ...AdminErrorPresets.notAuthorized(user.email || undefined),
          message: message || 'Admin privileges required',
          details: details || undefined
        })
      }
    } else {
      // Generic access denied
      setError({
        type: 'permission',
        title: 'Access Denied',
        message: message || 'You do not have permission to access this resource.',
        details: details || undefined,
        userEmail: user?.email,
        action: user ? 'go_back' : 'login',
        actionUrl: user ? undefined : `/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`
      })
    }
  }, [searchParams, user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>

        <AdminErrorFeedback 
          error={error}
          className="mb-8"
        />

        {user && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Additional Options
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
              >
                Sign Out & Try Different Account
              </button>
              
              <Link
                href="/profile"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Need Help?</h4>
            <p className="text-xs text-gray-600 mb-2">
              If you believe you should have access to this resource, please contact your system administrator.
            </p>
            <p className="text-xs text-gray-500">
              Include the URL you were trying to access and your account email in your request.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}