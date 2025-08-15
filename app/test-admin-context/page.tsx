"use client"

import { AdminExample } from "@/components/admin/AdminExample"
import { withAdminProtection } from "@/components/admin/AdminProtection"

function TestAdminContextPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Context Test Page</h1>
        <AdminExample />
      </div>
    </div>
  )
}

// Export the protected component
export default withAdminProtection(TestAdminContextPage, {
  redirectTo: '/login'
})