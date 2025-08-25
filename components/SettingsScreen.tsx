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
  const [teamName, setTeamName] = useState("Innovation Squad Alpha")
  const [teamDescription, setTeamDescription] = useState("")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const handleRequestTeamChange = () => {
    setShowRequestModal(true)
  }

  const handleReportIssue = () => {
    setShowReportModal(true)
  }

  const handleSubmitRequest = () => {
    setShowRequestModal(false)
    setRequestMessage("")
    setShowSuccessMessage("Your ticket is raised")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  const handleSubmitReport = () => {
    setShowReportModal(false)
    setReportMessage("")
    setShowSuccessMessage("Your ticket is raised")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  const handleSaveChanges = () => {
    // Here you would typically make an API call to save the changes
    console.log("[v0] Saving team settings:", { teamName, teamDescription })
    setShowSuccessMessage("Team settings saved successfully!")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      university: "Stanford University",
      role: "Team Lead",
      isLead: true,
      education: "Stanford University • Class of 2025",
      experience: "3+ years in strategy consulting",
      about:
        "Experienced team leader with a background in strategic consulting and data-driven decision making. Has led multiple successful projects at Stanford.",
      skills: ["Strategic Planning", "Team Leadership", "Data Analysis", "Project Management"],
      benefit:
        "Provides strategic direction and ensures data-driven decisions. Key for leading complex projects and maintaining team focus.",
    },
    {
      id: 2,
      name: "Marcus Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      university: "MIT",
      role: "Researcher",
      isLead: false,
      education: "MIT • Class of 2024",
      experience: "2+ years in market research",
      about:
        "Analytical researcher with expertise in market analysis and data interpretation. Strong background in quantitative methods.",
      skills: ["Market Research", "Data Analytics", "Statistical Analysis", "Problem Solving"],
      benefit:
        "Brings deep analytical capabilities and research expertise. Essential for data-driven insights and market understanding.",
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      university: "Harvard Business School",
      role: "Designer",
      isLead: false,
      education: "Harvard Business School • Class of 2025",
      experience: "3+ years in UX/UI design",
      about:
        "Creative designer with a strong business background. Specializes in user experience and visual design for business applications.",
      skills: ["UX/UI Design", "Creative Thinking", "Prototyping", "User Research"],
      benefit:
        "Combines design expertise with business acumen. Critical for creating user-centered solutions and visual communication.",
    },
    {
      id: 4,
      name: "David Kim",
      avatar: "/placeholder.svg?height=40&width=40",
      university: "UC Berkeley",
      role: "Analyst",
      isLead: false,
      education: "UC Berkeley • Class of 2024",
      experience: "2+ years in business analysis",
      about:
        "Detail-oriented analyst with strong quantitative skills. Focuses on business process optimization and financial modeling.",
      skills: ["Business Analysis", "Financial Modeling", "Process Optimization", "Data Visualization"],
      benefit:
        "Provides analytical rigor and business process expertise. Key for optimizing operations and financial planning.",
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 space-y-4 px-0 py-0">
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
            <p className="text-sm">{showSuccessMessage}</p>
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Description</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Describe your team's mission and goals..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
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
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
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
