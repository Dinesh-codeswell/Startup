"use client"

import { useState } from "react"

// Generate a simple UUID v4
const generateUUID = () => {
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

const Users = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
)

const Award = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Target = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const Clock = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
)

const BookOpen = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 16.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
)

const TrendingUp = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
)

const AlertCircle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export function TeamMatchingQuestionnaire({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    id: generateUUID(),
    fullName: "",
    email: "",
    whatsappNumber: "",
    collegeName: "",
    course: "",
    currentYear: "",
    coreStrengths: [],
    preferredRoles: [],
    preferredTeammateRoles: [],
    availability: "",
    experience: "",
    casePreferences: [],
    preferredTeamSize: "",
  })

  const totalSteps = 6
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const handleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const currentArray = prev[field] || []
      let newArray

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
      } else if (field === "preferredTeammateRoles") {
        // For preferred teammate roles, limit to 3
        if (currentArray.includes(value)) {
          newArray = currentArray.filter((item) => item !== value)
        } else if (currentArray.length < 3) {
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
        [field]: null,
      }))
    }
  }

  const validateStep = () => {
    const newErrors = {}

    switch (currentStep) {
      case 0:
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = "WhatsApp number is required"
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
        if (formData.preferredTeammateRoles.length === 0)
          newErrors.preferredTeammateRoles = "Please select at least 1 preferred teammate role (up to 3)"
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

  const handleSubmit = () => {
    console.log("Form submitted:", formData)
    alert("Team matching questionnaire submitted successfully!")
    onClose()
  }

  const renderError = (field) => {
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-3 py-0">
            <div className="text-center space-y-3 py-0">
              <div className="relative"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                Team Formation Questionnaire
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Let's find you the perfect teammates for case competitions
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fullName">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-1.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 ${
                    errors.fullName ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {renderError("fullName")}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                  Email ID *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
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
                  className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 ${
                    errors.whatsappNumber ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {renderError("whatsappNumber")}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="collegeName">
                  College Name *
                </label>
                <input
                  id="collegeName"
                  name="collegeName"
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange("collegeName", e.target.value)}
                  placeholder="Enter your college/university name"
                  className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 ${
                    errors.collegeName ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {renderError("collegeName")}
                <p className="text-xs text-gray-500 mt-1">We encourage inter-college collaboration where possible</p>
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
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
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
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium flex items-center justify-center ${
                        formData.preferredRoles.includes(role.value)
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
                  { value: "Technic" },
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
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium flex flex-col items-center space-y-2 ${
                        isLastTwo ? extraClasses : ""
                      } ${
                        isSelected
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
                Preferred Teammate Roles
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                What roles do you prefer your teammates to have? (Select up to 3)
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div className="mb-4 text-center">
                <span className="text-sm font-medium text-gray-600">
                  Selected: {formData.preferredTeammateRoles.length}/3
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  "Strong Researcher",
                  "Creative Thinker",
                  "Data Expert",
                  "Great Presenter",
                  "Strategic Leader",
                  "Detail-Oriented",
                  "Problem Solver",
                  "Team Player",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleMultiSelect("preferredTeammateRoles", role)}
                    disabled={
                      !formData.preferredTeammateRoles.includes(role) && formData.preferredTeammateRoles.length >= 3
                    }
                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium px-3 ${
                      formData.preferredTeammateRoles.includes(role)
                        ? "border-green-500 bg-green-50 text-green-700"
                        : formData.preferredTeammateRoles.length >= 3
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {renderError("preferredTeammateRoles")}
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
                      1
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
                { id: "consulting", label: "Consulting", icon: "✓" },
                { id: "product", label: "Product/Tech", icon: "🚀" },
                { id: "marketing", label: "Marketing", icon: "//" },
                { id: "social", label: "Social Im", icon: "📊" },
                { id: "operations", label: "Operations", icon: "⚙️" },
                { id: "finance", label: "Finance", icon: "💎" },
                { id: "esg", label: "ESG", icon: "" },
                { id: "open", label: "open", icon: "👤" },
              ].map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => handleMultiSelect("casePreferences", pref.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                    formData.casePreferences.includes(pref.id)
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    
                    <span className="font-medium">{pref.label}</span>
                  </div>
                  
                </button>
              ))}
            </div>
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
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  currentStep === 0
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
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl px-3.5 py-2"
                >
                  <span>I'm Ready</span>
                  <ChevronRight />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>Next</span>
                  <ChevronRight />
                </button>
              )}
            </div>

            {/* Validation Instructions */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Please fix the errors above to continue</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
