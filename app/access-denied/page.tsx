"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function AccessDeniedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'insufficient_permissions'
  
  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case 'admin_required':
        return {
          title: 'Admin Access Required',
          message: 'This page requires administrator privileges. Please contact your system administrator if you believe you should have access.',
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />
        }
      case 'authentication_required':
        return {
          title: 'Authentication Required',
          message: 'You must be signed in to access this page. Please log in and try again.',
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />
        }
      default:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource. Please contact support if you believe this is an error.',
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />
        }
    }
  }

  const errorInfo = getErrorMessage(reason)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            {errorInfo.message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Link href="/">
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
          
          {reason === 'authentication_required' && (
            <div className="pt-4 border-t">
              <Link href="/login">
                <Button variant="default" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  )
}