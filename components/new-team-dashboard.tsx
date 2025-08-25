"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  MessageSquare,
  CheckSquare,
  FileText,
  Settings,
  MoreVertical,
  Plus,
  Menu,
  X,
  ChevronRight,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  Send,
  Paperclip,
  Smile,
  Trash2,
  Edit2,
  Check,
} from "lucide-react"

// Mock data and services
const mockTeamData = {
  team: {
    id: "team_123",
    name: "Innovation Squad Alpha",
    code: "ISA-2024",
    status: "Active",
    createdAt: "2024-01-15T10:00:00Z",
  },
  members: [
    {
      id: "user_1",
      name: "Sarah Chen",
      avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=100&h=100&fit=crop&crop=face",
      college: "Stanford University",
      year: "2025",
      role: "Team Lead",
      strengths: ["Strategic Thinking", "Leadership", "Data Analysis"],
      isLeader: true,
      profileUrl: "/profile/user_1",
      about:
        "Experienced team leader with a background in strategic consulting and data-driven decision making. Has led multiple successful projects at Stanford.",
      experience: "3+ years in strategy consulting",
      teamBenefit:
        "Provides strategic direction and ensures data-driven decisions. Key for leading complex projects and maintaining team focus.",
      coreSkills: ["Strategic Planning", "Team Leadership", "Data Analysis", "Project Management"],
    },
    {
      id: "user_2",
      name: "Marcus Johnson",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      college: "MIT",
      year: "2024",
      role: "Researcher",
      strengths: ["Market Research", "Analytics", "Problem Solving"],
      isLeader: false,
      profileUrl: "/profile/user_2",
      about:
        "MIT graduate specializing in market analysis and competitive intelligence. Strong background in quantitative research methodologies.",
      experience: "2+ years in market research",
      teamBenefit:
        "Delivers deep market insights and competitive analysis. Critical for understanding market dynamics and opportunities.",
      coreSkills: ["Market Analysis", "Competitive Intelligence", "Statistical Analysis", "Research Design"],
    },
    {
      id: "user_3",
      name: "Elena Rodriguez",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      college: "Harvard Business School",
      year: "2025",
      role: "Designer",
      strengths: ["UI/UX Design", "Creative Thinking", "Prototyping"],
      isLeader: false,
      profileUrl: "/profile/user_3",
      about:
        "Creative designer from Harvard Business School with expertise in user experience and product design. Passionate about human-centered design.",
      experience: "2+ years in product design",
      teamBenefit:
        "Brings user-centered perspective and creative solutions. Essential for designing intuitive and engaging user experiences.",
      coreSkills: ["User Experience Design", "Prototyping", "Design Thinking", "Visual Communication"],
    },
    {
      id: "user_4",
      name: "David Kim",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      college: "UC Berkeley",
      year: "2024",
      role: "Analyst",
      strengths: ["Financial Modeling", "Data Visualization", "Excel"],
      isLeader: false,
      profileUrl: "/profile/user_4",
      about:
        "Detail-oriented analyst from UC Berkeley with strong quantitative skills. Specializes in financial modeling and data visualization.",
      experience: "2+ years in financial analysis",
      teamBenefit:
        "Provides robust financial analysis and creates compelling data visualizations. Key for quantitative decision support.",
      coreSkills: ["Financial Modeling", "Data Visualization", "Excel/Spreadsheets", "Quantitative Analysis"],
    },
  ],
  insights: {
    skillsDistribution: [
      { label: "Technical", value: 35 },
      { label: "Business", value: 25 },
      { label: "Creative", value: 20 },
      { label: "Leadership", value: 20 },
    ],
    experienceMix: [
      { label: "Beginner", value: 25 },
      { label: "Intermediate", value: 50 },
      { label: "Experienced", value: 25 },
    ],
    availabilityMix: [
      { label: "Fully Available", value: 50 },
      { label: "Moderately Available", value: 40 },
      { label: "Lightly Available", value: 10 },
    ],
    caseTypes: ["Consulting", "Product/Tech", "Marketing", "Finance"],
    topStrengths: ["Strategic Thinking", "Data Analysis", "Market Research", "UI/UX Design", "Financial Modeling"],
    strengthsAnalysis: {
      coreStrengths: [
        {
          category: "Strategic Leadership",
          skills: ["Strategic Thinking", "Leadership", "Problem Solving"],
          teamMembers: ["Sarah Chen", "Marcus Johnson"],
          strength: "High",
          description: "Strong strategic vision and leadership capabilities",
          impact: "Critical for project direction and team coordination",
        },
        {
          category: "Data & Analytics",
          skills: ["Data Analysis", "Financial Modeling", "Market Research", "Analytics"],
          teamMembers: ["Sarah Chen", "Marcus Johnson", "David Kim"],
          strength: "Excellent",
          description: "Exceptional data-driven decision making and analytical skills",
          impact: "Essential for evidence-based solutions and insights",
        },
        {
          category: "Design & User Experience",
          skills: ["UI/UX Design", "Creative Thinking", "Prototyping"],
          teamMembers: ["Elena Rodriguez"],
          strength: "Good",
          description: "Strong design capabilities and creative problem-solving",
          impact: "Key for user-centered solutions and innovation",
        },
        {
          category: "Technical Implementation",
          skills: ["Excel", "Data Visualization"],
          teamMembers: ["David Kim"],
          strength: "Good",
          description: "Solid technical skills for implementation and visualization",
          impact: "Important for translating analysis into actionable formats",
        },
      ],
      teamComplementarity: {
        score: 85,
        description: "Excellent balance between strategic, analytical, creative, and technical skills",
        strengths: ["Well-rounded skill coverage", "Strong analytical foundation", "Clear leadership structure"],
        opportunities: ["Could benefit from additional technical depth", "Marketing expertise could be expanded"],
      },
      uniqueStrengths: [
        {
          member: "Sarah Chen",
          strength: "Strategic Vision & Leadership",
          rarity: "High",
          value: "Drives team direction and decision-making",
        },
        {
          member: "Elena Rodriguez",
          strength: "Design & User Experience",
          rarity: "Medium",
          value: "Ensures user-centered approach to solutions",
        },
        {
          member: "Marcus Johnson",
          strength: "Market Research & Analytics",
          rarity: "Medium",
          value: "Provides market insights and competitive intelligence",
        },
        {
          member: "David Kim",
          strength: "Financial Modeling & Analysis",
          rarity: "Low",
          value: "Delivers quantitative analysis and financial insights",
        },
      ],
      skillCoverage: {
        consulting: 90,
        technology: 65,
        finance: 85,
        marketing: 55,
        design: 80,
      },
    },
  },
  unreadCounts: {
    chat: 3,
    tasks: 1,
  },
  tasks: [
    {
      id: "task_1",
      title: "Market Research Analysis",
      assignees: ["user_2", "user_4"],
      dueDate: "2024-12-20",
      status: "In Progress",
      priority: "High",
    },
    {
      id: "task_2",
      title: "Design Mockups",
      assignees: ["user_3"],
      dueDate: "2024-12-18",
      status: "Pending",
      priority: "Medium",
    },
    {
      id: "task_3",
      title: "Strategy Presentation",
      assignees: ["user_1"],
      dueDate: "2024-12-25",
      status: "Not Started",
      priority: "High",
    },
  ],
  chatMessages: [
    {
      id: "msg_1",
      userId: "user_2",
      userName: "Marcus Johnson",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      message: "Just finished the initial market research. The data looks promising!",
      timestamp: "2024-12-15T14:30:00Z",
      isUnread: true,
    },
    {
      id: "msg_2",
      userId: "user_3",
      userName: "Elena Rodriguez",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      message: "Great work! I'll start working on the design concepts based on your findings.",
      timestamp: "2024-12-15T14:45:00Z",
      isUnread: true,
    },
    {
      id: "msg_3",
      userId: "user_1",
      userName: "Sarah Chen",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=40&h=40&fit=crop&crop=face",
      message: "Excellent progress team! Let's schedule a sync for tomorrow to align on next steps.",
      timestamp: "2024-12-15T15:00:00Z",
      isUnread: true,
    },
  ],
}

