'use client'

import { TeamMatchingDashboard } from '@/components/admin/TeamMatchingDashboard'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage team matching and case competitions</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <a
              href="/admin/dashboard"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Team Matching
            </a>
            <a
              href="/admin/case-match"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              CSV Case Matching
            </a>
            <a
              href="/rl-dashboard"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              RL Dashboard
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <TeamMatchingDashboard />
      </div>
    </div>
  )
}