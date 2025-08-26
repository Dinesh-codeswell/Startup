"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Lightbulb, Users, Trophy, ArrowRight } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { TeamMatchingQuestionnaireWrapper } from "@/components/LazyComponents"

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  // Auto-redirect to questionnaire if user is signed in
  useEffect(() => {
    if (!authLoading && user) {
      setShowQuestionnaire(true)
    }
  }, [user, authLoading])

  if (showQuestionnaire) {
    return (
      <TeamMatchingQuestionnaireWrapper 
        onClose={() => setShowQuestionnaire(false)}
        onSubmitSuccess={() => {
          // Redirect to homepage after successful submission
          window.location.href = '/'
        }}
      />
    )
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <div className="flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-teal-600 mr-2" />
              <span className="text-teal-600 font-medium">Team Matching Platform</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">Find Your Perfect Team</h1>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Sign in to get matched with like-minded individuals based on your skills, interests, and goals.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-8">
              <p className="text-blue-800 font-medium mb-4">Sign in required</p>
              <p className="text-blue-700 text-sm mb-4">
                You need to be signed in to access the team matching questionnaire.
              </p>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg w-full"
                onClick={() => window.location.href = '/login?returnTo=' + encodeURIComponent('/team')}
              >
                Sign In to Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-gray-500 text-sm">
              Don't have an account? <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">Sign up here</a>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <Users className="h-6 w-6 text-teal-600 mr-2" />
            <span className="text-teal-600 font-medium">Team Matching Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">Find Your Perfect Team</h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get matched with like-minded individuals based on your skills, interests, and goals. Build winning teams for
            competitions, projects, and career growth.
          </p>

          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-lg font-semibold rounded-lg"
            onClick={() => setShowQuestionnaire(true)}
          >
            Start Team Matching
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Profile</h3>
                <p className="text-gray-600 text-sm">Fill out your skills, interests, and preferences</p>
                <ArrowRight className="h-5 w-5 text-gray-400 mx-auto mt-4 hidden lg:block" />
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
                <p className="text-gray-600 text-sm">Our algorithm finds compatible teammates</p>
                <ArrowRight className="h-5 w-5 text-gray-400 mx-auto mt-4 hidden lg:block" />
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Formation</h3>
                <p className="text-gray-600 text-sm">Get matched with 2-4 perfect teammates</p>
                <ArrowRight className="h-5 w-5 text-gray-400 mx-auto mt-4 hidden lg:block" />
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Achieve Together</h3>
                <p className="text-gray-600 text-sm">Collaborate and win competitions together</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Intelligent Team Matching Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Features */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Intelligent Team Matching</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Skills-based compatibility matching</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Education level and interest alignment</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Role diversity optimization</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Experience level balancing</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Availability synchronization</span>
                </div>
              </div>
            </div>

            {/* Right Column - Success Metrics */}
            <div className="p-8 rounded-lg bg-slate-50 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Team Satisfaction</span>
                    <span className="text-gray-900 font-bold">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Competition Success</span>
                    <span className="text-gray-900 font-bold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Skill Compatibility</span>
                    <span className="text-gray-900 font-bold">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-teal-600 to-blue-600 text-sky-700 bg-blue-600">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Dream Team?</h2>
          <p className="text-teal-100 text-lg mb-8">
            Join thousands of students who have found their perfect teammates
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            onClick={() => setShowQuestionnaire(true)}
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}