// Feature flags
const FEATURE_FLAGS = {
  tasks: true,
  files: false,
}

// Role permissions
const ROLE_PERMISSIONS = {
  canEditTeam: (role) => ["Team Lead", "Admin"].includes(role),
  canManageTasks: (role) => ["Team Lead", "Admin"].includes(role),
  canAccessSettings: (role) => ["Team Lead", "Admin"].includes(role),
}

// Main Dashboard Component
const TeamDashboard = () => {
  const [activeRoute, setActiveRoute] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({ chat: 0, tasks: 0 })

  const [currentUser] = useState({
    id: "user_1",
    role: "Team Lead",
  })
  const [currentTasks, setCurrentTasks] = useState(mockTeamData.tasks || [])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Load team data
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setTeamData(mockTeamData)
        setUnreadCounts(mockTeamData.unreadCounts)
      } catch (err) {
        setError("Failed to load team data")
      } finally {
        setLoading(false)
      }
    }

    loadTeamData()
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRoute !== "chat") {
        setUnreadCounts((prev) => ({
          ...prev,
          chat: prev.chat + Math.floor(Math.random() * 2),
        }))
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [activeRoute])

  // Handle route changes
  const handleRouteChange = (route) => {
    setActiveRoute(route)
    setIsMobileMenuOpen(false)

    // Reset unread counts when entering chat
    if (route === "chat") {
      setUnreadCounts((prev) => ({ ...prev, chat: 0 }))
    }
  }

  // Copy team code to clipboard
  const handleCopyTeamCode = async () => {
    if (teamData?.team?.code) {
      await navigator.clipboard.writeText(teamData.team.code)
      // Show toast notification (implementation omitted for brevity)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error || !teamData) {
    return <ErrorScreen error={error} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">My Team</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation */}
        <LeftNavigation
          activeRoute={activeRoute}
          onRouteChange={handleRouteChange}
          unreadCounts={unreadCounts}
          isMobileMenuOpen={isMobileMenuOpen}
          currentUserRole={currentUser.role}
        />

        {/* Main Content */}
        <main className="flex-1 w-full">
          <div className="p-4 w-full py-0 px-0">
            {activeRoute === "dashboard" && (
              <DashboardScreen
                teamData={teamData}
                currentUser={currentUser}
                onRouteChange={handleRouteChange}
                currentTasks={currentTasks}
              />
            )}
            {activeRoute === "chat" && <ChatScreen teamData={teamData} currentUser={currentUser} />}
            {activeRoute === "tasks" && FEATURE_FLAGS.tasks && (
              <TasksScreen teamData={teamData} currentUser={currentUser} onRouteChange={handleRouteChange} />
            )}
            {activeRoute === "settings" && ROLE_PERMISSIONS.canAccessSettings(currentUser.role) && (
              <SettingsScreen teamData={teamData} currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Left Navigation Component
const LeftNavigation = ({ activeRoute, onRouteChange, unreadCounts, isMobileMenuOpen, currentUserRole }) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Users,
      route: "dashboard",
      badge: null,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      route: "chat",
      badge: unreadCounts.chat > 0 ? Math.min(unreadCounts.chat, 99) : null,
    },
  ]

  // Add conditional nav items
  if (FEATURE_FLAGS.tasks) {
    navItems.push({
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      route: "tasks",
      badge: unreadCounts.tasks > 0 ? Math.min(unreadCounts.tasks, 99) : null,
    })
  }

  if (FEATURE_FLAGS.files) {
    navItems.push({
      id: "files",
      label: "Files",
      icon: FileText,
      route: "files",
      badge: null,
    })
  }

  if (ROLE_PERMISSIONS.canAccessSettings(currentUserRole)) {
    navItems.push({
      id: "settings",
      label: "Settings",
      icon: Settings,
      route: "settings",
      badge: null,
    })
  }

  return (
    <nav
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Navigation Header */}

        {/* User Profile Section */}

        <div className="flex flex-col h-full pt-2">
          <div className="flex-1 px-4 space-y-3 py-4">
            {navItems.map((item) => {
              const isActive = activeRoute === item.route
              const colors = {
                dashboard: {
                  color: "text-blue-600",
                  bgColor: "bg-gradient-to-r from-blue-50 to-blue-100",
                  iconBg: "bg-blue-100",
                },
                chat: {
                  color: "text-green-600",
                  bgColor: "bg-gradient-to-r from-green-50 to-green-100",
                  iconBg: "bg-green-100",
                },
                tasks: {
                  color: "text-purple-600",
                  bgColor: "bg-gradient-to-r from-purple-50 to-purple-100",
                  iconBg: "bg-purple-100",
                },
                files: {
                  color: "text-orange-600",
                  bgColor: "bg-gradient-to-r from-orange-50 to-orange-100",
                  iconBg: "bg-orange-100",
                },
                settings: {
                  color: "text-gray-600",
                  bgColor: "bg-gradient-to-r from-gray-50 to-gray-100",
                  iconBg: "bg-gray-100",
                },
              }
              const itemColors = colors[item.route] || colors.dashboard

              return (
                <button
                  key={item.id}
                  onClick={() => onRouteChange(item.route)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 ${
                    isActive
                      ? `${itemColors.color} ${itemColors.bgColor} shadow-md border border-opacity-20`
                      : "text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-sm"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-slate-100 ${isActive ? itemColors.iconBg : "bg-gray-100"} transition-colors`}>
                      <item.icon size={16} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm animate-pulse bg-red-600">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500">Beyond Career </p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Status Pill Component
const StatusPill = ({ status }) => {
  const statusConfig = {
    Active: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    Pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    Locked: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
    Archived: { bg: "bg-gray-100", text: "text-gray-800", icon: AlertCircle },
  }

  const config = statusConfig[status] || statusConfig["Pending"]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon size={12} />
      <span>{status}</span>
    </span>
  )
}

const DashboardScreen = ({ teamData, currentUser, onRouteChange, currentTasks }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const [isEditingTeamName, setIsEditingTeamName] = useState(false)
  const [editedTeamName, setEditedTeamName] = useState(teamData?.team?.name || "")
  const [showRequestPopup, setShowRequestPopup] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportMessage, setReportMessage] = useState("")
  const handleSubmit = () => {
    if (reportMessage.trim()) {
      console.log("Submitting issue:", reportMessage)
      alert("Issue reported successfully!")
      setReportMessage("")
      setIsReportModalOpen(false)
    }
  }
  const handleSaveTeamName = () => {
    // Here you would typically make an API call to update the team name
    setIsEditingTeamName(false)
    // Update the team data (in a real app, this would be handled by the parent component or state management)
    if (teamData?.team) {
      teamData.team.name = editedTeamName
    }
  }

  const handleRequestTeamChange = () => {
    setShowRequestPopup(true)
    // Auto-hide popup after 3 seconds
    setTimeout(() => {
      setShowRequestPopup(false)
    }, 3000)
  }

  const upcomingTasks = currentTasks
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3)
  return (
    <div className="space-y-5 px-1">
      {/* Page Header */}
      <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors py-3 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            {isEditingTeamName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedTeamName}
                  onChange={(e) => setEditedTeamName(e.target.value)}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && handleSaveTeamName()}
                  autoFocus
                />
                <button
                  onClick={handleSaveTeamName}
                  className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                  title="Save team name"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingTeamName(false)
                    setEditedTeamName(teamData?.team?.name || "")
                  }}
                  className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                  title="Cancel editing"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-gray-900">{teamData?.team?.name || "Team Name"}</h3>
                <button
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded transition-colors"
                  title="Edit team name"
                  onClick={() => setIsEditingTeamName(true)}
                >
                  <Edit2 size={18} />
                </button>
              </>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-sm text-gray-500">
              Team formed on {new Date(teamData.team.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-8 px-1.5 px-1.5 px-0.5">
        {/* Team Members - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
            <span className="text-sm text-gray-500">{teamData.members.length} Members</span>
          </div>

          <div className="space-y-6">
            {teamData.members.map((member, index) => {
              const avatarText = member.name.charAt(0)
              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors px-0 py-0 cursor-pointer"
                  onClick={() => {
                    setSelectedMember(member)
                    setIsModalOpen(true)
                  }}
                >
                  <img
                    src={member.avatarUrl || `/placeholder.svg?height=48&width=48&text=${avatarText}`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
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
                      {member.strengths.slice(0, 3).map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="hover:text-gray-600 p-1 rounded text-slate-950 bg-slate-300">
                    <ChevronRight className="bg-slate-300" size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Team Strengths Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">Team Complementarity</h4>
                  <span className="text-2xl font-bold text-green-600">85/100</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Excellent balance between strategic, analytical, creative, and technical skills
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Well-rounded skill coverage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Strong analytical foundation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Clear leadership structure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">Could benefit from additional technical depth</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">Marketing expertise could be expanded</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-4">Skill Coverage by Domain</h4>
                <div className="space-y-3">
                  {[
                    { skill: "Consulting", percentage: 90, color: "bg-green-500" },
                    { skill: "Technology", percentage: 65, color: "bg-yellow-500" },
                    { skill: "Finance", percentage: 85, color: "bg-green-500" },
                    { skill: "Marketing", percentage: 55, color: "bg-red-500" },
                    { skill: "Design", percentage: 80, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.skill} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 w-20">{item.skill}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 flex">
            <TasksPreviewWidget
              upcomingTasks={upcomingTasks}
              members={teamData.members}
              currentUser={currentUser}
              setIsCreateModalOpen={setIsCreateModalOpen}
              onOpenTasks={() => onRouteChange("tasks")}
            />
          </div>
        </div>
      </div>

      {/* Team Strengths Analysis */}

      {/* Quick Actions */}
      {/* Quick Actions */}
      <div className="space-y-5 px-2 py-2 pb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            onClick={handleRequestTeamChange}
          >
            <AlertCircle size={24} className="text-orange-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Request Team Change</div>
              <div className="text-sm text-gray-600">Request to leave or switch teams</div>
            </div>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)} // Changed from setIsModalOpen
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <AlertCircle size={24} className="text-red-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Report an Issue</div>
              <div className="text-sm text-gray-600">Contact support about team issues</div>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {isReportModalOpen && ( // Changed from isModalOpen
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Report an Issue</h2>
              <button
                onClick={() => setIsReportModalOpen(false)} // Changed
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="issue-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the issue
                </label>
                <textarea
                  id="issue-message"
                  value={reportMessage} // Changed from message
                  onChange={(e) => setReportMessage(e.target.value)} // Changed
                  placeholder="Please provide details about the issue you're experiencing..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsReportModalOpen(false)} // Changed
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Submit Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedMember(null)
        }}
      />

      {showRequestPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Submitted</h3>
                <p className="text-gray-600">Your ticket is raised, we'll resolve your problem</p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestPopup(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Member Profile Modal Component
const MemberProfileModal = ({ member, isOpen, onClose }) => {
  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <img
                  src={member.avatarUrl || `/placeholder.svg?height=64&width=64&text=${member.name.charAt(0)}`}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover mb-2"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">{member.name.split(" ")[0]}</div>
                  <div className="text-sm font-medium text-gray-600">{member.name.split(" ")[1]}</div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{member.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Star size={14} className="mr-1" />
                    Leader
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1">
              <X size={24} />
            </button>
          </div>

          {/* Education & Experience */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Education & Experience</h3>
            <p className="text-gray-700 mb-2">
              {member.college || "Stanford University"} • Class of {member.year || "2025"}
            </p>
            <p className="text-gray-700">{member.experience || "3+ years in strategy consulting"}</p>
          </div>

          {/* About */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-700 leading-relaxed">
              {member.about ||
                "Experienced team leader with a background in strategic consulting and data-driven decision making. Has led multiple successful projects at Stanford."}
            </p>
          </div>

          {/* Core Skills */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Skills</h3>
            <div className="flex flex-wrap gap-3">
              {(
                member.coreSkills || ["Strategic Planning", "Team Leadership", "Data Analysis", "Project Management"]
              ).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* How They Benefit the Team */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">💪</span>
              How They Benefit the Team
            </h3>
            <p className="text-blue-800 leading-relaxed">
              {member.teamBenefit ||
                "Provides strategic direction and ensures data-driven decisions. Key for leading complex projects and maintaining team focus."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Members Widget Component
const MembersWidget = ({ members }) => {
  const [selectedMember, setSelectedMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleMemberClick = (member) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMember(null)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <span className="text-sm text-gray-600">{members.length} members</span>
        </div>

        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${
                index % 2 === 0
                  ? "bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-md"
                  : "bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:shadow-md"
              }`}
              onClick={() => handleMemberClick(member)}
            >
              <div className="relative">
                <img
                  src={member.avatarUrl || "/placeholder.svg"}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                {member.isLeader && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                    <Star size={12} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                    {member.name}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {member.role}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {member.college} • Class of {member.year}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {member.strengths.slice(0, 3).map((strength, strengthIndex) => (
                    <span
                      key={strengthIndex}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemberProfileModal member={selectedMember} isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
}

// Team Insights Widget Component
const TeamInsightsWidget = ({ insights }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Strengths Analysis</h3>

      <div className="space-y-8">
        {/* Team Complementarity Score */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Team Complementarity</h4>
            <span className="text-2xl font-bold text-green-600">
              {insights.strengthsAnalysis?.teamComplementarity?.score || 85}/100
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{insights.strengthsAnalysis?.teamComplementarity?.description}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {insights.strengthsAnalysis?.teamComplementarity?.strengths?.map((strength, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                ✓ {strength}
              </span>
            ))}
          </div>
          {insights.strengthsAnalysis?.teamComplementarity?.opportunities && (
            <div className="flex flex-wrap gap-2">
              {insights.strengthsAnalysis.teamComplementarity.opportunities.map((opportunity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  → {opportunity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Core Team Strengths */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Core Team Strengths</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.strengthsAnalysis?.coreStrengths?.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{category.category}</h5>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.strength === "Excellent"
                        ? "bg-green-100 text-green-800"
                        : category.strength === "High"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {category.strength}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <p className="text-sm text-blue-600 mb-3 italic">{category.impact}</p>
                <div className="flex flex-wrap gap-1">
                  {category.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Contributors: {category.teamMembers.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unique Member Strengths */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Individual Unique Strengths</h4>
          <div className="space-y-3">
            {insights.strengthsAnalysis?.uniqueStrengths?.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{member.member}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.rarity === "High"
                          ? "bg-red-100 text-red-800"
                          : member.rarity === "Medium"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {member.rarity} Rarity
                    </span>
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-1">{member.strength}</p>
                  <p className="text-sm text-gray-600">{member.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Coverage Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Skill Coverage by Domain</h4>
          <div className="space-y-3">
            {Object.entries(insights.strengthsAnalysis?.skillCoverage || {}).map(([domain, score]) => (
              <div key={domain} className="flex items-center">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0 capitalize">{domain}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3">
                  <div
                    className={`h-3 rounded-full ${
                      score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Team Skills</h4>
          <div className="flex flex-wrap gap-2">
            {insights.topStrengths?.map((strength, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Activity Preview Widget Component
const ActivityPreviewWidget = ({ messages, onOpenChat }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={onOpenChat}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
        >
          Open Chat
        </button>
      </div>

      <div className="space-y-4">
        {messages.slice(0, 3).map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <img
              src={message.userAvatar || "/placeholder.svg"}
              alt={message.userName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{message.userName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">{message.message}</p>
            </div>
            {message.isUnread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />}
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-6">
          <MessageSquare size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No messages yet</p>
          <button onClick={onOpenChat} className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1">
            Say hello to your team
          </button>
        </div>
      )}
    </div>
  )
}

// Tasks Preview Widget Component
// Task Creation Modal Component
const TaskCreationModal = ({ isOpen, onClose, members, onTaskCreated }) => {
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskPriority, setTaskPriority] = useState("Medium")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [selectedAssignees, setSelectedAssignees] = useState([])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    const newTask = {
      id: `task_${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      dueDate: taskDueDate,
      assignees: selectedAssignees,
      status: "Not Started",
      createdAt: new Date().toISOString(),
    }

    onTaskCreated(newTask)

    // Reset form
    setTaskTitle("")
    setTaskDescription("")
    setTaskPriority("Medium")
    setTaskDueDate("")
    setSelectedAssignees([])
    onClose()
  }

  const toggleAssignee = (memberId) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
                placeholder="Enter task description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Assign To</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => {
                  const avatarText = member.name.charAt(0)
                  return (
                    <label
                      key={member.id}
                      className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.id)}
                        onChange={() => toggleAssignee(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <img
                        src={member.avatarUrl || `/placeholder.svg?height=32&width=32&text=${avatarText}`}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const TasksPreviewWidget = ({ upcomingTasks, members, currentUser, onOpenTasks }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentTasks, setCurrentTasks] = useState(upcomingTasks || [])

  const handleTaskCreated = (newTask) => {
    setCurrentTasks((prev) => [...prev, newTask])
    // Show success message
    alert("Task created successfully!")
  }

  const getAssigneeNames = (assigneeIds) => {
    if (!assigneeIds || !Array.isArray(assigneeIds) || !members || !Array.isArray(members)) {
      return "Unassigned"
    }

    return assigneeIds
      .map((id) => {
        const member = members.find((m) => m.id === id)
        return member ? member.name : "Unknown"
      })
      .join(", ")
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenTasks}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
            >
              View All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500">Assigned to: {getAssigneeNames(task.assignees)}</span>
                  <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {upcomingTasks.length === 0 && (
          <div className="text-center py-6">
            <CheckSquare size={24} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No upcoming tasks</p>
            {ROLE_PERMISSIONS.canManageTasks(currentUser.role) && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1"
              >
                Create your first task
              </button>
            )}
          </div>
        )}
      </div>

      <TaskCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={members}
        onTaskCreated={handleTaskCreated}
      />
    </>
  )
}

// Chat Screen Component
const ChatScreen = ({ teamData, currentUser }) => {
  const [messages, setMessages] = useState(teamData.chatMessages || [])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map((file) => ({
      id: `file_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
  }

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const removeFile = (fileId) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() && attachedFiles.length === 0) return

    const message = {
      id: `msg_${Date.now()}`,
      userId: currentUser.id,
      userName: "You",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=40&h=40&fit=crop&crop=face",
      message: newMessage.trim(),
      attachments: attachedFiles, // Include attached files in message
      timestamp: new Date().toISOString(),
      isUnread: false,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setAttachedFiles([]) // Clear attached files after sending
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Team Chat</h2>
        <p className="text-sm text-gray-600">
          {teamData.members.length} members •{messages.filter((m) => m.isUnread).length} unread messages
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <img
              src={message.userAvatar || "/placeholder.svg"}
              alt={message.userName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{message.userName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{message.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div key={file.id} className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <label htmlFor="message-input" className="sr-only">
              Type your message
            </label>
            <textarea
              id="message-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent py-0 h-8"
              rows="2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
          </div>

          <div className="flex items-center space-x-2 relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Add attachment"
            >
              <Paperclip size={20} />
            </button>

            

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 text-2xl">
                  {["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🎉", "😊", "😢", "😡", "🔥", "💯", "✅", "❌", "⭐"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="hover:bg-gray-100 p-3 rounded-lg flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!newMessage.trim() && attachedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Tasks Screen Component
const TasksScreen = ({ teamData, currentUser, onRouteChange }) => {
  const [tasks, setTasks] = useState(teamData.tasks || [])
  const [viewMode, setViewMode] = useState("list")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === "all") return true
    return task.status.toLowerCase().replace(" ", "_") === filterStatus
  })
  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask])
    // Show success message
    alert("Task created successfully!")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusUpdate = (taskId, newStatus) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    setOpenDropdown(null)
  }

  const toggleDropdown = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>

          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            {ROLE_PERMISSIONS.canManageTasks(currentUser.role) && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Assigned to:{" "}
                      {task.assignees
                        .map((id) => {
                          const member = teamData.members.find((m) => m.id === id)
                          return member ? member.name : "Unknown"
                        })
                        .join(", ")}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                      <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                      onClick={() => toggleDropdown(task.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openDropdown === task.id && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 transform -translate-x-full">
                        <div className="py-1">
                          <button
                            onClick={() => handleStatusUpdate(task.id, "In Progress")}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(task.id, "On Going")}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            On Going
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(task.id, "Completed")}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Completed
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(task.id, "Incomplete")}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Incomplete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === "all" ? "No tasks have been created yet." : `No tasks with status "${filterStatus}".`}
              </p>
              {ROLE_PERMISSIONS.canManageTasks(currentUser.role) && filterStatus === "all" && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus size={16} />
                  <span>Create your first task</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <TaskCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={teamData.members}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}

// Settings Screen Component
const SettingsScreen = ({ teamData, currentUser }) => {
  const [teamName, setTeamName] = useState(teamData?.team?.name || "")
  const [teamDescription, setTeamDescription] = useState("")

  const handleRequestTeamChange = () => {
    setShowRequestPopup(true)
    // Auto-hide popup after 3 seconds
    setTimeout(() => {
      setShowRequestPopup(false)
    }, 3000)
  }
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportMessage, setReportMessage] = useState("")
  const [selectedMember, setSelectedMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showRequestPopup, setShowRequestPopup] = useState(false)
  const handleSubmit = () => {
    if (reportMessage.trim()) {
      console.log("Submitting issue:", reportMessage)
      alert("Issue reported successfully!")
      setReportMessage("")
      setIsReportModalOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Settings</h2>
        <p className="text-gray-600 mt-1">Manage your team configuration and members.</p>
      </div>

      {/* Team Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">
              Team Description
            </label>
            <textarea
              id="team-description"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your team's mission and goals..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Save Changes
          </button>
        </div>
      </div>

      {/* Member Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Management</h3>

        <div className="space-y-4">
          {teamData.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedMember(member)
                setIsModalOpen(true)
              }}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={member.avatarUrl || "/placeholder.svg"}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">
                    {member.college} • {member.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {member.isLeader && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Team Lead
                  </span>
                )}
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 px-0 py-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={handleRequestTeamChange}
              >
                <AlertCircle size={24} className="text-orange-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Request Team Change</div>
                  <div className="text-sm text-gray-600">Request to leave or switch teams</div>
                </div>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <AlertCircle size={24} className="text-red-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Report an Issue</div>
                  <div className="text-sm text-gray-600">Contact support about team issues</div>
                </div>
              </button>
            </div>
          </div>

          {/* Modal Overlay */}
          {isReportModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Report an Issue</h2>
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label htmlFor="issue-message" className="block text-sm font-medium text-gray-700 mb-2">
                      Describe the issue
                    </label>
                    <textarea
                      id="issue-message"
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      placeholder="Please provide details about the issue you're experiencing..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsReportModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Submit Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Profile Modal */}
          <MemberProfileModal
            member={selectedMember}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedMember(null)
            }}
          />

          {showRequestPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Request Submitted</h3>
                    <p className="text-gray-600">Your ticket is raised, we'll resolve your problem</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRequestPopup(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Request Team Dissolution */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="font-medium text-red-900">Request Team Dissolution</h4>
              <p className="text-sm text-red-700">Submit a request to dissolve this team. Requires admin approval.</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              <Trash2 size={16} />
              <span>Request Dissolution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="p-2 rounded-lg bg-slate-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900">Loading your team...</h2>
        <p className="text-sm text-gray-600">Please wait while we fetch your team information.</p>
      </div>
    </div>
  )
}

// Error Screen Component
const ErrorScreen = ({ error }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Unable to load team</h2>
        <p className="text-sm text-gray-600 mb-6">
          {error || "There was an error loading your team information. Please try again."}
        </p>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Retry
          </button>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export { TeamDashboard }
