'use client';

import { notFound } from "next/navigation"
import { resources } from "@/data/resources"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useResourcesCache } from "@/lib/resources-cache"

interface PageProps {
  params: { id: string }
}

export default function ResourceDetailPage({ params }: PageProps) {
  const resourceId = Number(params.id)
  const resource = resources.find((r) => r.id === resourceId)
  const [viewCount, setViewCount] = useState<number>(2500)
  const [isLoading, setIsLoading] = useState(true)
  const resourcesCache = useResourcesCache()

  useEffect(() => {
    async function handleResourceView() {
      setIsLoading(true)
      
      try {
        // First, get cached view count to show immediately
        const cachedViews = resourcesCache.getCachedViews()
        if (cachedViews && cachedViews[resourceId]) {
          setViewCount(cachedViews[resourceId])
        }
        
        // Increment the view count (this still needs to happen for individual page visits)
        await fetch(`/api/resources/${resourceId}/views`, { method: "POST" })
        
        // Force refresh the cache for this resource to get the updated count
        const updatedViews = await resourcesCache.forceRefresh([resourceId])
        setViewCount(updatedViews[resourceId] || 2500)
      } catch (error) {
        console.error('Error handling resource view:', error)
        setViewCount(2500)
      } finally {
        setIsLoading(false)
      }
    }
    
    handleResourceView()
  }, [resourceId, resourcesCache])

  if (!resource) {
    notFound()
  }

  return (
    <main className="bg-white py-16">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#081F5C]">{resource.title}</h1>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {isLoading ? '...' : viewCount.toLocaleString()} views
          </div>
          <Badge variant="outline" className="capitalize">
            {resource.type}
          </Badge>
        </div>

        {/* Description */}
        <p className="mt-6 text-gray-700 leading-relaxed">{resource.description}</p>

        {/* Tags */}
        <div className="mt-6 flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
              {tag}
            </Badge>
          ))}
        </div>

        {/* External link */}
        <div className="mt-10">
          <Button asChild size="lg" className="bg-[#081F5C] hover:bg-[#0d296b] text-white">
            <a href={resource.link} target="_blank" rel="noopener noreferrer">
              Visit Resource
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
