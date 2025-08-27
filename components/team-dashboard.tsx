"use client"

import { useState, useEffect } from "react"
import { Clock, AlertCircle, CheckCircle, X, Menu } from "lucide-react"
import LoadingScreen from "./LoadingScreen" // Declare LoadingScreen
import ErrorScreen from "./ErrorScreen" // Declare ErrorScreen
import ChatScreen from "./ChatScreen" // Declare ChatScreen
import TasksScreen from "./TasksScreen" // Declare TasksScreen
import SettingsScreen from "./SettingsScreen" // Declare SettingsScreen
import LeftNavigation from "./LeftNavigation" // Declare LeftNavigation
import DashboardScreen from "./DashboardScreen" // Declare DashboardScreen

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
const TeamDashboard = ({ userStatus }) => {
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
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMessage, setReportMessage] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [isEditingTeamName, setIsEditingTeamName] = useState(false)
  const [editedTeamName, setEditedTeamName] = useState("")

  // Load team data
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true)
        
        if (userStatus?.hasTeam && userStatus?.team) {
          // User has a team - use real data
          const realTeamData = {
            team: {
              id: userStatus.team.id,
              name: userStatus.team.team_name,
              code: `TEAM-${userStatus.team.id.slice(-4)}`,
              status: userStatus.team.status === 'active' ? 'Active' : 'Pending',
              createdAt: userStatus.team.formed_at,
            },
            members: userStatus.team.members || [],
            insights: mockTeamData.insights, // Use mock insights for now
            unreadCounts: { chat: 0, tasks: 0 },
            tasks: [], // Empty tasks initially
            chatMessages: [], // Empty chat initially
          }
          setTeamData(realTeamData)
          setUnreadCounts(realTeamData.unreadCounts)
        } else {
          // User doesn't have a team - set to null to show locked state
          setTeamData(null)
          setUnreadCounts({ chat: 0, tasks: 0 })
        }
      } catch (err) {
        setError("Failed to load team data")
      } finally {
        setLoading(false)
      }
    }

    if (userStatus) {
      loadTeamData()
    }
  }, [userStatus])

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

  const handleSubmit = () => {
    if (reportMessage.trim()) {
      console.log("Submitting issue:", reportMessage)
      alert("Issue reported successfully!")
      setReportMessage("")
      setShowReportModal(false)
    }
  }

  const handleSaveTeamName = () => {
    setIsEditingTeamName(false)
    if (teamData?.team) {
      teamData.team.name = editedTeamName
    }
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

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  // Show locked state when user has submitted questionnaire but no team assigned
  if (!teamData && userStatus?.hasSubmitted && !userStatus?.hasTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="text-xl text-gray-900 font-bold">
              <h1 className="text-xl text-gray-900 font-bold">My Team</h1>
            </div>
          </div>
        </header>

        {/* Locked State Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Assignment Pending</h2>
              <p className="text-gray-600 mb-6">
                Thank you for submitting your questionnaire! Our team matching algorithm is working to find the perfect teammates for you.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Our algorithm analyzes your skills, preferences, and goals</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>We match you with complementary teammates</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>You'll receive a notification when your team is ready</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Estimated wait time:</strong> 24-48 hours
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You'll receive an email notification once your team is formed.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no team data and user hasn't submitted
  if (!teamData) {
    return <ErrorScreen error="Unable to load team data" />
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
        <div className="flex items-center justify-between px-4 h-14">
          <div className="text-xl text-gray-900 font-bold">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl text-gray-900 font-bold">My Team</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation */}
        <div className="w-64 flex-shrink-0">
          <LeftNavigation
            activeRoute={activeRoute}
            onRouteChange={handleRouteChange}
            unreadCounts={unreadCounts}
            isMobileMenuOpen={isMobileMenuOpen}
            currentUserRole={currentUser.role}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-4 px-3 py-3.5 pb-9">
            {activeRoute === "dashboard" && (
              <DashboardScreen
                teamData={teamData}
                currentUser={currentUser}
                onRouteChange={handleRouteChange}
                currentTasks={currentTasks}
                showRequestModal={showRequestModal}
                setShowRequestModal={setShowRequestModal}
                showReportModal={showReportModal}
                setShowReportModal={setShowReportModal}
                reportMessage={reportMessage}
                setReportMessage={setReportMessage}
                showSuccessMessage={showSuccessMessage}
                setShowSuccessMessage={setShowSuccessMessage}
                isEditingTeamName={isEditingTeamName}
                setIsEditingTeamName={setIsEditingTeamName}
                editedTeamName={editedTeamName}
                setEditedTeamName={setEditedTeamName}
                handleSubmit={handleSubmit}
                handleSaveTeamName={handleSaveTeamName}
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

export default TeamDashboard
