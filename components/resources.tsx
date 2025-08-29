"use client"

import Link from "next/link"
import { resources } from "@/data/resources"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Folder, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context" // Standard import
import { useResourcesCache, CachedResourceViews } from "@/lib/resources-cache"

/* Map resource.type -> icon */
const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "guide":
    case "checklist":
    case "template":
      return FileText
    case "toolkit":
      return Folder
    case "course":
    case "tutorial":
      return BarChart3
    default:
      return FileText
  }
}

/* Show only the first 3 featured items */
const topResources = resources.filter((r) => r.isFeatured).slice(0, 3)

export default function ResourcesContent() {
  const [isVisible, setIsVisible] = useState(false)
  const [viewsMap, setViewsMap] = useState<CachedResourceViews>({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth() // Destructure user and loading from useAuth
  const resourcesCache = useResourcesCache()

  // Load cached views data or fetch fresh data
  useEffect(() => {
    async function loadViews() {
      setIsLoading(true)
      
      try {
        // Get all resource IDs for the featured resources shown on homepage
        const featuredResourceIds = topResources.map(r => r.id)
        
        // Get cached data or fetch fresh data
        const viewsData = await resourcesCache.getResourceViews(featuredResourceIds)
        setViewsMap(viewsData)
        
        // Start background refresh for these resources
        resourcesCache.startBackgroundRefresh(featuredResourceIds)
      } catch (error) {
        console.error('Error loading resource views:', error)
        // Set fallback values
        const fallbackViews: CachedResourceViews = {}
        topResources.forEach(resource => {
          fallbackViews[resource.id] = 2500
        })
        setViewsMap(fallbackViews)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadViews()
    
    // Cleanup: stop background refresh when component unmounts
    return () => {
      resourcesCache.stopBackgroundRefresh()
    }
  }, [])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleGetNow = (resourceId: number) => {
    router.push(`/resources/${resourceId}`)
  }

  return (
    <section id="resources-section" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Title and Description Section */}
        <div
          className={`text-center mb-10 transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#081F5C] mb-4">Resources</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#4ebbf8] to-[#334EAC] rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Resources that actually help you crack it.
            <br />
            CVs, PM prep, Consulting kits, HR databases. Built for students, trusted by thousands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topResources.map((resource) => {
            const Icon = getIcon(resource.type)
            return (
              <article
                key={resource.id}
                className="relative border border-gray-200 rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col"
              >
                {resource.isFeatured && (
                  <span className="absolute top-4 right-4 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Featured
                  </span>
                )}

                {/* Icon */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-grow">
                  {/* Title & description */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{resource.title}</h3>
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">{resource.description}</p>

                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Views & type */}
                <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {isLoading ? '...' : (viewsMap[resource.id] || 2500).toLocaleString()} Views
                  </span>
                  <Badge variant="outline" className="text-xs capitalize ml-auto">
                    {resource.type}
                  </Badge>
                </div>

                {/* Action */}
                <Button
                  onClick={() => handleGetNow(resource.id)}
                  variant="outline"
                  className="w-full border-blue-200 bg-transparent text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Get Now
                </Button>
              </article>
            )
          })}
        </div>

        {/* View-more button */}
        <div className="mt-10 text-center">
          <Link href="/resources">
            <Button size="lg" variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100">
              View&nbsp;More&nbsp;Resources
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
