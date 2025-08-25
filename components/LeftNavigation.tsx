"use client"

import { Users, MessageSquare, CheckSquare, Settings, Lock } from "lucide-react"

interface LeftNavigationProps {
  activeRoute: string
  onRouteChange: (route: string) => void
  unreadCounts: { chat: number; tasks: number }
  isMobileMenuOpen: boolean
  currentUserRole: string
}

export default function LeftNavigation({
  activeRoute,
  onRouteChange,
  unreadCounts,
  isMobileMenuOpen,
  currentUserRole,
}: LeftNavigationProps) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Users,
      route: "dashboard",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      route: "chat",
      badge: unreadCounts.chat,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      route: "tasks",
      badge: unreadCounts.tasks,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      route: "settings",
    },
  ]

  const isTeamForming = false

  return (
    <nav
      className={`
        h-[calc(100vh-4rem)] w-64 
        bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg 
        transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        <div className="px-4 space-y-1 py-2">
          {navItems.map((item) => {
            const isActive = activeRoute === item.route
            const isTasksLocked = item.route === "tasks" && isTeamForming
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
                color: "text-orange-600",
                bgColor: "bg-gradient-to-r from-orange-50 to-orange-100",
                iconBg: "bg-orange-100",
              },
            }
            const itemColors = colors[item.route] || colors.dashboard

            return (
              <button
                key={item.id}
                onClick={() => !isTeamForming && onRouteChange(item.route)}
                className={`w-full flex items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 group relative py-2 ${
                  isActive || isTasksLocked
                    ? `${colors[item.route]?.bgColor || "bg-gray-100"} ${colors[item.route]?.color || "text-gray-900"} shadow-sm`
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
                ${isTeamForming ? "cursor-not-allowed opacity-75" : "cursor-pointer"}
              `}
                disabled={isTeamForming}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-colors duration-200
                    ${
                      isActive || isTasksLocked
                        ? colors[item.route]?.iconBg || "bg-gray-200"
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }
                  `}
                >
                  <item.icon
                    size={18}
                    className={`
                      ${
                        isActive || isTasksLocked
                          ? colors[item.route]?.color || "text-gray-700"
                          : "text-gray-600 group-hover:text-gray-700"
                      }
                    `}
                  />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {isTeamForming && (item.route === "chat" || item.route === "tasks") ? (
                  <Lock size={12} className="text-gray-400" />
                ) : (
                  item.badge &&
                  item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )
                )}
              </button>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 mt-auto">
          <div className="text-center">
            <p className="text-xs text-gray-500">Beyond Career </p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
