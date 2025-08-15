"use client"

import type React from "react"
import { useAdmin } from "@/contexts/admin-context"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminBadge } from "./AdminBadge"
import { AdminNavigation } from "./AdminNavigation"
import { AdminProtection } from "./AdminProtection"

/**
 * Example component demonstrating various admin context usage patterns
 * This component shows different ways to use the admin context and hooks
 */
export function AdminExample() {
  const { isAdmin, isLoading, error } = useAdmin()
  const { 
    hasAdminAccess, 
    status, 
    canAccess, 
    getRedirectUrl 
  } = useAdminPermissions()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Admin Context Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Basic Admin Context</h3>
            <div className="text-sm space-y-1">
              <div>Is Admin: <span className="font-mono">{isAdmin.toString()}</span></div>
              <div>Is Loading: <span className="font-mono">{isLoading.toString()}</span></div>
              <div>Error: <span className="font-mono">{error || "none"}</span></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Admin Permissions Hook</h3>
            <div className="text-sm space-y-1">
              <div>Has Access: <span className="font-mono">{hasAdminAccess.toString()}</span></div>
              <div>Status: <span className="font-mono">{status.status}</span></div>
              <div>Can Access Features: <span className="font-mono">{canAccess().toString()}</span></div>
              <div>Redirect URL: <span className="font-mono">{getRedirectUrl() || "none"}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Admin UI Components</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Admin Badge Variants</h3>
            <div className="flex items-center space-x-4">
              <AdminBadge variant="default" />
              <AdminBadge variant="compact" />
              <AdminBadge variant="icon-only" />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Admin Navigation (Dropdown)</h3>
            <div className="border rounded-lg">
              <AdminNavigation variant="dropdown" showBadge={true} />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Admin Navigation (Horizontal)</h3>
            <AdminNavigation variant="horizontal" showBadge={true} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Protected Content Examples</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Simple Admin-Only Content</h3>
            {isAdmin ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">✅ This content is only visible to admins!</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                <p className="text-gray-600">🔒 Admin content hidden</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Protected Component</h3>
            <AdminProtection
              fallback={
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800">⚠️ Admin access required to view this content</p>
                </div>
              }
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800">🎉 Protected admin content is visible!</p>
                <div className="mt-2 text-sm text-blue-600">
                  This content is wrapped in AdminProtection component
                </div>
              </div>
            </AdminProtection>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Status Information</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

/**
 * Example of a component protected by the withAdminProtection HOC
 */
const ProtectedAdminComponent = () => (
  <div className="p-4 bg-purple-50 border border-purple-200 rounded">
    <h3 className="font-semibold text-purple-800">HOC Protected Component</h3>
    <p className="text-purple-600">This component is protected using withAdminProtection HOC</p>
  </div>
)

// Export the HOC-protected version
export const ExampleProtectedComponent = () => (
  <AdminProtection>
    <ProtectedAdminComponent />
  </AdminProtection>
)