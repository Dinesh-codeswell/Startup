"use client"

import { User, BarChart3, Target } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false)

  const steps: Array<{
    step: string
    icon: LucideIcon
    title: string
    description: string
  }> = [
    {
      step: "1",
      icon: User,
      title: "Create Account",
      description: "Create your personalized account to unlock all features.",
    },
    {
      step: "2",
      icon: BarChart3,
      title: "Find & Download the Right Resources",
      description: "Discover and download curated resources tailored to your career goals.",
    },
    {
      step: "3",
      icon: Target,
      title: "Apply to Internships, Jobs, and More",
      description: "Apply directly to internships, jobs, and other opportunities.",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("how-it-works-section")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="how-it-works-section"
      className="py-20 bg-new-deep-purple relative overflow-hidden bg-indigo-300"
    >
      {/* Background decoration */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-r from-[#4ebbf8]/10 to-[#334EAC]/10 rounded-full blur-3xl animate-float animate-morph" />
      <div
        className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-r from-[#BAD6EB]/10 to-[#4ebbf8]/10 rounded-full blur-3xl animate-float animate-morph"
        style={{ animationDelay: "3s" }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Start your journey with our simple three-step process
          </p>
        </div>

        {/* Steps */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-0">
          {steps.map((step, index) => (
            <div key={step.step} className="relative flex flex-col items-center w-full md:w-1/3 px-4 text-center">
              {/* Number */}
              <div
                className={`text-5xl sm:text-6xl md:text-7xl font-extrabold text-new-light-purple mb-4 transition-transform duration-500 ${
                  isVisible ? "animate-scale-in" : "opacity-0"
                }`}
                style={{
                  textShadow:
                    "4px 4px 0px rgba(0,0,0,0.1), 8px 8px 0px rgba(0,0,0,0.05), 12px 12px 0px rgba(0,0,0,0.02)",
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                {step.step}
              </div>

              {/* Icon */}
              

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{step.title}</h3>

              {/* Description */}
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">{step.description}</p>
            </div>
          ))}

          {/* Curved connectors - only on medium+ screens */}
          <svg
            className="hidden md:block absolute top-[-40px] w-[400px] h-[50px]"
            style={{ left: "calc(33.33% - 200px)", animationDelay: `0.3s` }}
            viewBox="0 0 400 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 45 C 100 5, 300 5, 400 45"
              stroke="white"
              strokeWidth="2"
              className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
            <path
              d="M395 40 L400 45 L395 50"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
          </svg>

          <svg
            className="hidden md:block absolute top-[-40px] w-[400px] h-[50px]"
            style={{ left: "calc(66.66% - 200px)", animationDelay: `0.5s` }}
            viewBox="0 0 400 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 45 C 100 5, 300 5, 400 45"
              stroke="white"
              strokeWidth="2"
              className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
            <path
              d="M395 40 L400 45 L395 50"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

export { HowItWorksSection }
export default HowItWorksSection
