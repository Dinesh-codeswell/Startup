"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Linkedin, Instagram, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

const teamMembers = [
  {
    name: "Mahavir Kumar",
    role: "Founder & CEO",
    bio: "Driving growth and vision with a student-centric mission.",
    image: "/images/mahavir-new.png", // Updated image path
    linkedin: "https://www.linkedin.com/in/mahavir-kumar-1b36001bb/",
    instagram: "https://www.instagram.com/undaunted_m_/",
    email: "mahavirkumar@beyondcareer.online",
  },
  {
    name: "Aanya",
    role: "Tech Lead",
    bio: "Architecting the platform that powers thousands of student journeys.",
    image: "/images/aanya-new.png", // Updated image path
    linkedin: "https://www.linkedin.com/in/aanya-chaudhary/",
    instagram: "https://www.instagram.com/aanya19._/",
    email: "aanyachaudhary024@gmail.com",
  },
  {
    name: "Nitish",
    role: "Chief Product Officer",
    bio: "Designing digital products to make student lives easier and careers stronger.",
    image: "/images/nitish-updated-v5.webp", // Updated image path
    linkedin: "https://www.linkedin.com/in/nitish-suyog/",
    instagram: "https://www.instagram.com/infi_ni30/",
    email: "nitish.suyog@gmail.com",
  },
  {
    name: "Dinesh",
    role: "Founding Member",
    bio: "Building strategic partnerships and expanding our reach to help more students succeed.",
    image: "/images/dinesh-team (1).webp",
    linkedin: "https://www.linkedin.com/in/dineshkatal/",
    instagram: "https://www.instagram.com/_dinesh.katal/",
    email: "dineshkatal.work@gmail.com",
  },
]

export function TeamSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("team-section")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % teamMembers.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + teamMembers.length) % teamMembers.length)
  }

  return (
    <section id="team-section" className="py-16 px-4 bg-white relative overflow-hidden particle-bg">
      {/* Background decoration */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-r from-[#4ebbf8]/5 to-[#334EAC]/5 rounded-full blur-3xl animate-float animate-morph" />
      <div
        className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-r from-[#BAD6EB]/10 to-[#4ebbf8]/5 rounded-full blur-3xl animate-float animate-morph"
        style={{ animationDelay: "3s" }}
      />

      <div className="container mx-auto">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
        >
          <div className="inline-flex items-center px-4 py-2 glass rounded-full text-sm font-medium text-[#4ebbf8] mb-4 shadow-lg hover:glass-strong transition-all duration-300">
            Meet Our Team
          </div>
          <h2 className="text-3xl font-bold text-[#081F5C] mb-4">The People Behind Beyond Career</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">A student-first team building career-first solutions.</p>
        </div>

        {/* Desktop Grid (unchanged) */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card
                key={member.name}
                className="border-0 shadow-lg glass hover:glass-strong rounded-2xl transition-all duration-500 hover-lift group overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  {/* Profile Image */}
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#081F5C] mb-2 group-hover:text-[#4ebbf8] transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-[#4ebbf8] font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-4 group-hover:text-gray-700 transition-colors duration-300">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                      {/* LinkedIn */}
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4 text-[#4ebbf8]" />
                      </a>

                      {/* Instagram */}
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`${member.name} Instagram`}
                      >
                        <Instagram className="h-4 w-4 text-[#4ebbf8]" />
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:${member.email}`}
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="h-4 w-4 text-[#4ebbf8]" />
                      </a>
                    </div>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden relative max-w-sm mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 shadow-lg"
            aria-label="Previous team member"
          >
            <ChevronLeft className="h-6 w-6 text-[#4ebbf8]" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 shadow-lg"
            aria-label="Next team member"
          >
            <ChevronRight className="h-6 w-6 text-[#4ebbf8]" />
          </button>

          {/* Carousel Container */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {teamMembers.map((member, index) => (
                <div key={member.name} className="w-full flex-shrink-0">
                  <Card className="border-0 shadow-lg glass rounded-2xl group overflow-hidden mx-2">
                    <CardContent className="p-0">
                      {/* Profile Image */}
                      <div className="relative overflow-hidden rounded-t-2xl">
                        <Image
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          width={280}
                          height={280}
                          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-[#081F5C] mb-2 group-hover:text-[#4ebbf8] transition-colors duration-300">
                          {member.name}
                        </h3>
                        <p className="text-[#4ebbf8] font-medium mb-3 text-sm">{member.role}</p>
                        <p className="text-gray-600 text-sm mb-4 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                          {member.bio}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center justify-center gap-4">
                          {/* LinkedIn */}
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                            aria-label={`${member.name} LinkedIn`}
                          >
                            <Linkedin className="h-5 w-5 text-[#4ebbf8]" />
                          </a>

                          {/* Instagram */}
                          <a
                            href={member.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                            aria-label={`${member.name} Instagram`}
                          >
                            <Instagram className="h-5 w-5 text-[#4ebbf8]" />
                          </a>

                          {/* Email */}
                          <a
                            href={`mailto:${member.email}`}
                            className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                            aria-label={`Email ${member.name}`}
                          >
                            <Mail className="h-5 w-5 text-[#4ebbf8]" />
                          </a>
                        </div>
                      </div>

                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* Tablet View */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card
                key={member.name}
                className="border-0 shadow-lg glass hover:glass-strong rounded-2xl transition-all duration-500 hover-lift group overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  {/* Profile Image */}
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-[#081F5C] mb-2 group-hover:text-[#4ebbf8] transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-[#4ebbf8] font-medium mb-3 text-sm">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-4 group-hover:text-gray-700 transition-colors duration-300">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                      {/* LinkedIn */}
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4 text-[#4ebbf8]" />
                      </a>

                      {/* Instagram */}
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`${member.name} Instagram`}
                      >
                        <Instagram className="h-4 w-4 text-[#4ebbf8]" />
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:${member.email}`}
                        className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-strong transition-all duration-300 hover:scale-110"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="h-4 w-4 text-[#4ebbf8]" />
                      </a>
                    </div>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
