"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import TeamDashboard from "@/components/team-dashboard"

export default function TeamDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userStatus, setUserStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUserStatus() {
      if (!authLoading && user) {
        try {
          const response = await fetch(`/api/team-matching/user-status?user_id=${user.id}`)
          const data = await response.json()
          
          if (data.success) {
            setUserStatus(data.data)
          } else {
            setError(data.error || 'Failed to fetch user status')
          }
        } catch (error) {
          console.error('Error fetching user status:', error)
          setError('Failed to fetch user status')
        } finally {
          setStatusLoading(false)
        }
      } else if (!authLoading && !user) {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }
    
    fetchUserStatus()
  }, [user, authLoading])

  // Show loading state
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  console.log('TeamDashboardPage - userStatus being passed to TeamDashboard:', userStatus)
  return <TeamDashboard userStatus={userStatus} />
}
