"use client"

import type React from "react"
import Link from "next/link"
import { useAdmin } from "@/contexts/admin-context"
import { AdminBadge } from "./AdminBadge"

interface AdminNavigationProps {
  className?: string
  variant?: "dropdown" | "horizontal" | "vertical"
  showBadge?: boolean
}

interface AdminNavItem {
  href: string
  label: string
  icon?: React.ReactNode
  description?: string
}

const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Admin Dashboard",
    description: "Overview of system metrics and controls",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    href: "/admin/case-match",
    label: "Case Match Admin",
    description: "Manage case competition team matching",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    href: "/rl-dashboard",
    label: "RL Dashboard",
    description: "Reinforcement learning metrics and monitoring",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
]

/**
 * Navigation component that shows admin-only navigation items
 * Only renders for authenticated admin users
 */
export function AdminNavigation({ 
  className = "", 
  variant = "dropdown",
  showBadge = false 
}: AdminNavigationProps) {
  const { isAdmin, isLoading } = useAdmin()

  // Don't render anything if not admin or still loading
  if (!isAdmin || isLoading) {
    return null
  }

  const renderNavItems = () => {
    switch (variant) {
      case "dropdown":
        return (
          <div className="py-1">
            {showBadge && (
              <div className="px-4 py-2 border-b border-gray-100">
                <AdminBadge variant="compact" />
              </div>
            )}
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {item.icon && (
                  <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                    {item.icon}
                  </span>
                )}
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )

      case "horizontal":
        return (
          <div className="flex items-center space-x-4">
            {showBadge && <AdminBadge variant="compact" />}
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>
        )

      case "vertical":
        return (
          <nav className="space-y-1">
            {showBadge && (
              <div className="px-3 py-2">
                <AdminBadge />
              </div>
            )}
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                {item.icon && (
                  <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                    {item.icon}
                  </span>
                )}
                <div>
                  <div>{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </nav>
        )

      default:
        return null
    }
  }

  return (
    <div className={className}>
      {renderNavItems()}
    </div>
  )
}

/**
 * Hook to get admin navigation items
 * Useful for custom navigation implementations
 */
export function useAdminNavigation() {
  const { isAdmin, isLoading } = useAdmin()
  
  return {
    isAdmin,
    isLoading,
    navItems: isAdmin ? adminNavItems : [],
    hasAccess: isAdmin && !isLoading
  }
}