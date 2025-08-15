"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Send, Paperclip, Smile } from "lucide-react"

// SVG Icons
const Dashboard = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const MessageCircle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const Settings = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
  </svg>
)

const Edit = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

interface TeamDashboardProps {
  onClose?: () => void
}

export function TeamDashboard({ onClose }: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [message, setMessage] = useState("")

  // Mock team data - in real app this would come from props or API
  const teamData = {
    teamName: "Team Name",
    members: [
      {
        id: 1,
        name: "Sarah",
        university: "Stanford University",
        role: "Team Lead",
        roleColor: "bg-blue-100 text-blue-700",
        skills: ["Strategic Thinking", "Leadership", "Data Analysis"],
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        name: "Name 2",
        university: "MIT",
        role: "Researcher",
        roleColor: "bg-purple-100 text-purple-700",
        skills: ["Market Research", "Analytics", "Problem Solving"],
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        name: "Name3",
        university: "Harvard Business School",
        role: "Designer",
        roleColor: "bg-green-100 text-green-700",
        skills: ["UI/UX Design", "Creative Thinking", "Prototyping"],
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  }

  // Mock chat messages
  const chatMessages = [
    {
      id: 1,
      sender: "Marcus Johnson",
      time: "09:05 PM",
      message: "Just finished the initial market research. The data looks promising!",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 2,
      sender: "Elena Rodriguez",
      time: "09:15 PM",
      message: "Great work! I'll start working on the design concepts based on your findings.",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 3,
      sender: "Sarah Chen",
      time: "09:30 PM",
      message: "Excellent progress team! Let's schedule a sync for tomorrow to align on next steps.",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const sidebarItems = [
    { name: "Dashboard", icon: Dashboard },
    { name: "TeamChat", icon: MessageCircle },
    { name: "Setting", icon: Settings },
  ]

  const features = [
    { title: "Feature 1", icon: Dashboard },
    { title: "Feature 2", icon: Dashboard },
    { title: "Feature 3", icon: Dashboard },
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // In real app, this would send the message to the backend
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  const renderDashboard = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{teamData.teamName}</h1>
        <Button variant="outline" className="bg-gray-800 text-white hover:bg-gray-700">
          <Edit className="w-4 h-4 mr-2" />
          CTA Button for Edit
        </Button>
      </div>

      {/* Team Members Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <span className="text-gray-600 font-medium">{teamData.members.length} Members</span>
          </div>

          <div className="space-y-6">
            {teamData.members.map((member) => (
              <div key={member.id} className="flex items-start space-x-4">
                <img
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <Badge className={`${member.roleColor} border-0`}>{member.role}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{member.university}</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <feature.icon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600 font-medium">Dashboard</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )

  const renderTeamChat = () => (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Team Chat</h1>
        <p className="text-gray-600 text-sm">4 members, 3 unread messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex items-start space-x-3">
            <img
              src={msg.avatar || "/placeholder.svg"}
              alt={msg.sender}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-gray-900 text-sm">{msg.sender}</span>
                <span className="text-gray-500 text-xs">{msg.time}</span>
              </div>
              <p className="text-gray-700 text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="pr-20"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Paperclip className="h-4 w-4 text-gray-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Smile className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Team Settings</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <Input value={teamData.teamName} className="max-w-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit Teammates
            </Button>
          </div>
          <div className="space-y-4">
            {teamData.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={member.avatar || "/placeholder.svg"}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-gray-600 text-sm">{member.university}</p>
                  </div>
                  <Badge className={`${member.roleColor} border-0`}>{member.role}</Badge>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-semibold text-gray-800">SaaS De...</span>
              </div>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.name
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "Dashboard" && renderDashboard()}
          {activeTab === "TeamChat" && renderTeamChat()}
          {activeTab === "Setting" && renderSettings()}
        </div>
      </div>
    </div>
  )
}
