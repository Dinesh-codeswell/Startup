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
  // Team Strengths Analysis state
  const [strengthsAnalysis, setStrengthsAnalysis] = useState(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)

  // Load team strengths analysis
  useEffect(() => {
    const loadTeamAnalysis = async () => {
      if (!teamId) return
      
      setIsLoadingAnalysis(true)
      try {
        const response = await fetch(`/api/team-strengths-analysis?team_id=${teamId}`)
        if (response.ok) {
          const result = await response.json()
          console.log('Team analysis API response:', result)
          setStrengthsAnalysis(result.success ? result.data : null)
        } else {
          console.error('Failed to load team analysis:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading team analysis:', error)
      } finally {
        setIsLoadingAnalysis(false)
      }
    }

    loadTeamAnalysis()
  }, [teamId])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMemberDisplay | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [requestReason, setRequestReason] = useState("")
  const [requestDetails, setRequestDetails] = useState("")
  const [error, setError] = useState("")
  
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

  // API Functions for Tasks
  const fetchTasks = async () => {
    if (!currentTeamData?.team?.id && !currentTeamData?.id) return
    
    try {
      setTasksLoading(true)
      const teamId = currentTeamData?.team?.id || currentTeamData?.id
      const response = await fetch(`/api/tasks/team/${teamId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data.tasks || [])
      setTasksError(null)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setTasksError('Failed to load tasks')
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  // Load tasks on component mount and when teamData changes
  useEffect(() => {
    fetchTasks()
  }, [currentTeamData])

  const handleMemberClick = (member: TeamMemberDisplay) => {
    setSelectedMember(member)
    setShowMemberModal(true)
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
          teamId: currentTeamData?.id || currentTeamData?.team?.id,
          requestType: 'leave_team',
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
          teamId: currentTeamData?.id || currentTeamData?.team?.id,
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

  const upcomingTasks = (tasks || [])
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
                    {currentTeamData?.team?.name || currentTeamData?.name || "Team Name"}
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
          </div>
          <span className="text-sm text-gray-500">
            Team formed on {currentTeamData?.team?.created_at ? new Date(currentTeamData.team.created_at).toLocaleDateString() : currentTeamData?.formationDate || new Date().toLocaleDateString()}
          </span>
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

      {/* Team Strengths Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Team Strengths Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <div>
              <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base lg:text-lg font-medium text-gray-900">Team Complementarity</h4>
                  {isLoadingAnalysis ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                  ) : (
                    <span className="font-bold text-green-600 text-xl lg:text-2xl">
                      {strengthsAnalysis?.teamComplementarity?.score || 0}/100
                    </span>
                  )}
                </div>
                <p className="text-xs lg:text-sm text-gray-600 mb-4">
                  {isLoadingAnalysis ? (
                    <div className="animate-pulse bg-gray-300 h-4 w-full rounded"></div>
                  ) : (
                    strengthsAnalysis?.teamComplementarity?.description || "Loading team analysis..."
                  )}
                </p>
                <div className="space-y-2 text-xs lg:text-sm">
                  {isLoadingAnalysis ? (
                    <div className="space-y-2">
                      <div className="animate-pulse bg-gray-300 h-3 w-3/4 rounded"></div>
                      <div className="animate-pulse bg-gray-300 h-3 w-2/3 rounded"></div>
                    </div>
                  ) : (
                    strengthsAnalysis?.teamComplementarity?.keyObservations?.map((observation, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-gray-700">{observation}</span>
                      </div>
                    )) || (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 font-bold">-</span>
                        <span className="text-gray-500">No analysis available</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-4">Skill Coverage by Domain</h4>
              <div className="space-y-3 lg:space-y-4">
                {isLoadingAnalysis ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="animate-pulse bg-gray-300 h-4 w-16 lg:w-20 rounded"></div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 lg:h-3">
                        <div className="animate-pulse bg-gray-300 h-2 lg:h-3 rounded-full w-1/2"></div>
                      </div>
                      <div className="animate-pulse bg-gray-300 h-4 w-8 rounded"></div>
                    </div>
                  ))
                ) : (
                  [
                    { 
                      skill: "Consulting", 
                      percentage: Math.round(strengthsAnalysis?.skillCoverage?.consulting || 0), 
                      color: (strengthsAnalysis?.skillCoverage?.consulting || 0) >= 70 ? "bg-green-500" : (strengthsAnalysis?.skillCoverage?.consulting || 0) >= 40 ? "bg-yellow-500" : "bg-red-500" 
                    },
                    { 
                      skill: "Technology", 
                      percentage: Math.round(strengthsAnalysis?.skillCoverage?.technology || 0), 
                      color: (strengthsAnalysis?.skillCoverage?.technology || 0) >= 70 ? "bg-green-500" : (strengthsAnalysis?.skillCoverage?.technology || 0) >= 40 ? "bg-yellow-500" : "bg-red-500" 
                    },
                    { 
                      skill: "Finance", 
                      percentage: Math.round(strengthsAnalysis?.skillCoverage?.finance || 0), 
                      color: (strengthsAnalysis?.skillCoverage?.finance || 0) >= 70 ? "bg-green-500" : (strengthsAnalysis?.skillCoverage?.finance || 0) >= 40 ? "bg-yellow-500" : "bg-red-500" 
                    },
                    { 
                      skill: "Marketing", 
                      percentage: Math.round(strengthsAnalysis?.skillCoverage?.marketing || 0), 
                      color: (strengthsAnalysis?.skillCoverage?.marketing || 0) >= 70 ? "bg-green-500" : (strengthsAnalysis?.skillCoverage?.marketing || 0) >= 40 ? "bg-yellow-500" : "bg-red-500" 
                    },
                    { 
                      skill: "Design", 
                      percentage: Math.round(strengthsAnalysis?.skillCoverage?.design || 0), 
                      color: (strengthsAnalysis?.skillCoverage?.design || 0) >= 70 ? "bg-green-500" : (strengthsAnalysis?.skillCoverage?.design || 0) >= 40 ? "bg-yellow-500" : "bg-red-500" 
                    },
                  ].map((item) => (
                    <div key={item.skill} className="flex items-center space-x-3">
                      <span className="text-xs lg:text-sm font-medium text-gray-700 w-16 lg:w-20 flex-shrink-0">{item.skill}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 lg:h-3">
                        <div className={`h-2 lg:h-3 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <span className="text-xs lg:text-sm font-medium text-gray-900 w-8 flex-shrink-0">{item.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            <button
              onClick={() => onRouteChange("tasks")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium touch-manipulation"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 lg:space-y-4">
            {tasksLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div className="text-center py-4">
                <p className="text-red-500">{tasksError}</p>
                <button 
                  onClick={fetchTasks}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-3 lg:p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{task.title}</h4>
                  <p className="text-xs lg:text-sm text-gray-600 mb-2">Assigned to: {task.assignees?.join(", ") || "Unassigned"}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs lg:text-sm text-gray-500">Due: {task.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left touch-manipulation"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-orange-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Request Team Change</h4>
              <p className="text-xs lg:text-sm text-gray-600">Request to leave or switch teams</p>
            </div>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left touch-manipulation"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Report an Issue</h4>
              <p className="text-xs lg:text-sm text-gray-600">Contact support about team issues</p>
            </div>
          </button>
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
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please describe why you want to change teams..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional information..."
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestReason("")
                  setRequestDetails("")
                  setError("")
                }}
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
              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportMessage("")
                  setError("")
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
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
