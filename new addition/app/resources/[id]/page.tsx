"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Folder,
  BarChart3,
  Eye,
  Calendar,
  User,
  Star,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react"
import { resources } from "@/data/resources"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

const getResourceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "guide":
      return FileText
    case "template":
      return FileText
    case "checklist":
      return FileText
    case "toolkit":
      return Folder
    case "course":
      return BarChart3
    default:
      return FileText
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return "bg-green-100 text-green-800"
    case "intermediate":
      return "bg-yellow-100 text-yellow-800"
    case "advanced":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getTypeSpecificContent = (type: string) => {
  switch (type.toLowerCase()) {
    case "guide":
      return {
        included: [
          "Step-by-step instructions",
          "Best practices and tips",
          "Real-world examples",
          "Common pitfalls to avoid",
          "Actionable takeaways",
        ],
        audience: ["Career changers", "Recent graduates", "Professional development seekers"],
      }
    case "template":
      return {
        included: [
          "Customizable templates",
          "Professional formatting",
          "Sample content examples",
          "Usage instructions",
          "Multiple format options",
        ],
        audience: ["Job seekers", "Career professionals", "Students", "HR professionals"],
      }
    case "checklist":
      return {
        included: [
          "Comprehensive task list",
          "Priority indicators",
          "Progress tracking",
          "Timeline suggestions",
          "Success criteria",
        ],
        audience: ["Organized professionals", "Project managers", "Career planners"],
      }
    case "toolkit":
      return {
        included: [
          "Multiple resources bundle",
          "Templates and guides",
          "Worksheets and exercises",
          "Reference materials",
          "Implementation roadmap",
        ],
        audience: ["Comprehensive learners", "Career coaches", "Team leaders"],
      }
    case "course":
      return {
        included: [
          "Video lessons",
          "Interactive exercises",
          "Downloadable materials",
          "Progress tracking",
          "Certificate of completion",
        ],
        audience: ["Dedicated learners", "Skill builders", "Career advancers"],
      }
    default:
      return {
        included: ["Comprehensive content", "Professional insights", "Practical applications"],
        audience: ["All career levels"],
      }
  }
}

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [viewCount, setViewCount] = useState(2500)
  const resourceId = Number.parseInt(params.id as string)

  const resource = resources.find((r) => r.id === resourceId)

  useEffect(() => {
    if (!resource) return

    // Increment view count
    fetch(`/api/resources/${resourceId}/views`, { method: "POST" })
      .then(() => {
        // Fetch updated view count
        return fetch(`/api/resources/${resourceId}/views`, { method: "GET" })
      })
      .then((res) => res.json())
      .then((data) => {
        setViewCount(data.viewCount || 2500)
      })
      .catch(() => {
        setViewCount(2500)
      })
  }, [resourceId, resource])

  // In your ResourceDetailPage component, update the handleGetNow function:

const handleGetNow = () => {
  if (!user) {
    // Store the current page URL (not just the resource link)
    const currentPageUrl = window.location.href;
    sessionStorage.setItem("redirectAfterSignup", currentPageUrl);
    
    // Redirect to signup page  
    router.push("/signup");
    return;
  }

  // If user is logged in, open resource directly
  if (resource?.link) {
    window.open(resource.link, "_blank", "noopener,noreferrer");
  }
}

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Resource Not Found</h1>
          <p className="text-gray-600 mb-8">The resource you're looking for doesn't exist.</p>
          <Link href="/resources">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const IconComponent = getResourceIcon(resource.type)
  const typeContent = getTypeSpecificContent(resource.type)

  // Use custom included and audience if available, otherwise fall back to type-specific content
  const includedItems = resource.included || typeContent.included
  const audienceItems = resource.audience || typeContent.audience

  return (
    <div className="container mx-auto px-4 py-6 rounded-3xl border-slate-100">
      {/* Header */}
      <div className="border-b bg-transparent border-transparent pr-12 pl-14">
        <div className="container mx-auto py-6 rounded-3xl border-slate-100 px-0.5">
          <Link href="/resources">
            <Button variant="ghost" className="mb-4 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconComponent className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{resource.title}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed mb-4">{resource.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>{viewCount.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Updated Dec 2024</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Beyond Career Team</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.8 (2.1k reviews)</span>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-sm">
                        {resource.type}
                      </Badge>
                      <Badge className={getDifficultyColor(resource.difficulty || "Intermediate")}>
                        {resource.difficulty || "Intermediate"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>15-30 min read</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>High impact on career growth</span>
                    </div>

                    <Separator />

                    <Button
                      onClick={handleGetNow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                    >
                      {user ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Access Resource
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Sign Up to Access
                        </>
                      )}
                    </Button>

                    {!user && (
                      <p className="text-xs text-gray-500 text-center">Free account required • No spam, ever</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-0.5 px-0 mx-1">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {includedItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Who This Is For */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Who This Is For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {audienceItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>About This Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {resource.aboutSection ||
                    `This comprehensive ${resource.type.toLowerCase()} has been carefully crafted by our career experts to provide you with actionable insights and practical tools that you can implement immediately. Whether you're just starting your career journey or looking to make a significant change, this resource will guide you through the process step by step.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
