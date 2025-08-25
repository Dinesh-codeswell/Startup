"use client"

import { useEffect, useCallback } from 'react'

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const trackPageLoad = useCallback(() => {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        
      console.log('🚀 Page Performance:', {
  totalLoadTime: `${loadTime.toFixed(2)}ms`,
  domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
  firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A',
  firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 'N/A'
})
      }
    }
  }, [])

  const trackUserInteraction = useCallback((action: string, data?: any) => {
    if (typeof window !== 'undefined') {
      console.log('👤 User Interaction:', { action, data, timestamp: Date.now() })
    }
  }, [])

  const trackResourceLoad = useCallback((resourceName: string, loadTime: number) => {
    if (typeof window !== 'undefined') {
     console.log('📦 Resource Load:', { resourceName, loadTime: `${loadTime.toFixed(2)}ms` })
    }
  }, [])

  useEffect(() => {
    // Track initial page load
    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
      return () => window.removeEventListener('load', trackPageLoad)
    }
  }, [trackPageLoad])

  return {
    trackPageLoad,
    trackUserInteraction,
    trackResourceLoad
  }
}

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // More than 16ms (60fps threshold)
       console.warn(`⚠ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}
