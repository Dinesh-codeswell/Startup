"use client"

import type React from "react"
import { useAdmin } from "@/contexts/admin-context"

interface AdminBadgeProps {
  className?: string
  variant?: "default" | "compact" | "icon-only"
}

/**
 * Badge component that displays admin status
 * Only visible to authenticated admin users
 */
export function AdminBadge({ className = "", variant = "default" }: AdminBadgeProps) {
  const { isAdmin, isLoading } = useAdmin()

  // Don't render anything if not admin or still loading
  if (!isAdmin || isLoading) {
    return null
  }

  const baseClasses = "inline-flex items-center font-medium"
  
  const variantClasses = {
    default: "px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200",
    compact: "px-2 py-1 rounded text-xs bg-blue-600 text-white",
    "icon-only": "p-1 rounded-full bg-blue-100 text-blue-600"
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  if (variant === "icon-only") {
    return (
      <span className={classes} title="Administrator">
        <svg 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
          />
        </svg>
      </span>
    )
  }

  return (
    <span className={classes}>
      {variant === "compact" ? (
        <>
          <svg 
            className="h-3 w-3 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
            />
          </svg>
          Admin
        </>
      ) : (
        <>
          <svg 
            className="h-3 w-3 mr-1.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
            />
          </svg>
          Administrator
        </>
      )}
    </span>
  )
}