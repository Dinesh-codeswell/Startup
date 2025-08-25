"use client"

import { Check, AlertCircle, X } from "lucide-react"
import { useState } from "react"
import Avatar from "./Avatar"

interface DashboardScreenProps {
  teamData: any
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
}: DashboardScreenProps) {
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const handleMemberClick = (member) => {
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
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
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
          {isEditingTeamName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedTeamName}
                onChange={(e) => setEditedTeamName(e.target.value)}
                className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={handleSaveTeamName} className="text-blue-600 hover:text-blue-800 p-1 rounded">
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditingTeamName(false)}
                className="hover:text-gray-800 p-1 rounded text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-gray-900 text-xl">Innovation Squad Alpha</h1>
              <button
                onClick={() => {
                  setIsEditingTeamName(true)
                  setEditedTeamName("Innovation Squad Alpha")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
          <span className="text-sm text-gray-500">Team formed on 1/15/2024</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 text-lg">Team Members</h3>
          <span className="text-sm text-gray-500">4 Members</span>
        </div>

        <div className="space-y-6">
          {[
            {
              id: 1,
              name: "Sarah Chen",
              role: "Team Lead",
              college: "Stanford University",
              classYear: "MBA 2024",
              experience: "3+ years in strategic consulting at McKinsey & Company",
              about:
                "Passionate about leveraging data-driven insights to solve complex business problems. Sarah brings extensive experience in strategic planning and team leadership.",
              benefit:
                "Sarah's strategic thinking and leadership experience help guide the team toward innovative solutions while maintaining focus on deliverable outcomes.",
              strengths: ["Strategic Thinking", "Leadership", "Data Analysis"],
              avatar: "/placeholder.svg?height=48&width=48",
            },
            {
              id: 2,
              name: "Marcus Johnson",
              role: "Researcher",
              college: "MIT",
              classYear: "MS 2024",
              experience: "2+ years in market research and business analytics",
              about:
                "Detail-oriented researcher with a passion for uncovering market insights and trends. Marcus excels at transforming complex data into actionable business intelligence.",
              benefit:
                "Marcus's analytical skills and research expertise provide the team with solid data foundations for all strategic decisions.",
              strengths: ["Market Research", "Analytics", "Problem Solving"],
              avatar: "/placeholder.svg?height=48&width=48",
            },
            {
              id: 3,
              name: "Elena Rodriguez",
              role: "Designer",
              college: "Harvard Business School",
              classYear: "MBA 2024",
              experience: "4+ years in UX/UI design and product development",
              about:
                "Creative designer with a strong business acumen. Elena combines aesthetic sensibility with user-centered design principles to create compelling solutions.",
              benefit:
                "Elena's design thinking and creative approach help the team develop user-friendly solutions that stand out in the market.",
              strengths: ["UI/UX Design", "Creative Thinking", "Prototyping"],
              avatar: "/placeholder.svg?height=48&width=48",
            },
            {
              id: 4,
              name: "David Kim",
              role: "Analyst",
              college: "UC Berkeley",
              classYear: "MBA 2024",
              experience: "3+ years in financial modeling and business analysis",
              about:
                "Analytical thinker with strong quantitative skills. David specializes in financial modeling and data visualization to support business decision-making.",
              benefit:
                "David's financial expertise and analytical rigor ensure all team proposals are backed by solid economic fundamentals.",
              strengths: ["Financial Modeling", "Data Visualization", "Excel"],
              avatar: "/placeholder.svg?height=48&width=48",
            },
          ].map((member, index) => {
            return (
              <div
                key={member.id}
                className="flex w-full items-center space-x-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleMemberClick(member)}
              >
                <Avatar name={member.name} src={member.avatar} size="lg" />

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === "Team Lead"
                          ? "bg-blue-100 text-blue-800"
                          : member.role === "Researcher"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "Designer"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <p className="text-sm mb-2 text-slate-700">{member.college}</p>
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
          })}
        </div>
      </div>

      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto px-4 py-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar
                  name={selectedMember.name}
                  src={selectedMember.avatar}
                  size="lg"
                  className="w-16 h-16 text-xl"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h3>
                  <div className="flex space-x-2 mt-2">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        selectedMember.role === "Team Lead"
                          ? "bg-blue-100 text-blue-800"
                          : selectedMember.role === "Leader"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedMember.role === "Researcher"
                              ? "bg-purple-100 text-purple-800"
                              : selectedMember.role === "Designer"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedMember.role}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Education & Experience */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Education & Experience</h4>
                <p className="text-gray-700 mb-2">
                  {selectedMember.college} • {selectedMember.classYear}
                </p>
                <p className="text-gray-700">{selectedMember.experience}</p>
              </div>

              {/* About */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">About</h4>
                <p className="text-gray-700">{selectedMember.about}</p>
              </div>

              {/* Core Skills */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Core Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedMember.strengths || []).map((skill, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* How They Benefit the Team */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">💪</span>
                  <h4 className="text-lg font-semibold text-blue-900">How They Benefit the Team</h4>
                </div>
                <p className="text-blue-800">{selectedMember.benefit}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Strengths Analysis - Left Column */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6 py-5">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Team Strengths Analysis</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">Team Complementarity</h4>
                  <span className="font-bold text-green-600 text-2xl">85/100</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Excellent balance between strategic, analytical, creative, and technical skills
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Well-rounded skill coverage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Strong analytical foundation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Clear leadership structure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 font-bold">→</span>
                    <span className="text-gray-700">Could benefit from additional technical depth</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 font-bold">→</span>
                    <span className="text-gray-700">Marketing expertise could be expanded</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Top Team Skills</p>
                <div className="flex space-x-2">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Marketing</span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Finance</span>
                </div>
              </div>
            </div>

            {/* Right Column - Skill Coverage */}
            <div className="pt-7">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Skill Coverage by Domain</h4>
              <div className="space-y-4">
                {[
                  { skill: "Consulting", percentage: 90, color: "bg-green-500" },
                  { skill: "Technology", percentage: 65, color: "bg-yellow-500" },
                  { skill: "Finance", percentage: 85, color: "bg-green-500" },
                  { skill: "Marketing", percentage: 55, color: "bg-red-500" },
                  { skill: "Design", percentage: 80, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.skill} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 w-20">{item.skill}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks - Right Column */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onRouteChange("tasks")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Assigned to:{" "}
                  {task.assignees
                    .map((assigneeId) => {
                      const member = teamData?.members?.find((m) => m.id === assigneeId)
                      return member?.name || assigneeId
                    })
                    .join(", ")}
                </p>
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
                  <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleRequestTeamChange}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Request Team Change</h4>
              <p className="text-sm text-gray-600">Request to leave or switch teams</p>
            </div>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Report an Issue</h4>
              <p className="text-sm text-gray-600">Contact support about team issues</p>
            </div>
          </button>
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
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Type your request here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
    </div>
  )
}
