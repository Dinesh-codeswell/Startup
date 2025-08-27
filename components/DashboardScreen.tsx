"use client"

import { Check, AlertCircle, X } from "lucide-react"
import { useState, useEffect } from "react"
import Avatar from "./Avatar"
import { useTeamData } from "../hooks/useTeamData"
import { TeamMemberDisplay, CompleteTeamData } from "../types/team"

interface DashboardScreenProps {
  teamData: CompleteTeamData | null
  currentUser: any
  onRouteChange: (route: string) => void
  currentTasks: any[]
  showRequestModal: boolean
  setShowRequestModal: (show: boolean) => void
  showReportModal: boolean
  setShowReportModal: (show: boolean) => void
  reportMessage: string
  setReportMessage: (message: string) => void
  showSuccessMessage: string
  setShowSuccessMessage: (message: string) => void
  isEditingTeamName: boolean
  setIsEditingTeamName: (editing: boolean) => void
  editedTeamName: string
  setEditedTeamName: (name: string) => void
  handleSubmit: () => void
  handleSaveTeamName: () => void
  teamId?: string
}

export default function DashboardScreen({
  teamData,
  currentUser,
  onRouteChange,
  currentTasks,
  showRequestModal,
  setShowRequestModal,
  showReportModal,
  setShowReportModal,
  reportMessage,
  setReportMessage,
  showSuccessMessage,
  setShowSuccessMessage,
  isEditingTeamName,
  setIsEditingTeamName,
  editedTeamName,
  setEditedTeamName,
  handleSubmit,
  handleSaveTeamName,
  teamId,
}: DashboardScreenProps) {
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMemberDisplay | null>(null)
  
  // Show loading state if user authentication is still being determined
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Fetch real team data if teamId is provided
  const { 
    teamData: realTeamData, 
    members: realMembers, 
    loading: teamLoading, 
    error: teamError 
  } = useTeamData({ 
    teamId, 
    autoFetch: !!teamId 
  })
  
  // Use real data if available, otherwise fall back to passed teamData
  const currentTeamData = realTeamData || teamData
  const currentMembers = realMembers.length > 0 ? realMembers : (teamData?.members || [])

  const handleMemberClick = (member: TeamMemberDisplay) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  const handleRequestTeamChange = () => {
    setShowRequestModal(true)
  }

  const handleSubmitRequest = () => {
    setShowRequestModal(false)
    setReportMessage("")
    setShowSuccessMessage("Your ticket is raised")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  const handleSubmitReport = () => {
    setShowReportModal(false)
    setReportMessage("")
    setShowSuccessMessage("Your ticket is raised")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  const upcomingTasks = (currentTasks || [])
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
          <p className="text-sm">{showSuccessMessage}</p>
        </div>
      )}

      {/* Team Members Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-300">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isEditingTeamName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedTeamName}
                    onChange={(e) => setEditedTeamName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTeamName}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => setIsEditingTeamName(false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentTeamData?.team?.team_name || "Team Name"}
                  </h2>
                  <button
                    onClick={() => setIsEditingTeamName(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Team Formed at {currentTeamData?.formationDate || new Date().toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={handleRequestTeamChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Team Change
          </button>
        </div>

        {/* Team Members Count */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Team Members ({teamLoading ? '...' : currentMembers.length})
          </h3>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          {teamLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading team members...</p>
            </div>
          ) : teamError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">Error loading team members: {teamError}</p>
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members found</p>
            </div>
          ) : (
            currentMembers.map((member, index) => {
              return (
                <div
                  key={member.id}
                  className="flex w-full items-center space-x-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  <Avatar name={member.name} src="/placeholder.svg?height=48&width=48" size="lg" />

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {member.isLeader && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Team Lead
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.role?.toLowerCase().includes('lead')
                            ? "bg-blue-100 text-blue-800"
                            : member.role?.toLowerCase().includes('research')
                              ? "bg-purple-100 text-purple-800"
                              : member.role?.toLowerCase().includes('design')
                                ? "bg-green-100 text-green-800"
                                : member.role?.toLowerCase().includes('analyst')
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role || 'Member'}
                      </span>
                    </div>
                    <p className="text-sm mb-2 text-slate-700">
                      {member.college} • {member.classYear}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(member.strengths || []).slice(0, 3).map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="hover:text-gray-600 p-1 rounded text-slate-950 bg-slate-300">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="bg-slate-300"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Member Details Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Member Details</h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar name={selectedMember.name} src="/placeholder.svg?height=64&width=64" size="xl" />
                <div>
                  <h4 className="font-medium text-gray-900">{selectedMember.name}</h4>
                  <p className="text-sm text-gray-600">{selectedMember.role}</p>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">College</h5>
                <p className="text-sm text-gray-600">{selectedMember.college}</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Class Year</h5>
                <p className="text-sm text-gray-600">{selectedMember.classYear}</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Core Strengths</h5>
                <div className="flex flex-wrap gap-2">
                  {(selectedMember.strengths || []).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {selectedMember.bio && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                  <p className="text-sm text-gray-600">{selectedMember.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Team Change Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Team Change</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for team change request
                </label>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please describe why you want to change teams..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report an Issue</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the issue
                </label>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please describe the issue you're experiencing..."
                />
              </div>
            </div>
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
    </div>
  )
}
