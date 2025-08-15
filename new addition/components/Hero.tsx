"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Briefcase, GraduationCap, BookOpen, Target, Map } from "lucide-react"

// Safely import useAuth with error handling
let useAuth: any
try {
  const authModule = require("@/contexts/auth-context")
  useAuth = authModule.useAuth
} catch (error) {
  console.warn("Auth context not available:", error)
  useAuth = () => ({ user: null, loading: false })
}

// Pre-optimized Spline component - no loading state
const DynamicSplineScene = dynamic(() => import("./spline-scene"), {
  ssr: false,
})

const Hero = () => {
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const authContext = useAuth()

  // Memoize auth state to prevent re-renders
  const authState = useMemo(() => ({
    user: authContext?.user || null,
    loading: authContext?.loading || false
  }), [authContext?.user, authContext?.loading])

  useEffect(() => {
    setUser(authState.user)

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Only run watermark removal on desktop
    if (!isMobile) {
      // ULTRA-AGGRESSIVE watermark removal - no delays
      const hideWatermarks = () => {
        const selectors = [
          "a[href*='spline.design']",
          "[class*='watermark']",
          "[id*='watermark']",
          "a[target='_blank'][href*='spline']"
        ]
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            (el as HTMLElement).style.cssText = "display: none !important; visibility: hidden !important;"
          })
        })
      }

      // Immediate execution
      hideWatermarks()
      
      // Continuous hiding with minimal intervals
      const aggressiveCheck = setInterval(hideWatermarks, 5) // Every 5ms
      
      // MutationObserver for instant detection
      const observer = new MutationObserver(hideWatermarks)
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id']
      })

      // Clean up after 1 second
      setTimeout(() => {
        clearInterval(aggressiveCheck)
        observer.disconnect()
      }, 1000)

      return () => {
        clearInterval(aggressiveCheck)
        observer.disconnect()
        window.removeEventListener('resize', checkMobile)
      }
    }

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [authState, isMobile])

  // Skip loading entirely
  if (authState.loading) {
    return null // Don't show loading spinner
  }

  return (
    <section className="relative flex items-center justify-center bg-gradient-to-br from-white via-[#F7F2EB]/30 to-[#BAD6EB]/20 py-8 lg:py-16 lg:min-h-screen overflow-hidden">
      {/* Static background elements - no animations */}
      <div className="absolute top-20 left-4 md:left-10 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-r from-[#4ebbf8]/10 to-[#334EAC]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-4 md:right-10 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-r from-[#BAD6EB]/20 to-[#4ebbf8]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 lg:grid lg:grid-cols-2 lg:gap-8 lg:gap-12 lg:items-center">
        {/* Left column - completely static */}
        <div className="text-center lg:text-left lg:col-span-1 flex flex-col justify-center lg:min-h-0">
          <div className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-full text-sm font-medium text-[#4ebbf8] mb-4 md:mb-6">
            ✨ All About Your Dreams
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#081F5C] leading-tight mb-4 md:mb-6">
            Built for Students,
            <span className="bg-gradient-to-r from-[#4ebbf8] to-[#334EAC] bg-clip-text text-transparent">
              {" "}
              Who Refuse to Wait.
            </span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-black/70 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Beyond Career is India&apos;s first all-in-one execution ecosystem for consulting, product, data, business
            and strategy roles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            {user ? (
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#334EAC] to-[#4ebbf8] text-white w-full sm:w-auto hover:opacity-90"
                >
                  Explore Platform
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#334EAC] to-[#4ebbf8] text-white w-full sm:w-auto hover:opacity-90"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Image - only visible on mobile */}
        <div className="relative mt-8 lg:hidden flex justify-center">
          <div className="relative w-[350px] h-[300px] md:h-[400px] ">
            <Image
              src="/images/Group 1000001875.png" // Replace with your image path
              alt="Beyond Career Platform"
              fill
              className="object-cover"
              priority
            />
            
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent" />
            
            {/* Mobile floating badges */}
          </div>
        </div>

        {/* Right column - Desktop only Spline scene */}
        <div className="relative hidden lg:block">
          <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
            {/* Instant Spline scene - desktop only */}
            <div className="absolute inset-0 scale-150 origin-center">
              <DynamicSplineScene sceneUrl="https://prod.spline.design/Gt17pQ-CXEgcTVUl/scene.splinecode" />
            </div>

            {/* Seamless blending overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#BAD6EB]/3 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

            {/* Static floating badges - desktop only */}
            <div className="absolute top-[15%] right-[20%] bg-white text-red-500 px-3 py-2 rounded-full shadow-lg text-sm font-medium z-30 flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              Jobs
            </div>
            
            <div className="absolute top-[20%] left-[15%] bg-white text-blue-500 px-3 py-2 rounded-full shadow-lg text-sm font-medium z-30 flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              Internships
            </div>
            
            <div className="absolute bottom-[25%] left-[20%] bg-white text-yellow-600 px-3 py-2 rounded-full shadow-lg text-sm font-medium z-30 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Resources
            </div>
            
            <div className="absolute top-[50%] right-[3%] bg-white text-purple-600 px-3 py-2 rounded-full shadow-lg text-sm font-medium z-30 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Placements
            </div>
            
            <div className="absolute bottom-[10%] right-[20%] bg-white text-green-600 px-3 py-2 rounded-full shadow-lg text-sm font-medium z-30 flex items-center gap-1">
              <Map className="w-4 h-4" />
              Roadmap
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
export { Hero }
