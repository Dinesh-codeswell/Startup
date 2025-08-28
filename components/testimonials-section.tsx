"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

const testimonials = [
  {
    name: "Mansi Agarwal",
    College: "IIM Indore (IPM)",
    content:
      "Today's session with Beyond Career brought instant clarity to concepts I'd been struggling with for days. Their intuitive, practical style made even complex ideas feel simple. The roadmap they shared gave me a step-by-step approach for my specific goals. Easily the best 30 minutes I've spent on upskilling.",
    rating: 5,
    initials: "MA",
    image:
      "/images/mansi.jpeg",
  },
 
  {
    name: "Sagar",
    College: "DTU, Delhi",
    content:
      "Amazing 😍. It felt like the mentor truly understood the modern job market and offered tailored, useful insights through Beyond Career.",
    rating: 5,
    initials: "S",
    image:
      "/images/dtu.jpeg",
  },
 
  {
    name: "Rohit Sinha",
    College: "IIT Delhi",
    content:
      "Beyond Career doesn't just teach—they mentor. Their deep involvement and real-world advice made a huge difference in my journey.",
    rating: 5,
    initials: "RS",
    image:
      "/images/iit delhi.jpeg",
  },
  {
    name: "Priyanshi Bansal",
    College: "LSR",
    content:
      "The CV review and personalized feedback I received from Beyond Career was a game changer. It made my profile stand out like never before.",
    rating: 5,
    initials: "PB",
    image:
      "/images/priyanshi.jpeg",
  },
  {
    name: "Aditya Rao",
    College: "IIT Bombay",
    content:
      "The Beyond Career ecosystem connected me with alumni mentors who gave raw, real insights. That's unmatched value for any student.",
    rating: 5,
    initials: "AR",
    image:
      "/images/iit bombay.jpeg",
  },
 
]

export function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 },
    )
    const element = document.getElementById("testimonials-section")
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1
    goToSlide(newIndex)
  }

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % testimonials.length
    goToSlide(newIndex)
  }

  const getVisibleTestimonials = () => {
    const result = []
    const itemsToShow = isMobile ? 1 : 3
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % testimonials.length
      result.push(testimonials[index])
    }
    return result
  }

  return (
    <section
      id="testimonials-section"
      className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 bg-gradient-to-br from-[#BAD6EB]/20 via-white to-[#F7F2EB]/30 relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background decoration - optimized for mobile */}
      <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-gradient-to-r from-[#4ebbf8]/5 to-[#334EAC]/5 rounded-full blur-2xl sm:blur-3xl" />
      <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-gradient-to-r from-[#BAD6EB]/10 to-[#4ebbf8]/5 rounded-full blur-2xl sm:blur-3xl" />

      <div className="container mx-auto max-w-6xl">
        <div className={`text-center mb-8 sm:mb-12 transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full text-xs sm:text-sm font-medium text-[#4ebbf8] mb-3 sm:mb-4 shadow-lg hover:glass-strong transition-all duration-300">
            TESTIMONIALS
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#081F5C] mb-3 sm:mb-4 px-2">
            Backed by 20,000+ Students Across India
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Students from top colleges have trusted Beyond Career to guide their journeys. See how we helped them land
            interviews, internships, and career clarity.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Navigation buttons - hidden on mobile for cleaner look */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 glass border-white/30 bg-white/80 hover:bg-white shadow-lg hover:scale-105 transition-all duration-200 -ml-2 sm:-ml-4 hidden sm:flex w-8 h-8 sm:w-10 sm:h-10"
            onClick={goToPrevious}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#334EAC]" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 glass border-white/30 bg-white/80 hover:bg-white shadow-lg hover:scale-105 transition-all duration-200 -mr-2 sm:-mr-4 hidden sm:flex w-8 h-8 sm:w-10 sm:h-10"
            onClick={goToNext}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#334EAC]" />
          </Button>

          {/* Cards container with responsive grid */}
          <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {getVisibleTestimonials().map((testimonial, index) => (
              <Card
                key={`${testimonial.name}-${currentIndex}-${index}`}
                className="border-0 shadow-lg glass hover:glass-strong rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-xl group overflow-hidden"
              >
                <CardContent className="p-4 sm:p-6 relative h-full flex flex-col min-h-[280px] sm:min-h-[320px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4ebbf8]/5 to-[#334EAC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl" />

                  {/* Rating stars */}
                  <div className="flex items-center mb-3 sm:mb-4 relative z-10">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300 fill-current" />
                    ))}
                  </div>

                  {/* Content with better mobile typography */}
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic relative z-10 group-hover:text-gray-700 transition-colors duration-300 flex-grow leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author info with responsive sizing */}
                  <div className="flex items-center gap-2 sm:gap-3 relative z-10 mt-auto">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#4ebbf8] to-[#334EAC] text-white rounded-full flex items-center justify-center font-semibold shadow-lg hover:scale-105 transition-transform duration-200 text-xs sm:text-sm">
                        {testimonial.initials}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#081F5C] group-hover:text-[#4ebbf8] transition-colors duration-300 text-sm sm:text-base">
                        {testimonial.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                        {testimonial.College}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile navigation buttons */}
          <div className="flex justify-center gap-4 mt-6 sm:hidden">
            <Button
              variant="outline"
              size="icon"
              className="glass border-white/30 bg-white/80 hover:bg-white shadow-lg hover:scale-105 transition-all duration-200 w-10 h-10"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 text-[#334EAC]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="glass border-white/30 bg-white/80 hover:bg-white shadow-lg hover:scale-105 transition-all duration-200 w-10 h-10"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 text-[#334EAC]" />
            </Button>
          </div>

          {/* Pagination dots - hidden on mobile, smaller on tablet */}
          <div className="hidden sm:flex justify-center mt-6 sm:mt-8 space-x-1.5 sm:space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "bg-[#4ebbf8] scale-125 shadow-lg" 
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
