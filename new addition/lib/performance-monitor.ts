"use client"


import { useState, useEffect } from 'react'
import { performanceDashboard } from '@/lib/performance-dashboard'
import { serverCache } from '@/lib/server-cache'


export function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState<any>({})


  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return


    const interval = setInterval(() => {
      setStats({
        performance: performanceDashboard.getStats(),
        cache: serverCache.getStats()
      })
    }, 5000) // Update every 5 seconds


    return () => clearInterval(interval)
  }, [])


  // Only render in development and when visible
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Dashboard"
      >
        📊
      </button>
    )
  }


  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Performance Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
     
      <div className="space-y-2 text-xs">
        <div>
          <strong>API Calls:</strong> {stats.performance?.totalAPICalls || 0}
        </div>
        <div>
          <strong>Cache Hit Rate:</strong> {stats.performance?.cacheHitRate || '0%'}
        </div>
        <div>
          <strong>Avg Response:</strong> {stats.performance?.avgResponseTime || '0ms'}
        </div>
        <div>
          <strong>Cache Size:</strong> {stats.cache?.viewCountsSize || 0}
        </div>
        <div>
          <strong>Errors:</strong> {stats.performance?.errors || 0}
        </div>
      </div>
    </div>
  )
}
