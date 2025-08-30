'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase-browser'
import type { TeamMatchingStats, TeamMatchingSubmission, TeamWithMembers } from '@/lib/types/team-matching'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface TeamMatchingDashboardProps {
  className?: string
}

export function TeamMatchingDashboard({ className }: TeamMatchingDashboardProps) {
  const [stats, setStats] = useState<TeamMatchingStats | null>(null)
  const [submissions, setSubmissions] = useState<TeamMatchingSubmission[]>([])
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [formingTeams, setFormingTeams] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDashboardData()
    setupRealTimeSubscriptions()
    
    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load stats
      const statsResponse = await fetch('/api/team-matching/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // Load truly unmatched participants (not in any team)
      const submissionsResponse = await fetch('/api/team-matching/unmatched-submissions')
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        const unmatchedSubmissions = submissionsData.data || []
        setSubmissions(unmatchedSubmissions)
        console.log(`Loaded ${unmatchedSubmissions.length} truly unmatched participants for dashboard`)
        console.log(`Total submissions: ${submissionsData.meta?.totalSubmissions}, Matched: ${submissionsData.meta?.matched}`)
      }

      // TODO: Load recent teams
      // const teamsResponse = await fetch('/api/team-matching/teams?limit=10')
      // if (teamsResponse.ok) {
      //   const teamsData = await teamsResponse.json()
      //   setTeams(teamsData.data)
      // }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    try {
      // Create a channel for real-time updates
      const channel = supabase
        .channel('admin-dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'team_matching_submissions'
          },
          (payload) => {
            console.log('Real-time update received:', payload)
            // Refresh dashboard data when submissions change
            loadDashboardData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public', 
            table: 'teams'
          },
          (payload) => {
            console.log('Team update received:', payload)
            // Refresh dashboard data when teams change
            loadDashboardData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          (payload) => {
            console.log('Team members update received:', payload)
            // Refresh dashboard data when team membership changes
            loadDashboardData()
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status)
          setIsRealTimeConnected(status === 'SUBSCRIBED')
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time updates connected')
            // Clear polling if real-time is working
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('❌ Real-time connection failed, falling back to polling')
            setupPollingFallback()
          }
        })

      channelRef.current = channel
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error)
      setupPollingFallback()
    }
  }

  const setupPollingFallback = () => {
    // Set up polling as fallback (every 30 seconds)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for updates...')
      loadDashboardData()
    }, 30000) // Poll every 30 seconds
  }

  const handleFormTeams = async () => {
    try {
      setFormingTeams(true)
      setError(null)

      const response = await fetch('/api/team-matching/form-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxTeamSize: 4,
          minTeamSize: 2
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Team formation result:', data)
        
        // Show success message
        if (data.data) {
          const { teamsFormed, participantsMatched, participantsUnmatched, totalParticipants, previouslyMatched } = data.data
          alert(`✅ Team Formation Successful!\n\n• New teams formed: ${teamsFormed}\n• Participants newly matched: ${participantsMatched}\n• Participants still unmatched: ${participantsUnmatched}\n• Total processed: ${totalParticipants}\n• Previously matched: ${previouslyMatched || 0}\n\nDashboard will refresh to show updated data.`)
        }
        
        // Reload dashboard data
        await loadDashboardData()
        setError('')
      } else {
        console.error('Team formation error:', data)
        setError(data.error || 'Failed to form teams')
      }

    } catch (error) {
      console.error('Error forming teams:', error)
      setError('Failed to form teams')
    } finally {
      setFormingTeams(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending_match': 'bg-yellow-100 text-yellow-800',
      'matched': 'bg-blue-100 text-blue-800',
      'team_formed': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Team Matching Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isRealTimeConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isRealTimeConnected ? 'Live Updates' : 'Polling Mode'}
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={async () => {
              try {
                const response = await fetch('/api/team-matching/test-data', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'create' })
                })
                const data = await response.json()
                if (data.success) {
                  alert(`Created ${data.data.created} test submissions`)
                  await loadDashboardData()
                } else {
                  alert(`Error: ${data.error}`)
                }
              } catch (error) {
                alert('Failed to create test data')
              }
            }}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
          >
            Add Test Data
          </Button>
          <Button 
            onClick={handleFormTeams}
            disabled={formingTeams || (submissions.length === 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {formingTeams ? 'Forming Teams...' : `Form Teams (${submissions.length} unmatched)`}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total_submissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{submissions.length}</div>
              <div className="text-xs text-gray-500 mt-1">In Recent Submissions</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Teams Formed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_teams}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Matched Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.matched_submissions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No pending submissions found</p>
                <p className="text-gray-600 mb-4">There are currently no participants waiting to be matched into teams.</p>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/team-matching/test-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'create' })
                      })
                      const data = await response.json()
                      if (data.success) {
                        alert(`Created ${data.data.created} test submissions`)
                        await loadDashboardData()
                      } else {
                        alert(`Error: ${data.error}`)
                      }
                    } catch (error) {
                      alert('Failed to create test data')
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Test Submissions
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">College</th>
                    <th className="text-left py-2">Year</th>
                    <th className="text-left py-2">Team Size</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 15).map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{submission.full_name}</td>
                      <td className="py-2 text-sm text-gray-600">{submission.email}</td>
                      <td className="py-2 text-gray-600">{submission.college_name}</td>
                      <td className="py-2">{submission.current_year}</td>
                      <td className="py-2">{submission.preferred_team_size}</td>
                      <td className="py-2">
                        {submission.user_id ? (
                          <Badge className="bg-blue-100 text-blue-800">Form</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">CSV</Badge>
                        )}
                      </td>
                      <td className="py-2">{getStatusBadge(submission.status)}</td>
                      <td className="py-2 text-gray-500">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {submissions.length > 15 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    View All {submissions.length} Submissions
                  </Button>
                </div>
              )}
              
              {/* Show CSV participants separately if any */}
              {submissions.filter(s => !s.user_id).length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">
                    📄 CSV Imported Participants ({submissions.filter(s => !s.user_id).length})
                  </h4>
                  <p className="text-sm text-orange-700 mb-3">
                    These participants were imported from CSV files and don't have user accounts. 
                    They can be matched into teams or contacted directly via email/WhatsApp.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {submissions.filter(s => !s.user_id).slice(0, 6).map((submission) => (
                      <div key={submission.id} className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">{submission.full_name}</div>
                        <div className="text-sm text-gray-600">{submission.email}</div>
                        <div className="text-sm text-gray-600">{submission.college_name}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {getStatusBadge(submission.status)}
                          <span className="text-xs text-gray-500">
                            Team size: {submission.preferred_team_size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {submissions.filter(s => !s.user_id).length > 6 && (
                    <div className="mt-3 text-center">
                      <Button variant="outline" size="sm">
                        View All {submissions.filter(s => !s.user_id).length} CSV Participants
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/case-match', '_blank')}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV Team Matching
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/team-matching/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'process' })
                  })
                  const data = await response.json()
                  if (data.success) {
                    alert(`Processed ${data.data.processed} notifications: ${data.data.successful} sent, ${data.data.failed} failed`)
                  }
                } catch (error) {
                  alert('Failed to process notifications')
                }
              }}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Notifications
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/team-change-requests', '_blank')}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Change Requests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/issues-raised', '_blank')}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Issues Raised
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('/team-dashboard', '_blank')}
              className="justify-start"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Team Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}