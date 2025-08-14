import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'subtle'
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}: GlassCardProps) {
  const variants = {
    default: 'backdrop-filter backdrop-blur-10 bg-white/80 border border-white/20 shadow-lg',
    elevated: 'backdrop-filter backdrop-blur-16 bg-white/90 border border-white/30 shadow-xl',
    subtle: 'backdrop-filter backdrop-blur-6 bg-white/60 border border-white/10 shadow-md'
  }

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCardHeader({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-6 pb-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCardContent({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-6 pt-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCardTitle({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-xl font-semibold text-gray-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}