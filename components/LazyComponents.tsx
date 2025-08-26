"use client"

import { lazy, Suspense } from "react"

// Loading component for lazy-loaded components
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Lazy load heavy components
export const LazyTeamMatchingQuestionnaire = lazy(() => 
  import("@/components/team-matching-questionnaire").then(module => ({
    default: module.TeamMatchingQuestionnaire
  }))
)

export const LazyAdminDashboard = lazy(() => 
  import("@/components/admin/TeamMatchingDashboard").then(module => ({
    default: module.TeamMatchingDashboard
  }))
)

// Wrapper components with Suspense
export function TeamMatchingQuestionnaireWrapper(props: any) {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <LazyTeamMatchingQuestionnaire {...props} />
    </Suspense>
  )
}

export function AdminDashboardWrapper(props: any) {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <LazyAdminDashboard {...props} />
    </Suspense>
  )
}