"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Routes to prefetch based on user behavior
const PREFETCH_ROUTES = {
  homepage: ['/team', '/login', '/signup'],
  authenticated: ['/team-dashboard', '/profile', '/admin/dashboard'],
  team: ['/team-dashboard', '/'],
  login: ['/team', '/'],
}

export function usePrefetchRoutes(currentRoute: keyof typeof PREFETCH_ROUTES) {
  const router = useRouter()

  useEffect(() => {
    const routes = PREFETCH_ROUTES[currentRoute]
    if (!routes) return

    // Prefetch routes after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      routes.forEach((route) => {
        router.prefetch(route)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentRoute, router])
}

// Intersection Observer based prefetching for links
export function useLinkPrefetch() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement
            const href = link.getAttribute('href')
            
            if (href && href.startsWith('/')) {
              // Prefetch the route
              import('next/router').then(({ default: Router }) => {
                Router.prefetch(href)
              })
            }
          }
        })
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]')
    links.forEach((link) => observer.observe(link))

    return () => {
      observer.disconnect()
    }
  }, [])
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // Preload critical images
  const criticalImages = [
    '/images/beyond-career-logo.png',
    '/images/beyond-career-logo.svg',
  ]

  criticalImages.forEach((src) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })

  // Preload critical fonts
  const criticalFonts = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  ]

  criticalFonts.forEach((href) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  })
}