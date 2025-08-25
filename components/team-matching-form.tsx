"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Briefcase,
  Users,
  Trophy,
  Scale,
  DollarSign,
  Globe,
  Sparkles,
  LayoutGrid,
  Code,
  BarChart,
} from "lucide-react"

interface TeamMatchingFormProps {
  onClose: () => void
}

export function TeamMatchingForm({ onClose }: TeamMatchingFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    competitionPreferences: [],
    availability: "",
    experience: "",
    teamSize: "",
    yearOfStudy: "",
    preferredRoles: [],
    coreStrengths: [],
    fullName: "",
    email: "",
    whatsappNumber: "",
    collegeName: "",
  })

  const totalSteps = 6 // Including the welcome/info step

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleToggleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardTitle className="text-2xl font-bold text-center mb-6">Case Competition Preferences</CardTitle>
            <ToggleGroup
              type="multiple"
              value={formData.competitionPreferences}
              onValueChange={(value) => handleToggleChange("competitionPreferences", value)}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {[
                { value: "consulting", label: "Consulting", icon: Briefcase },
                { value: "product-tech", label: "Product/Tech", icon: Lightbulb },
                { value: "marketing", label: "Marketing", icon: Sparkles },
                { value: "social-impact", label: "Social Impact", icon: Globe },
                { value: "operations", label: "Operations", icon: Scale },
                { value: "finance", label: "Finance", icon: DollarSign },
                { value: "esg", label: "ESG", icon: BarChart },
                { value: "open", label: "Open", icon: Users },
              ].map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  className="flex flex-col items-center justify-center p-4 h-28 w-full rounded-lg border border-gray-200 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 hover:bg-gray-50 transition-colors"
                  aria-label={`Toggle ${item.label}`}
                >
                  {formData.competitionPreferences.includes(item.value) && (
                    <Check className="h-5 w-5 text-blue-600 absolute top-2 right-2" />
                  )}
                  <item.icon className="h-8 w-8 mb-2 text-gray-600 data-[state=on]:text-blue-700" />
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )
      case 2:
        return (
          <>
            <CardTitle className="text-2xl font-bold text-center mb-6">Time to Find your Partner</CardTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="availability">Your Availability for case comps (next 2-4 weeks)</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("availability", value)}
                  value={formData.availability}
                >
                  <SelectTrigger id="availability" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2_hours">1-2 hours/day</SelectItem>
                    <SelectItem value="3-4_hours">3-4 hours/day</SelectItem>
                    <SelectItem value="5_plus_hours">5+ hours/day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Previous Case Competition Experience</Label>
                <Select onValueChange={(value) => handleSelectChange("experience", value)} value={formData.experience}>
                  <SelectTrigger id="experience" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1-2_comps">1-2 competitions</SelectItem>
                    <SelectItem value="3-5_comps">3-5 competitions</SelectItem>
                    <SelectItem value="5_plus_comps">5+ competitions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teamSize">Preferred team size</Label>
                <Select onValueChange={(value) => handleSelectChange("teamSize", value)} value={formData.teamSize}>
                  <SelectTrigger id="teamSize" className="w-full">
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <CardTitle className="text-2xl font-bold text-center mb-6">Let's not about You!</CardTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="yearOfStudy">Current Year of Study</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("yearOfStudy", value)}
                  value={formData.yearOfStudy}
                >
                  <SelectTrigger id="yearOfStudy" className="w-full">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                    <SelectItem value="graduate">Graduate Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preferred Role(s) in a Team (Select up to 2)</Label>
                <ToggleGroup
                  type="multiple"
                  value={formData.preferredRoles}
                  onValueChange={(value) => {
                    if (value.length <= 2) {
                      handleToggleChange("preferredRoles", value)
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2"
                >
                  {[
                    { value: "analyst", label: "Analyst" },
                    { value: "strategist", label: "Strategist" },
                    { value: "presenter", label: "Presenter" },
                    { value: "researcher", label: "Researcher" },
                    { value: "designer", label: "Designer" },
                    { value: "developer", label: "Developer" },
                  ].map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      className="flex items-center justify-center p-3 rounded-lg border border-gray-200 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 hover:bg-gray-50 transition-colors"
                      aria-label={`Toggle ${item.label}`}
                    >
                      {formData.preferredRoles.includes(item.value) && <Check className="h-4 w-4 text-blue-600 mr-2" />}
                      <span className="text-sm font-medium">{item.label}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <CardTitle className="text-2xl font-bold text-center mb-6">
              Your Top 3 Core Strength (Select exactly 3)
            </CardTitle>
            <ToggleGroup
              type="multiple"
              value={formData.coreStrengths}
              onValueChange={(value) => {
                if (value.length <= 3) {
                  handleToggleChange("coreStrengths", value)
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {[
                { value: "strategy", label: "Strategy", icon: Briefcase },
                { value: "research", label: "Research", icon: Lightbulb },
                { value: "financial", label: "Financial", icon: DollarSign },
                { value: "market", label: "Market", icon: BarChart },
                { value: "presentation", label: "Presentation", icon: Sparkles },
                { value: "pitching", label: "Pitching", icon: Trophy },
                { value: "management", label: "Management", icon: Users },
                { value: "ideation", label: "Ideation", icon: Lightbulb },
                { value: "ui-ux", label: "UI/UX", icon: LayoutGrid },
                { value: "technical", label: "Technical", icon: Code },
              ].map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  className="flex flex-col items-center justify-center p-4 h-28 w-full rounded-lg border border-gray-200 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 hover:bg-gray-50 transition-colors"
                  aria-label={`Toggle ${item.label}`}
                >
                  {formData.coreStrengths.includes(item.value) && (
                    <Check className="h-5 w-5 text-blue-600 absolute top-2 right-2" />
                  )}
                  <item.icon className="h-8 w-8 mb-2 text-gray-600 data-[state=on]:text-blue-700" />
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )
      case 5:
        return (
          <>
            <CardTitle className="text-2xl font-bold text-center mb-6">Welcome Nitish!</CardTitle>
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Your Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">Whatsapp Number</Label>
                <Input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  placeholder="Number"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  name="collegeName"
                  placeholder="College Name"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </>
        )
      case 6:
        return (
          <div className="text-center space-y-6">
            <CardTitle className="text-3xl font-bold text-green-600">Thank You!</CardTitle>
            <p className="text-lg text-gray-700">
              Your team matching preferences have been submitted successfully. We'll notify you when a perfect match is
              found!
            </p>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
              Go to My Team
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  const progressValue = (step / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden">
        <CardContent className="p-8">
          {step <= totalSteps && (
            <div className="mb-6">
              <Progress
                value={progressValue}
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
              />
            </div>
          )}
          {renderStepContent()}
          {step < totalSteps && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                {step === 1 ? "I'm Ready" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
