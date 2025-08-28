"use client"

import { useState } from "react"
import { ChevronRight, Trash2, X, Users, AlertTriangle } from "lucide-react"
import Avatar from "./Avatar"

interface SettingsScreenProps {
  teamData: any
  currentUser: any
  setShowRequestPopup?: (show: boolean) => void
  setIsReportModalOpen?: (open: boolean) => void
}

export default function SettingsScreen({
  teamData,
  currentUser,
  setShowRequestPopup,
  setIsReportModalOpen,
}: SettingsScreenProps) {
  const [teamName, setTeamName] = useState(teamData?.team?.name || teamData?.name || "Team Name")
  const [teamDescription, setTeamDescription] = useState(teamData?.team?.bio || teamData?.bio || "")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [requestReason, setRequestReason] = useState("")
  const [requestDetails, setRequestDetails] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Show loading state if user authentication is still being determined
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleRequestTeamChange = () => {
    setShowRequestModal(true)
  }

  const handleReportIssue = () => {
    setShowReportModal(true)
  }

  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) {
      setError("Please enter a reason for your request")
      return
    }

    if (requestReason.length < 10 || requestReason.length > 500) {
      setError("Reason must be between 10 and 500 characters")
      return
    }

    if (requestDetails && requestDetails.length > 2000) {
      setError("Details must not exceed 2000 characters")
      return
    }

    try {
      const response = await fetch('/api/team-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          teamId: teamData?.id || teamData?.team?.id,
          requestType: 'leave_team', // Default type, could be made dynamic
          reason: requestReason.trim(),
          details: requestDetails.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setShowRequestModal(false)
      setRequestReason("")
      setRequestDetails("")
      setError("")
      setShowSuccessMessage("Your team change request has been submitted successfully!")
      setTimeout(() => setShowSuccessMessage(""), 3000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) {
      setError("Please enter an issue description")
      return
    }

    if (reportMessage.length < 10 || reportMessage.length > 2000) {
      setError("Issue description must be between 10 and 2000 characters")
      return
    }

    try {
      const response = await fetch('/api/issue-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          teamId: teamData?.id || teamData?.team?.id,
          reportType: 'bug',
          description: reportMessage.trim(),
          priority: 'medium'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      setShowReportModal(false)
      setReportMessage("")
      setError("")
      setShowSuccessMessage("Your issue report has been submitted successfully!")
      setTimeout(() => setShowSuccessMessage(""), 3000)
    } catch (err) {
      console.error('Error submitting report:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    }
  }

  const handleSaveChanges = async () => {
    if (!teamData?.id && !teamData?.team?.id) {
      setError("Team ID not found")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const teamId = teamData?.id || teamData?.team?.id
      const requestBody: any = { teamId }
      
      // Only include fields that have changed
      if (teamName.trim() !== (teamData?.team?.name || teamData?.name || "Team Name")) {
        requestBody.teamName = teamName.trim()
      }
      
      if (teamDescription.trim() !== (teamData?.team?.bio || teamData?.bio || "")) {
        requestBody.bio = teamDescription.trim()
      }
      
      // If no changes, don't make API call
      if (Object.keys(requestBody).length === 1) {
        setShowSuccessMessage("No changes to save!")
        setTimeout(() => setShowSuccessMessage(""), 3000)
        return
      }

      const response = await fetch('/api/team/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update team')
      }

      setShowSuccessMessage("Team updated successfully!")
      setTimeout(() => setShowSuccessMessage(""), 3000)
    } catch (err) {
      console.error('Error updating team:', err)
      setError(err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setIsLoading(false)
    }
  }

  // Transform real team data to match the expected format
  const teamMembers = teamData?.members ? teamData.members.map((member, index) => {
    const submission = member.team_matching_submissions || member.submission || {}
    return {
      id: member.id || index + 1,
      name: submission.full_name || member.name || 'Unknown Member',
      avatar: "/placeholder.svg?height=48&width=48", // Use same placeholder as dashboard
      university: submission.college_name || member.college || 'Unknown University',
      role: member.role_in_team || (submission.preferred_roles && submission.preferred_roles[0]) || 'Member',
      isLead: member.role_in_team === 'Team Lead' || member.isLeader || false,
      education: `${submission.college_name || member.college || 'Unknown University'} • ${submission.current_year || member.year || 'Unknown Year'}`,
      experience: submission.experience || member.experience || 'No experience listed',
      about: submission.about || member.about || 'No description available',
      skills: submission.core_strengths || member.strengths || [],
      benefit: member.teamBenefit || 'Contributes valuable skills to the team',
    }
  }) : []

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 space-y-4 px-0 py-0">
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
            <p className="text-sm">{showSuccessMessage}</p>
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError("")} 
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Settings</h2>
              <p className="text-gray-600 mt-1">Manage your team configuration and members.</p>
            </div>
            {/* Updated button to include save changes handler */}
            <button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Information</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Bio</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Describe your team's mission, goals, and what makes you unique..."
                rows={4}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">{teamDescription.length}/1000 characters</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Member Management</h3>

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar name={member.name} src={member.avatar} size="lg" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {member.isLead && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                          Team Lead
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {member.university} • {member.role}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleRequestTeamChange}
              className="flex items-center space-x-3 p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Users size={16} className="text-orange-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Request Team Change</h4>
                <p className="text-sm text-gray-600">Request to leave or switch teams</p>
              </div>
            </button>

            <button
              onClick={handleReportIssue}
              className="flex items-center space-x-3 p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Report an Issue</h4>
                <p className="text-sm text-gray-600">Contact support about team issues</p>
              </div>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Request Team Dissolution</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Submit a request to dissolve this team. Requires admin approval.
                  </p>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                  <Trash2 size={16} />
                  <span>Request Dissolution</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Team Change</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request *</label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Brief reason for your team change request (10-500 characters)..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestReason.length}/500 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details (Optional)</label>
                  <textarea
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    placeholder="Any additional details or context (max 2000 characters)..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestDetails.length}/2000 characters</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Report an Issue</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Type your issue here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto px-4 py-4">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar name={selectedMember.name} src={selectedMember.avatar} size="xl" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {selectedMember.role}
                        </span>
                        {selectedMember.isLead && (
                          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full flex items-center space-x-1">
                            <span>⭐</span>
                            <span>Leader</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Education & Experience</h3>
                    <p className="text-gray-700 mb-2">{selectedMember.education}</p>
                    <p className="text-gray-600">{selectedMember.experience}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedMember.about}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <span>💪</span>
                      <span>How They Benefit the Team</span>
                    </h3>
                    <p className="text-blue-800 leading-relaxed">{selectedMember.benefit}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
