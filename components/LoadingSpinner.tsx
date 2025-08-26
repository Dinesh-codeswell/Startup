"use client"

import { memo } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'gray' | 'white'
  text?: string
  fullScreen?: boolean
}

function LoadingSpinnerComponent({ 
  size = 'md', 
  color = 'blue', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-white flex items-center justify-center'
    : 'flex items-center justify-center p-4'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-b-2 mx-auto mb-2 ${sizeClasses[size]} ${colorClasses[color]}`}
          role="status"
          aria-label="Loading"
        />
        {text && (
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export const LoadingSpinner = memo(LoadingSpinnerComponent)

// Skeleton loading components
export const SkeletonCard = memo(() => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-48 w-full mb-4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 rounded h-4 w-3/4"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
    </div>
  </div>
))

export const SkeletonText = memo(({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i}
        className={`bg-gray-200 rounded h-4 ${
          i === lines - 1 ? 'w-2/3' : 'w-full'
        }`}
      />
    ))}
  </div>
))

export const SkeletonButton = memo(() => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
))