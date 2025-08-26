"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

interface SplineSceneProps {
  sceneUrl: string
  className?: string
  fallback?: React.ReactNode
}

// Loading component
const SplineLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading 3D scene...</p>
    </div>
  </div>
)

// Error component
const SplineError = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-red-500 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm text-gray-600 mb-2">Failed to load 3D scene</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
)

const SplineSceneCore = ({ sceneUrl, className = "", fallback }: SplineSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const splineAppRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const loadSpline = async () => {
    if (typeof window === "undefined" || !canvasRef.current) {
      return
    }

    setIsLoading(true)
    setHasError(false)

    try {
      // Dynamic import with better error handling
      const { Application } = await import("@splinetool/runtime")
      
      if (canvasRef.current && !splineAppRef.current) {
        splineAppRef.current = new Application(canvasRef.current)
        
        // Add event listeners for better error handling
        splineAppRef.current.addEventListener('load', () => {
          setIsLoading(false)
          setHasError(false)
        })
        
        splineAppRef.current.addEventListener('error', (error: any) => {
          console.warn("Spline scene error:", error)
          setIsLoading(false)
          setHasError(true)
        })
        
        await splineAppRef.current.load(sceneUrl)
      }
    } catch (error) {
      console.warn("Failed to load Spline:", error)
      setIsLoading(false)
      setHasError(true)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    if (splineAppRef.current) {
      try {
        splineAppRef.current.dispose()
      } catch (error) {
        console.warn("Error disposing Spline app during retry:", error)
      }
      splineAppRef.current = null
    }
    loadSpline()
  }

  useEffect(() => {
    // Add a delay to ensure proper mounting and avoid hydration issues
    const timer = setTimeout(() => {
      loadSpline()
    }, 150)

    return () => {
      clearTimeout(timer)
      if (splineAppRef.current) {
        try {
          splineAppRef.current.dispose()
        } catch (error) {
          console.warn("Error disposing Spline app:", error)
        }
        splineAppRef.current = null
      }
    }
  }, [sceneUrl, retryCount])

  // Render loading state
  if (isLoading) {
    return fallback || <SplineLoader />
  }

  // Render error state
  if (hasError) {
    return <SplineError onRetry={handleRetry} />
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{
        background: "transparent",
        outline: "none",
        touchAction: "none", // Improve touch handling
      }}
    />
  )
}

// Export the component wrapped with dynamic import and SSR disabled
const SplineScene = dynamic(
  () => Promise.resolve(SplineSceneCore),
  {
    ssr: false,
    loading: () => <SplineLoader />,
  }
)

export default SplineScene