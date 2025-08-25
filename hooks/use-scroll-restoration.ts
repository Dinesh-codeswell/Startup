"use client"

import { useEffect } from "react"
import { usePathname } from 'next/navigation'

export function useScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    // Function to scroll to top
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    // Handle page refresh
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('scrollPosition')
    }

    // Handle page load
    const handleLoad = () => {
      // Check if this is a page refresh
      const navigation = performance.getEntriesByType('navigation')[0]
      const isRefresh = navigation?.type === 'reload' || performance.navigation.type === 1
      
      if (isRefresh) {
        // On refresh, scroll to top after a delay
        setTimeout(scrollToTop, 100)
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('load', handleLoad)

    // Scroll to top on pathname change (navigation)
    scrollToTop()

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('load', handleLoad)
    }
  }, [pathname])
}
