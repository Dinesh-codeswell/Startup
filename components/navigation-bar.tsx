"use client"

import { useState } from "react"
import { Users, MessageSquare, CheckSquare, FileText, Settings, Menu, X } from "lucide-react"

interface NavigationBarProps {
  activeRoute?: string
  onRouteChange?: (route: string) => void
  unreadCounts?: {
    chat: number
    tasks: number
  }
  currentUserRole?: string
  className?: string
}

// Feature flags and permissions (simplified for standalone use)
const FEATURE_FLAGS = {
  tasks: true,
  files: true,
}

const ROLE_PERMISSIONS = {
  canAccessSettings: (role: string) => ["admin", "manager", "member"].includes(role),
}

export default function NavigationBar({
  activeRoute = "dashboard",
  onRouteChange = () => {},
  unreadCounts = { chat: 0, tasks: 0 },
  currentUserRole = "member",
  className = "",
}: NavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <div className={className}>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 lg:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">My Team</h1>
          </div>
        </div>
      </header>

      {/* Navigation Sidebar */}
      <nav
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
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
                      <div
                        className={`p-2 rounded-lg bg-slate-100 ${isActive ? itemColors.iconBg : "bg-gray-100"} transition-colors`}
                      >
                        <item.icon size={16} />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm animate-pulse">
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
                <p className="text-xs text-gray-500">Beyond Career</p>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
