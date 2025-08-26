// Performance monitoring utilities
import React from 'react'

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Start timing an operation
  startTiming(label: string): void {
    this.metrics.set(label, performance.now())
  }

  // End timing and log the result
  endTiming(label: string): number {
    const startTime = this.metrics.get(label)
    if (!startTime) {
      console.warn(`No start time found for ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.delete(label)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }

  // Measure component render time
  measureRender<T>(componentName: string, renderFn: () => T): T {
    this.startTiming(`${componentName} render`)
    const result = renderFn()
    this.endTiming(`${componentName} render`)
    return result
  }

  // Measure API call time
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    this.startTiming(`API: ${apiName}`)
    try {
      const result = await apiCall()
      this.endTiming(`API: ${apiName}`)
      return result
    } catch (error) {
      this.endTiming(`API: ${apiName}`)
      throw error
    }
  }
}

// Hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    startTiming: (label: string) => monitor.startTiming(`${componentName}: ${label}`),
    endTiming: (label: string) => monitor.endTiming(`${componentName}: ${label}`),
    measureRender: <T>(renderFn: () => T) => monitor.measureRender(componentName, renderFn),
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

