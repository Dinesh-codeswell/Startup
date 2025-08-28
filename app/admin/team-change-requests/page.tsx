'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, User, Calendar, MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TeamChangeRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  teamId: string
  teamName: string
  requestType: 'leave_team' | 'switch_team' | 'dissolve_team'
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  adminResponse?: string
  createdAt: string
  updatedAt: string
}

function TeamChangeRequestsPage() {
  const [requests, setRequests] = useState<TeamChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<TeamChangeRequest | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [updating, setUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{action: 'approve' | 'reject', requestId: string, response: string} | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await fetch(`/api/team-change-request?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data)
      } else {
        console.error('Failed to fetch requests:', data.error)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string, response?: string) => {
    try {
      setUpdating(true)
      const updateResponse = await fetch('/api/team-change-request', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          adminResponse: response
        })
      })

      const data = await updateResponse.json()
      
      if (data.success) {
        await fetchRequests()
        setSelectedRequest(null)
        setAdminResponse('')
      } else {
        console.error('Failed to update request:', data.error)
      }
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      processed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || AlertTriangle
    
    return (
      <Badge className={`${config?.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      leave_team: 'Leave Team',
      switch_team: 'Switch Team',
      dissolve_team: 'Dissolve Team'
    }
    return labels[type as keyof typeof labels] || type
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
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
                <h1 className="text-2xl font-bold text-gray-900">Team Change Requests</h1>
                <p className="text-gray-600">Manage user requests for team changes</p>
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
        <div className="flex space-x-4 mb-6">
          {['all', 'pending', 'approved', 'rejected', 'processed'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Requests' : status}
            </Button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">No team change requests match your current filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-900">{request.userName}</span>
                          <span className="text-gray-500">({request.userEmail})</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Request Type</p>
                          <p className="font-medium">{getRequestTypeLabel(request.requestType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Team</p>
                          <p className="font-medium">{request.teamName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Message</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                      </div>
                      
                      {request.adminResponse && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Admin Response</p>
                          <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            {request.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="ml-4 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          variant="outline"
                        >
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Review Request</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedRequest.userName} ({selectedRequest.userEmail})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Request Type</p>
                  <p className="font-medium">{getRequestTypeLabel(selectedRequest.requestType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{selectedRequest.teamName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Message</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.message}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Response (Optional)
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
                  onClick={() => setSelectedRequest(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction({action: 'reject', requestId: selectedRequest.id, response: adminResponse})}
                  disabled={updating}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {updating ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => setConfirmAction({action: 'approve', requestId: selectedRequest.id, response: adminResponse})}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm {confirmAction.action === 'approve' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {confirmAction.action} this team change request? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateRequestStatus(confirmAction.requestId, confirmAction.action === 'approve' ? 'approved' : 'rejected', confirmAction.response)
                    setConfirmAction(null)
                  }}
                  disabled={updating}
                  className={confirmAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
                >
                  {updating ? 'Processing...' : (confirmAction.action === 'approve' ? 'Approve' : 'Reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamChangeRequestsPage