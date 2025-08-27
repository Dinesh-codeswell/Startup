import React from 'react'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  role?: string
  className?: string
  showStatus?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl'
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500'
}

const roleColors = {
  'Team Lead': 'from-purple-500 to-pink-500 border-purple-300',
  'Creative Thinker': 'from-blue-500 to-cyan-500 border-blue-300',
  'Data Expert': 'from-green-500 to-emerald-500 border-green-300',
  'Researcher': 'from-orange-500 to-red-500 border-orange-300',
  'Designer': 'from-pink-500 to-rose-500 border-pink-300',
  'Presenter': 'from-indigo-500 to-purple-500 border-indigo-300',
  default: 'from-gray-500 to-gray-600 border-gray-300'
}

export function UserAvatar({ 
  name, 
  size = 'md', 
  status = 'offline',
  role,
  className,
  showStatus = true
}: UserAvatarProps) {
  // Handle undefined/null name gracefully
  const safeName = name || "User"
  const initials = safeName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleColorClass = role && roleColors[role as keyof typeof roleColors] 
    ? roleColors[role as keyof typeof roleColors]
    : roleColors.default

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br border-2 transition-all duration-200 hover:scale-105',
          sizeClasses[size],
          roleColorClass
        )}
      >
        {initials}
      </div>
      
      {showStatus && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}

interface AvatarStackProps {
  users: Array<{
    name?: string | null
    role?: string
    status?: 'online' | 'offline' | 'away' | 'busy'
  }>
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AvatarStack({ users, max = 4, size = 'sm', className }: AvatarStackProps) {
  const displayUsers = users.slice(0, max)
  const remainingCount = users.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={index}
          name={user.name}
          size={size}
          status={user.status}
          role={user.role}
          className="ring-2 ring-white hover:z-10 relative"
        />
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-gray-600 bg-gray-200 border-2 border-white ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}