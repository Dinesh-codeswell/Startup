"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/Header"
import Hero from "@/components/Hero"
import Resources from "@/components/resources"
import Opportunities from "@/components/opportunities"
import { EventsSection } from "@/components/events-section"
import { USPSection } from "@/components/usp-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { TeamSection } from "@/components/team-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/Footer"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only proceed if user is authenticated and not loading
    if (!loading && user) {
      // Always redirect authenticated users to team dashboard
      router.push('/team/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-milky-way text-galaxy">
      <Header />
      <main>
        <Hero />
        <Resources />
        <Opportunities />
        <EventsSection />
        <USPSection />
        <TestimonialsSection />
        <TeamSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
