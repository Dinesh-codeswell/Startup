import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AdminProvider } from "@/contexts/admin-context"
import { OAuthHandler } from "@/components/OAuthHandler"
import { AuthStateHandler } from "@/components/AuthStateHandler"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import ErrorBoundary from "@/components/ErrorBoundary"
import { Suspense } from "react"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "Beyond Career : Personalized career guidance for every student",
  icons: {
    icon: "/images/beyond-career-logo.svg",
  },
  description:
    "Built by IIT Kharagpur alumni, Beyond Career offers personalized AI-driven roadmaps, prep kits, and mock interviews to help students confidently navigate their career journey from college to placement.",
  generator: "v0.dev",
  robots: "index, follow",
  authors: [{ name: "Beyond Career Team" }],
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

import { LoadingSpinner } from "@/components/LoadingSpinner"

// Loading component for better UX
function LoadingFallback() {
  return <LoadingSpinner fullScreen text="Loading..." />
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#081F5C" />
        <link rel="preload" href="/images/beyond-career-logo.png" as="image" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <AuthProvider>
            <AdminProvider>
              <Suspense fallback={<LoadingFallback />}>
                <OAuthHandler />
                <AuthStateHandler />
                {children}
              </Suspense>
            </AdminProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
