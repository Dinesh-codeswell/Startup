"use client"

import { useMemo, useState } from "react"

interface AvatarProps {
  name: string
  src?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)

  // Treat empty/placeholder-like URLs as "no image"
  const hasValidSrc = useMemo(() => {
    const s = (src || "").trim()
    if (!s) return false
    // block common placeholders you were using earlier
    if (/placeholder(\.svg)?/i.test(s)) return false
    if (/default|avatar-placeholder|dummy|usericon/i.test(s)) return false
    return true
  }, [src])

  const showInitials = !hasValidSrc || imgFailed

  const initials = useMemo(() => {
    const i =
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    return i
  }, [name])

  const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  // Fixed palette so Tailwind won't purge
  const palette = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ]

  const colorClass = useMemo(() => {
    const hash = Array.from(name || "").reduce((a, c) => a + c.charCodeAt(0), 0)
    return palette[hash % palette.length]
  }, [name])

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} text-white rounded-full flex items-center justify-center font-medium overflow-hidden flex-shrink-0 ${className}`}
      aria-label={name}
      title={name}
    >
      {showInitials ? (
        <span className="select-none">{initials}</span>
      ) : (
        <img
          key={src} // ensure re-render if src changes
          src={src || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      )}
    </div>
  )
}
