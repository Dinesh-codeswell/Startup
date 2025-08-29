"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, ChevronDown, Users, UserCheck, Settings } from "lucide-react"
import { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useAdmin } from "@/contexts/admin-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OptimizedImage } from "@/components/OptimizedImage"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)


  const auth = useAuth() // Use the useAuth hook for proper error handling
  const { isAdmin, isLoading: adminLoading } = useAdmin() // Get admin status
  const router = useRouter()

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Resources", href: "/resources" },
    { name: "Opportunities", href: "/opportunities" },
    { name: "Events", href: "/events" },
    { name: "CareerAI", href: "/community" },
    { name: "About", href: "/about" },
  ]

  // Handle Find a Team click with enhanced workflow logic
  const handleFindTeamClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!auth?.user) {
      // Redirect to login page
      router.push('/login')
    } else {
      // User is signed in, check their status to determine redirect
      try {
        const response = await fetch(`/api/team-matching/user-status?user_id=${auth.user.id}`)
        const data = await response.json()
        
        if (data.success) {
          // If user has submitted questionnaire (with or without team), go to team dashboard
          if (data.data.hasSubmitted) {
            router.push('/team/dashboard')
          } else {
            // If user hasn't submitted, go to team page (shows questionnaire)
            router.push('/team')
          }
        } else {
          // Fallback: go to team page
          router.push('/team')
        }
      } catch (error) {
        console.error('Error checking user status:', error)
        // Fallback: go to team page
        router.push('/team')
      }
    }
  }, [auth?.user, router])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown')
      const button = event.target as HTMLElement
      
      if (dropdown && !dropdown.contains(button) && !button.closest('[data-profile-button]')) {
        dropdown.classList.add('hidden')
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // If auth context is not available, render a basic header or null
  if (!auth) {
    return (
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <OptimizedImage
                src="/images/beyond-career-logo.png"
                alt="Beyond Career"
                width={200}
                height={60}
                className="h-12 md:h-14 w-auto object-contain hover:opacity-90 transition-opacity duration-300"
                priority
              />
              <span className="text-2xl md:text-3xl font-extrabold text-[#081F5C] logo-fallback hidden">
                Beyond Career
              </span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
    )
  }

  const { user, profile, signOut, loading } = auth // Destructure from the context value

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [signOut])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <OptimizedImage
              src="/images/beyond-career-logo.png"
              alt="Beyond Career"
              width={200}
              height={60}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain hover:opacity-90 transition-opacity duration-300"
              priority
            />
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#081F5C] logo-fallback hidden">
              Beyond Career
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium relative group text-sm xl:text-base"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            
            {/* Find a Team - Direct Link */}
            <button
              onClick={handleFindTeamClick}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium relative group text-sm xl:text-base"
            >
              Find a Team
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </button>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0 relative">
            {loading ? (
              // Show loading state to prevent flickering
              <div className="flex items-center space-x-3">
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
                <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : user ? (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 xl:px-4 py-2 bg-transparent text-sm cursor-pointer"
                  data-profile-button
                  onClick={() => {
                    const dropdown = document.getElementById('profile-dropdown')
                    if (dropdown) {
                      dropdown.classList.toggle('hidden')
                    }
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden xl:inline">{profile?.first_name || "Profile"}</span>
                  <span className="xl:hidden">Profile</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
                
                {/* Custom Dropdown */}
                <div
                  id="profile-dropdown"
                  className="hidden absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        document.getElementById('profile-dropdown')?.classList.add('hidden')
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                    <Link
                      href="/team-dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        document.getElementById('profile-dropdown')?.classList.add('hidden')
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      My Team
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            document.getElementById('profile-dropdown')?.classList.add('hidden')
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        document.getElementById('profile-dropdown')?.classList.add('hidden')
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 xl:px-4 py-2 bg-transparent text-sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 xl:px-4 py-2 text-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300 flex-shrink-0 ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-screen opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium py-3 px-3 rounded-lg hover:bg-gray-50 text-base"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Find a Team - Mobile */}
            <button
              onClick={(e) => {
                handleFindTeamClick(e)
                setIsMenuOpen(false)
              }}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium py-3 px-3 rounded-lg hover:bg-gray-50 text-base w-full text-left"
            >
              Find a Team
            </button>
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
              {loading ? (
                // Show loading state to prevent flickering
                <div className="flex flex-col space-y-3">
                  <div className="w-full h-12 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-full h-12 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : user ? (
                <>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent justify-start py-3 text-base"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Button>
                  </Link>
                  <Link href="/team-dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent justify-start py-3 text-base"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      My Team
                    </Button>
                  </Link>
                  {/* Admin-only mobile menu items */}
                  {isAdmin && (
                    <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent justify-start py-3 text-base"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 bg-transparent justify-start py-3 text-base"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent justify-start py-3 text-base"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start py-3 text-base">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export { Header }
export default Header
