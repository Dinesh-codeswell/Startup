"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Generate a proper UUID v4
const generateUUID = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback to manual generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// SVG Icons as React components
const Check = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const AlertCircle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

interface TeamMatchingQuestionnaireProps {
  onClose: () => void
  onSubmitSuccess?: () => void
}

export function TeamMatchingQuestionnaire({ onClose, onSubmitSuccess }: TeamMatchingQuestionnaireProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [formData, setFormData] = useState({
    id: generateUUID(),
    fullName: "",
    email: "",
    whatsappNumber: "",
    collegeName: "",
    currentYear: "",
    coreStrengths: [] as string[],
    preferredRoles: [] as string[],
    teamPreference: "",
    availability: "",
    experience: "",
    casePreferences: [] as string[],
    preferredTeamSize: "",
  })

  // Initialize form data with user profile information
  useEffect(() => {
    if (!authLoading && user && !isInitialized) {
      const firstName = profile?.first_name?.trim() || ""
      const lastName = profile?.last_name?.trim() || ""
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : ""
      
      setFormData(prev => ({
        ...prev,
        fullName: fullName,
        email: profile?.email || user.email || "",
        collegeName: profile?.college_name?.trim() || "",
      }))
      setIsInitialized(true)
    }
  }, [user, profile, authLoading, isInitialized])

  const totalSteps = 6
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleMultiSelect = (field: string, value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field as keyof typeof prev] as string[]
      let newArray: string[]

      if (field === "coreStrengths") {
        // For core strengths, limit to exactly 3
        if (currentArray.includes(value)) {
          newArray = currentArray.filter((item) => item !== value)
        } else if (currentArray.length < 3) {
          newArray = [...currentArray, value]
        } else {
          return prev // Don't add if already at limit
        }
      } else if (field === "preferredRoles") {
        // For preferred roles, limit to 2
        if (currentArray.includes(value)) {
          newArray = currentArray.filter((item) => item !== value)
        } else if (currentArray.length < 2) {
          newArray = [...currentArray, value]
        } else {
          return prev // Don't add if already at limit
        }
      } else if (field === "casePreferences") {
        // For case preferences, limit to 3
        if (currentArray.includes(value)) {
          newArray = currentArray.filter((item) => item !== value)
        } else if (currentArray.length < 3) {
          newArray = [...currentArray, value]
        } else {
          return prev // Don't add if already at limit
        }
      } else {
        // For other fields, no limit
        newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value]
      }

      return {
        ...prev,
        [field]: newArray,
      }
    })

    // Clear error when user makes selection
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 0:
        if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = "WhatsApp number is required"
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
        if (!formData.email.trim()) newErrors.email = "Email address is required"
        if (!formData.collegeName.trim()) newErrors.collegeName = "College name is required"
        break
      case 1:
        if (!formData.currentYear) newErrors.currentYear = "Current year is required"
        if (formData.preferredRoles.length === 0)
          newErrors.preferredRoles = "Please select at least 1 preferred role (up to 2)"
        break
      case 2:
        if (formData.coreStrengths.length !== 3) newErrors.coreStrengths = "Please select exactly 3 core strengths"
        break
      case 3:
        if (!formData.teamPreference) newErrors.teamPreference = "Please select your team preference"
        break
      case 4:
        if (!formData.availability) newErrors.availability = "Please select your availability"
        if (!formData.experience) newErrors.experience = "Please select your experience level"
        if (!formData.preferredTeamSize) newErrors.preferredTeamSize = "Please select preferred team size"
        break
      case 5:
        if (formData.casePreferences.length === 0)
          newErrors.casePreferences = "Please select at least 1 case preference (up to 3)"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep() && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors({}) // Clear errors when going back
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) {
      return
    }

    if (!user) {
      setErrors({ submit: "You must be signed in to submit the questionnaire" })
      return
    }

    setIsSubmitting(true)

    try {
      // Include user ID in the submission data
      const submissionData = {
        ...formData,
        userId: user.id, // Add the authenticated user's ID
      }

      console.log("Submitting form data:", submissionData)

      const response = await fetch('/api/team-matching/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const responseData = await response.json()
      console.log("API response:", responseData)

      if (response.ok && responseData.success) {
        alert("🎉 Team matching questionnaire submitted successfully! We'll notify you when a perfect match is found.")
        
        // Call the success callback if provided, otherwise redirect to homepage
        if (onSubmitSuccess) {
          onSubmitSuccess()
        } else {
          // Default behavior: redirect to homepage after successful submission
          window.location.href = '/'
        }
      } else {
        // Handle specific error cases
        let errorMessage = "There was an error submitting your questionnaire."
        
        if (responseData.error) {
          if (responseData.error.includes("duplicate") || responseData.error.includes("already exists")) {
            errorMessage = "An active submission already exists for this email address. Please use a different email or contact support."
          } else if (responseData.error.includes("required field")) {
            errorMessage = `Please fill in all required fields: ${responseData.error}`
          } else if (responseData.error.includes("team size")) {
            errorMessage = "Please select a valid team size (2-4 members)."
          } else {
            errorMessage = `Submission failed: ${responseData.error}`
          }
        }
        
        alert(errorMessage)
        console.error('Submission failed:', responseData)
      }
    } catch (error) {
      console.error('Network error submitting questionnaire:', error)
      alert("Network error: Please check your internet connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderError = (field: string) => {
    if (errors[field]) {
      return (
        <div className="flex items-center space-x-2 mt-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errors[field]}</span>
        </div>
      )
    }
    return null
  }

  // Redirect to common authentication gateway if not logged in
  if (!authLoading && !user) {
    // Use Next.js router for proper navigation
    router.push('/login')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-3 py-0">
            <div className="text-center space-y-3 py-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Team Formation Questionnaire
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Let's find you the perfect teammates for case competitions
              </p>
              {user && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-md mx-auto">
                  <p className="text-green-700 text-sm">
                    ✅ Signed in as <strong>{profile?.first_name || user.email}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fullName">
                  Full Name *
                  {formData.fullName && <span className="text-xs text-blue-600 ml-2">(from your profile)</span>}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  readOnly={!!formData.fullName}
                  placeholder={!formData.fullName ? "Enter your full name" : ""}
                  className={`w-full px-4 py-1.5 border rounded-xl ${
                    formData.fullName 
                      ? "bg-gray-50 text-gray-700 cursor-not-allowed border-gray-200" 
                      : "bg-white text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  } ${errors.fullName ? "border-red-500" : ""}`}
                />
                {formData.fullName && (
                  <p className="text-xs text-gray-500 mt-1">
                    This information is from your profile and cannot be edited here
                  </p>
                )}
                {renderError("fullName")}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                  Email ID *
                  {formData.email && <span className="text-xs text-blue-600 ml-2">(from your profile)</span>}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  readOnly={!!formData.email}
                  placeholder={!formData.email ? "Enter your email address" : ""}
                  className={`w-full px-4 py-2 border rounded-xl ${
                    formData.email 
                      ? "bg-gray-50 text-gray-700 cursor-not-allowed border-gray-200" 
                      : "bg-white text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  } ${errors.email ? "border-red-500" : ""}`}
                />
                {formData.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    This is your account email and cannot be changed
                  </p>
                )}
                {renderError("email")}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="whatsappNumber">
                  WhatsApp Number *
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 ${errors.whatsappNumber ? "border-red-500" : "border-gray-200"
                    }`}
                />
                {renderError("whatsappNumber")}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="collegeName">
                  College Name *
                  {formData.collegeName && <span className="text-xs text-blue-600 ml-2">(from your profile)</span>}
                </label>
                <input
                  id="collegeName"
                  name="collegeName"
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange("collegeName", e.target.value)}
                  readOnly={!!formData.collegeName}
                  placeholder={!formData.collegeName ? "Enter your college name" : ""}
                  className={`w-full px-4 py-2 border rounded-xl ${
                    formData.collegeName 
                      ? "bg-gray-50 text-gray-700 cursor-not-allowed border-gray-200" 
                      : "bg-white text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  } ${errors.collegeName ? "border-red-500" : ""}`}
                />
                {renderError("collegeName")}
              </div>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-8 pt-6">
            {/* Heading */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Academic Details & Team Preferences
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Tell us about your academic background and preferred team roles
              </p>
            </div>

            {/* Current Year Dropdown */}
            <div className="max-w-lg mx-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Year of Study *</label>
              <select
                value={formData.currentYear}
                onChange={(e) => handleInputChange("currentYear", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Year</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
                <option value="PG/MBA (1st Year)">PG/MBA (1st Year)</option>
                <option value="PG/MBA (2nd Year)">PG/MBA (2nd Year)</option>
              </select>
              {renderError("currentYear")}
            </div>

            {/* Preferred Team Roles */}
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                Preferred Team Roles (Select up to 2)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "Team Lead" },
                  { value: "Researcher" },
                  { value: "Data Analyst" },
                  { value: "Designer" },
                  { value: "Presenter" },
                  { value: "Coordinator" },
                  { value: "" }, // empty placeholder for first column
                  { value: "Flexible" }, // center column
                  { value: "" }, // empty placeholder for third column
                ].map((role, index) =>
                  role.value ? (
                    <button
                      key={role.value}
                      onClick={() => handleMultiSelect("preferredRoles", role.value)}
                      disabled={!formData.preferredRoles.includes(role.value) && formData.preferredRoles.length >= 2}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium flex items-center justify-center ${formData.preferredRoles.includes(role.value)
                        ? "border-green-500 bg-green-50 text-green-700"
                        : formData.preferredRoles.length >= 2
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                    >
                      {role.value}
                    </button>
                  ) : (
                    <div key={`placeholder-${index}`} />
                  ),
                )}
              </div>
              {renderError("preferredRoles")}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6 pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Your Top 3 Core Strength (Select exactly 3)
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "Strategy" },
                  { value: "Research" },
                  { value: "Financial" },
                  { value: "Market" },
                  { value: "Presentation" },
                  { value: "Pitching" },
                  { value: "Management" },
                  { value: "Ideation" },
                  { value: "UI/UX" },
                  { value: "Technical" },
                ].map((strength, index, arr) => {
                  const isLastTwo = index === arr.length - 2 || index === arr.length - 1
                  const extraClasses = index === arr.length - 2 ? "col-start-2" : ""

                  const isSelected = formData.coreStrengths.includes(strength.value)
                  const isDisabled = !isSelected && formData.coreStrengths.length >= 3

                  return (
                    <button
                      key={strength.value}
                      onClick={() => handleMultiSelect("coreStrengths", strength.value)}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium flex flex-col items-center space-y-2 ${isLastTwo ? extraClasses : ""
                        } ${isSelected
                          ? "border-green-500 bg-green-50 text-green-700"
                          : isDisabled
                            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                    >
                      <span>{strength.value}</span>
                    </button>
                  )
                })}
              </div>
              {renderError("coreStrengths")}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6 pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Who do you want on your team?
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Choose your preferred team composition based on education level
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              {[
                {
                  value: "Undergrads only",
                  label: "Undergrads only",
                  description: "Team with only undergraduate students"
                },
                {
                  value: "Postgrads only",
                  label: "Postgrads only",
                  description: "Team with only postgraduate/MBA students"
                },
                {
                  value: "Either UG or PG",
                  label: "Either UG or PG",
                  description: "Mixed team with both undergrad and postgrad students"
                }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange("teamPreference", option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${formData.teamPreference === option.value
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${formData.teamPreference === option.value ? "text-green-700" : "text-gray-900"
                        }`}>
                        {option.label}
                      </div>
                      <div className={`text-sm ${formData.teamPreference === option.value ? "text-green-600" : "text-gray-500"
                        }`}>
                        {option.description}
                      </div>
                    </div>
                    {formData.teamPreference === option.value && (
                      <div className="text-green-500">
                        <Check />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {renderError("teamPreference")}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6 pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Time to Find your Partner
              </h2>
            </div>

            <div className="space-y-6 max-w-lg mx-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Availability for case comps (next 2-4 weeks)
                </label>
                <div className="relative">
                  <select
                    value={formData.availability || ""}
                    onChange={(e) => handleInputChange("availability", e.target.value)}
                    className="w-full appearance-none p-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 
                               focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all duration-300 bg-white pr-10"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Fully Available (10–15 hrs/week)">Fully Available (10–15 hrs/week)</option>
                    <option value="Moderately Available (5–10 hrs/week)">Moderately Available (5–10 hrs/week)</option>
                    <option value="Lightly Available (1–4 hrs/week)">Lightly Available (1–4 hrs/week)</option>
                    <option value="Not available now, but interested later">Not available now, but interested later</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {renderError("availability")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Previous Case Competition Experience
                </label>
                <div className="relative">
                  <select
                    value={formData.experience || ""}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    className="w-full appearance-none p-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 
                               focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all duration-300 bg-white pr-10"
                  >
                    <option value="" disabled>
                      None
                    </option>
                    <option value="None">None</option>
                    <option value="Participated in 1–2">Participated in 1–2</option>
                    <option value="Participated in 3+">Participated in 3+</option>
                    <option value="Finalist/Winner in at least one">Finalist/Winner in at least one</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {renderError("experience")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred team size</label>
                <div className="relative">
                  <select
                    value={formData.preferredTeamSize || ""}
                    onChange={(e) => handleInputChange("preferredTeamSize", e.target.value)}
                    className="w-full appearance-none p-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 
                               focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all duration-300 bg-white pr-10"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {renderError("preferredTeamSize")}
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6 pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Case Competition Preferences (Select up to 3)
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {[
                { id: "consulting", label: "Consulting" },
                { id: "product", label: "Product/Tech" },
                { id: "marketing", label: "Marketing" },
                { id: "social", label: "Social Impact" },
                { id: "operations", label: "Operations" },
                { id: "finance", label: "Finance" },
                { id: "esg", label: "ESG" },
                { id: "open", label: "Open" },
              ].map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => handleMultiSelect("casePreferences", pref.id)}
                  disabled={!formData.casePreferences.includes(pref.id) && formData.casePreferences.length >= 3}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${formData.casePreferences.includes(pref.id)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : formData.casePreferences.length >= 3
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  <span className="font-medium">{pref.label}</span>
                </button>
              ))}
            </div>
            {renderError("casePreferences")}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="p-6 md:p-12 md:px-2 md:py-2">
            <div className="h-[500px] flex flex-col justify-center">{renderStep()}</div>

            {/* Navigation */}
            <div className="flex items-center border-t border-gray-100 justify-between mt-0 pt-0">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <ChevronLeft />
                <span>Back</span>
              </button>

              {currentStep === totalSteps - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center space-x-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl px-3.5 py-2 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Find Team</span>
                      <ChevronRight />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl px-6 py-3"
                >
                  <span>{currentStep === 0 ? "I'm Ready" : "Next"}</span>
                  <ChevronRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
