"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Check, AlertCircle, X, Plus, MoreHorizontal, Edit, ChevronDown, Send, Smile, ChevronRight, Menu } from "lucide-react"

interface ConsolidatedDashboardProps {
  teamData?: any
  currentUser?: any
  onRouteChange?: (route: string) => void
  currentTasks?: any[]
}

interface AvatarProps {
  name?: string | null
  src?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  // Handle undefined/null name gracefully
  const safeName = name || "User"
  const [imgFailed, setImgFailed] = useState(false)

  const hasValidSrc = useMemo(() => {
    const s = (src || "").trim()
    if (!s) return false
    if (/placeholder(\.svg)?/i.test(s)) return false
    if (/default|avatar-placeholder|dummy|usericon/i.test(s)) return false
    return true
  }, [src])

  const showInitials = !hasValidSrc || imgFailed

  const initials = useMemo(() => {
    const i =
      safeName
        .trim()
        .split(/\s+/)
        .map((w) => w[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    return i
  }, [safeName])

  const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  const palette = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ]

  const colorClass = useMemo(() => {
    const hash = Array.from(safeName || "").reduce((a, c) => a + c.charCodeAt(0), 0)
    return palette[hash % palette.length]
  }, [safeName])

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} text-white rounded-full flex items-center justify-center font-medium overflow-hidden flex-shrink-0 ${className}`}
      aria-label={safeName}
      title={safeName}
    >
      {showInitials ? (
        <span className="select-none">{initials}</span>
      ) : (
        <img
          key={src}
          src={src || "/placeholder.svg"}
          alt={safeName}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      )}
    </div>
  )
}

export default function ConsolidatedDashboard({
  teamData,
  currentUser,
  onRouteChange,
  currentTasks = [],
}: ConsolidatedDashboardProps) {
  // Show loading state if user authentication is still being determined
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="p-4 lg:p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Active section state
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Dashboard states
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMessage, setReportMessage] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [isEditingTeamName, setIsEditingTeamName] = useState(false)
  const [editedTeamName, setEditedTeamName] = useState("Innovation Squad Alpha")

  // Chat states
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Task states
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignees: [] as number[],
  })

  // Settings states
  const [teamName, setTeamName] = useState("Innovation Squad Alpha")
  const [teamDescription, setTeamDescription] = useState("")

  // Data
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      userName: "Marcus Johnson",
      userAvatar: "/placeholder.svg?height=40&width=40&text=MJ",
      message: "Just finished the initial market research. The data looks promising!",
      timestamp: "09:00 PM",
      isCurrentUser: false,
    },
    {
      id: 2,
      userName: "Elena Rodriguez",
      userAvatar: "/placeholder.svg?height=40&width=40&text=ER",
      message: "Great work! I'll start working on the design concepts based on your findings.",
      timestamp: "08:15 PM",
      isCurrentUser: false,
    },
    {
      id: 3,
      userName: "Sarah Chen",
      userAvatar: "/placeholder.svg?height=40&width=40&text=SC",
      message: "Excellent progress team! Let's schedule a sync for tomorrow to align on next steps.",
      timestamp: "08:30 PM",
      isCurrentUser: true,
    },
  ])

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Market Research Analysis",
      description: "Conduct comprehensive market research to analyze current trends, competitor strategies, and identify potential opportunities for our upcoming product launch.",
      assignees: ["Marcus Johnson", "David Kim"],
      status: "In Progress",
      priority: "High",
      dueDate: "12/20/2024",
    },
    {
      id: 2,
      title: "Design Mockups",
      description: "Create detailed design mockups for the new user interface, including wireframes, color schemes, and interactive prototypes for user testing.",
      assignees: ["Elena Rodriguez"],
      status: "Pending",
      priority: "Medium",
      dueDate: "12/18/2024",
    },
    {
      id: 3,
      title: "Strategy Presentation",
      description: "Prepare and deliver a comprehensive strategy presentation to stakeholders outlining our Q1 objectives and implementation roadmap.",
      assignees: ["Sarah Chen"],
      status: "Not Started",
      priority: "High",
      dueDate: "12/25/2024",
    },
  ])

  const teamMembers = [
    { id: 1, name: "Sarah Chen", avatar: "/placeholder.svg?height=32&width=32", role: "Team Lead", isLead: true },
    { id: 2, name: "Marcus Johnson", avatar: "/placeholder.svg?height=32&width=32", role: "Researcher", isLead: false },
    { id: 3, name: "Elena Rodriguez", avatar: "/placeholder.svg?height=32&width=32", role: "Designer", isLead: false },
    { id: 4, name: "David Kim", avatar: "/placeholder.svg?height=32&width=32", role: "Analyst", isLead: false },
  ]

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👏", "🙌",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  ]

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (openStatusDropdown !== null) {
        const currentDropdownRef = dropdownRefs.current[openStatusDropdown]
        if (currentDropdownRef && !currentDropdownRef.contains(event.target as Node)) {
          setOpenStatusDropdown(null)
        }
      }
    }

    if (showEmojiPicker || openStatusDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker, openStatusDropdown])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleMemberClick = (member: any) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  const handleSaveTeamName = () => {
    setIsEditingTeamName(false)
    setShowSuccessMessage("Team name updated successfully!")
    setTimeout(() => setShowSuccessMessage(""), 3000)
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

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const now = new Date()
      const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      const newMessage = {
        id: chatMessages.length + 1,
        userName: currentUser?.name || "You",
        userAvatar: currentUser?.avatar || "/placeholder.svg?height=40&width=40",
        message: message.trim(),
        timestamp: timestamp,
        isCurrentUser: false,
      }

      setChatMessages((prev) => [...prev, newMessage])
      setMessage("")
    }
  }

  const handleStatusChange = (taskId: number, newStatus: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    setOpenStatusDropdown(null)
  }

  const handleCreateTask = () => {
    setShowCreateTaskModal(true)
  }

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.title.trim()) {
      const assigneeNames = newTask.assignees
        .map((id) => teamMembers.find((member) => member.id === id)?.name)
        .filter(Boolean) as string[]

      const newTaskItem = {
        id: tasks.length + 1,
        title: newTask.title,
        description: newTask.description,
        assignees: assigneeNames,
        status: "Not Started",
        priority: newTask.priority,
        dueDate: newTask.dueDate || "No due date",
      }

      setTasks((prev) => [...prev, newTaskItem])
    }

    setShowCreateTaskModal(false)
    setNewTask({ title: "", description: "", priority: "Medium", dueDate: "", assignees: [] })
  }

  const handleSaveChanges = () => {
    setShowSuccessMessage("Team settings saved successfully!")
    setTimeout(() => setShowSuccessMessage(""), 3000)
  }

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Not Started":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "To Do":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500"
      case "Pending":
        return "bg-yellow-500"
      case "Not Started":
        return "bg-gray-500"
      case "Completed":
        return "bg-green-500"
      case "To Do":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const upcomingTasks = tasks
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "chat", label: "Chat" },
            { id: "tasks", label: "Tasks" },
            { id: "settings", label: "Settings" },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === section.id ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={24} />
        </button>

        {/* Mobile Title */}
        <h1 className="md:hidden text-lg font-semibold text-gray-900 capitalize">{activeSection}</h1>
        <div className="md:hidden w-10"></div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="flex flex-col space-y-2 mt-4">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "chat", label: "Chat" },
              { id: "tasks", label: "Tasks" },
              { id: "settings", label: "Settings" },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`px-4 py-3 text-left text-base font-medium rounded-md transition-colors touch-manipulation ${
                  activeSection === section.id 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDashboard = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 max-w-sm">
          <p className="text-sm">{showSuccessMessage}</p>
        </div>
      )}

      {/* Team Members Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-300">
          {isEditingTeamName ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={editedTeamName}
                onChange={(e) => setEditedTeamName(e.target.value)}
                className="text-lg lg:text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
              />
              <button 
                onClick={handleSaveTeamName} 
                className="text-blue-600 hover:text-blue-800 p-2 rounded touch-manipulation"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditingTeamName(false)}
                className="hover:text-gray-800 p-2 rounded text-red-700 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 flex-1">
              <h1 className="font-bold text-gray-900 text-lg lg:text-xl">Innovation Squad Alpha</h1>
              <button
                onClick={() => {
                  setIsEditingTeamName(true)
                  setEditedTeamName("Innovation Squad Alpha")
                }}
                className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
              >
                <Edit size={16} />
              </button>
            </div>
          )}
          <span className="text-xs lg:text-sm text-gray-500 ml-2">Team formed on 1/15/2024</span>
        </div>

        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="font-semibold text-gray-900 text-base lg:text-lg">Team Members</h3>
          <span className="text-sm text-gray-500">4 Members</span>
        </div>

        <div className="space-y-3 lg:space-y-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex w-full items-center space-x-3 lg:space-x-4 px-3 lg:px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-manipulation"
              onClick={() => handleMemberClick(member)}
            >
              <Avatar name={member.name} src={member.avatar} size="md" className="lg:w-12 lg:h-12" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 lg:space-x-3 mb-1">
                  <h4 className="font-medium text-gray-900 text-sm lg:text-base truncate">{member.name}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
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
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </div>
          ))}
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
                  <span className="font-bold text-green-600 text-xl lg:text-2xl">85/100</span>
                </div>
                <p className="text-xs lg:text-sm text-gray-600 mb-4">
                  Excellent balance between strategic, analytical, creative, and technical skills
                </p>
                <div className="space-y-2 text-xs lg:text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Well-rounded skill coverage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Strong analytical foundation</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-4">Skill Coverage by Domain</h4>
              <div className="space-y-3 lg:space-y-4">
                {[
                  { skill: "Consulting", percentage: 90, color: "bg-green-500" },
                  { skill: "Technology", percentage: 65, color: "bg-yellow-500" },
                  { skill: "Finance", percentage: 85, color: "bg-green-500" },
                  { skill: "Marketing", percentage: 55, color: "bg-red-500" },
                  { skill: "Design", percentage: 80, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.skill} className="flex items-center space-x-3">
                    <span className="text-xs lg:text-sm font-medium text-gray-700 w-16 lg:w-20 flex-shrink-0">{item.skill}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 lg:h-3">
                      <div className={`h-2 lg:h-3 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-gray-900 w-8 flex-shrink-0">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            <button
              onClick={() => setActiveSection("tasks")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium touch-manipulation"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 lg:space-y-4">
            {upcomingTasks.map((task) => (
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
            ))}
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
    </div>
  )

  const renderChat = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 lg:px-6 py-4 border-b bg-white border-gray-200">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Team Chat</h2>
        <p className="text-sm text-gray-500 mt-1">4 members • 3 unread messages</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-96 px-4 lg:px-6 py-4 overflow-y-auto scroll-smooth">
          <div className="space-y-4 lg:space-y-6">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <Avatar name={msg.userName} src={msg.userAvatar} size="md" />
                <div className={`flex-1 max-w-xs lg:max-w-md ${msg.isCurrentUser ? "flex flex-col items-end" : ""}`}>
                  <div
                    className={`flex items-center space-x-2 mb-2 ${msg.isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <span className="font-medium text-gray-900 text-xs lg:text-sm">{msg.userName}</span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 max-w-full ${
                      msg.isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 max-h-48 overflow-y-auto z-50"
              >
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl hover:bg-gray-100 rounded p-1 transition-colors touch-manipulation"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors flex-shrink-0 touch-manipulation"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderTasks = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Tasks</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation">
                <option value="all">All Tasks</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={handleCreateTask}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 cursor-pointer hover:shadow-md transition-shadow touch-manipulation"
              onClick={() => {
                setSelectedTask(task)
                setShowTaskDetailsModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{task.title}</h3>
                  </div>
                  <p className="text-xs lg:text-sm text-gray-600 mb-3 truncate">Assigned to: {task.assignees.join(", ")}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="relative" ref={(el) => (dropdownRefs.current[task.id] = el)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenStatusDropdown(openStatusDropdown === task.id ? null : task.id)
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity flex items-center space-x-1 touch-manipulation ${getStatusColor(task.status)}`}
                      >
                        <ChevronDown size={12} />
                        <span>{task.status}</span>
                      </button>
                      {openStatusDropdown === task.id && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            {["To Do", "In Progress", "Pending", "Completed", "Not Started"].map((status) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(task.id, status)
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 touch-manipulation ${
                                  task.status === status ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`}></span>
                                <span>{status}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs lg:text-sm text-gray-600">Due: {task.dueDate}</span>
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTask(task)
                      setShowTaskDetailsModal(true)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Team Settings</h2>
              <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage your team configuration and members.</p>
            </div>
            <button
              onClick={handleSaveChanges}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Team Information</h3>
          <div className="space-y-4 lg:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Description</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Describe your team's mission and goals..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm lg:text-base"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Member Management</h3>
          <div className="space-y-3 lg:space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
                  <Avatar name={member.name} src={member.avatar} size="md" className="lg:w-12 lg:h-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 text-sm lg:text-base truncate">{member.name}</h4>
                      {member.isLead && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                          Team Lead
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}

      <div className="p-4 lg:p-6">
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "chat" && renderChat()}
        {activeSection === "tasks" && renderTasks()}
        {activeSection === "settings" && renderSettings()}
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Create New Task</h3>
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 touch-manipulation"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitTask} className="space-y-4 lg:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm lg:text-base"
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400 text-sm lg:text-base"
                    placeholder="Enter task description..."
                  />
                </div>

                <div className="flex space-x-3 pt-4 lg:pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors touch-manipulation"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Request Team Change</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                >
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Type your request here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Report an Issue</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                >
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Type your issue here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 touch-manipulation"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Title</h4>
                  <p className="text-gray-900 text-sm lg:text-base">{selectedTask.title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="flex items-start justify-between mb-4 lg:mb-6">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <Avatar name={selectedMember.name} src={selectedMember.avatar} size="lg" />
                  <div>
                    <h3 className="text-lg lg:text-2xl font-bold text-gray-900">{selectedMember.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs lg:text-sm font-medium px-3 py-1 rounded-full">
                      {selectedMember.role}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMemberModal(false)} 
                  className="text-gray-400 hover:text-gray-600 touch-manipulation"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
