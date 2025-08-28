'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, User, Calendar, MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface IssueReport {
  id: string
  userId: string
  userName: string
  userEmail: string
  teamId: string
  teamName: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  adminResponse?: string
  adminId?: string
  createdAt: string
  updatedAt: string
}

function IssuesRaisedPage() {
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [newPriority, setNewPriority] = useState('')
  const [updating, setUpdating] = useState(false)
  const [confirmUpdate, setConfirmUpdate] = useState<{issueId: string, updates: any} | null>(null)

  useEffect(() => {
    fetchIssues()
  }, [statusFilter, priorityFilter])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }
      
      const response = await fetch(`/api/issue-report?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setIssues(data.data)
      } else {
        console.error('Failed to fetch issues:', data.error)
      }
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateIssue = async (issueId: string, updates: any) => {
    try {
      setUpdating(true)
      const updateResponse = await fetch('/api/issue-report', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId,
          ...updates
        })
      })

      const data = await updateResponse.json()
      
      if (data.success) {
        await fetchIssues()
        setSelectedIssue(null)
        setAdminResponse('')
        setNewStatus('')
        setNewPriority('')
        // Refresh the page to show updates
        window.location.reload()
      } else {
        console.error('Failed to update issue:', data.error)
      }
    } catch (error) {
      console.error('Error updating issue:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || AlertTriangle
    
    return (
      <Badge className={`${config?.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-blue-100 text-blue-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      urgent: { color: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    
    return (
      <Badge className={`${config?.color} flex items-center gap-1`}>
        <Flag size={12} />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const filteredIssues = issues.filter(issue => {
    const statusMatch = statusFilter === 'all' || issue.status === statusFilter
    const priorityMatch = priorityFilter === 'all' || issue.priority === priorityFilter
    return statusMatch && priorityMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ChevronLeft size={20} />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Issues Raised</h1>
                <p className="text-gray-600">Manage user-reported issues and support requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 self-center">Status:</span>
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                size="sm"
                className="capitalize"
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 self-center">Priority:</span>
            {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? 'default' : 'outline'}
                onClick={() => setPriorityFilter(priority)}
                size="sm"
                className="capitalize"
              >
                {priority === 'all' ? 'All' : priority}
              </Button>
            ))}
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading issues...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
              <p className="text-gray-600">No issues match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-900">{issue.userName}</span>
                          <span className="text-gray-500">({issue.userEmail})</span>
                        </div>
                        {getStatusBadge(issue.status)}
                        {getPriorityBadge(issue.priority)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Subject</p>
                          <p className="font-medium">{issue.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Team</p>
                          <p className="font-medium">{issue.teamName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reported</p>
                          <p className="font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Description</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{issue.description}</p>
                      </div>
                      
                      {issue.adminResponse && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Admin Response</p>
                          <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            {issue.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue)
                          setNewStatus(issue.status)
                          setNewPriority(issue.priority)
                        }}
                        variant="outline"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Management Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Manage Issue</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedIssue.userName} ({selectedIssue.userEmail})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{selectedIssue.teamName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{selectedIssue.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedIssue.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Response
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Add a response to the user..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIssue(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setConfirmUpdate({
                    issueId: selectedIssue.id,
                    updates: {
                      status: newStatus,
                      priority: newPriority,
                      adminResponse: adminResponse || undefined
                    }
                  })}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Issue'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {confirmUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Issue Update
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to update this issue? This will change the status and/or priority, and may send notifications to the user.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmUpdate(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateIssue(confirmUpdate.issueId, confirmUpdate.updates)
                    setConfirmUpdate(null)
                  }}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? 'Updating...' : 'Confirm Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IssuesRaisedPage