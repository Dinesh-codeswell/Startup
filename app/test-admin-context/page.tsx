"use client"

import { AdminExample } from "@/components/admin/AdminExample"

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

// Export the component (admin protection removed - now publicly accessible)
export default TestAdminContextPage
