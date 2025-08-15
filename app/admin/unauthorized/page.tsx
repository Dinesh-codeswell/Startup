'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'

export default function AdminUnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const [attemptedUrl, setAttemptedUrl] = useState<string | null>(null)

  useEffect(() => {
    // Get the URL the user was trying to access
    const returnTo = searchParams.get('returnTo')
    if (returnTo) {
      setAttemptedUrl(returnTo)
    }
  }, [searchParams])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            You don't have permission to access the admin dashboard.
          </p>

          {attemptedUrl && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Attempted to access:</span> {attemptedUrl}
              </p>
            </div>
          )}

          {user ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Signed in as: {user.email}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This email address is not authorized for admin access. Only specific email addresses have administrative privileges.
                  </p>
                  <div className="mt-3">
                    <p className="text-xs text-yellow-600">
                      <strong>What you can do:</strong>
                    </p>
                    <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside space-y-1">
                      <li>Contact your system administrator to request admin access</li>
                      <li>Sign in with a different account that has admin privileges</li>
                      <li>Continue using the platform with your current account</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Authentication Required
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You need to sign in with an authorized admin account to access this area.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Admin access is restricted to specific email addresses for security purposes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!user ? (
              <Link
                href={`/login${attemptedUrl ? `?returnTo=${encodeURIComponent(attemptedUrl)}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign In with Admin Account
              </Link>
            ) : (
              <>
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                >
                  Sign Out & Try Different Account
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Go to Profile
                </button>
              </>
            )}
            
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Return to Home
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Need Admin Access?</h4>
              <p className="text-xs text-gray-600 mb-2">
                Admin privileges are required to access team management, user data, and system configuration features.
              </p>
              <p className="text-xs text-gray-500">
                Contact your system administrator to request access or verify your account permissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}