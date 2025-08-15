import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AdminProvider } from "@/contexts/admin-context"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beyond Career : Personalized career guidance for every student",
  icons: {
    icon: "/images/beyond-career-logo.svg", // Make sure this matches the file name
  },
  description:
    "Built by IIT Kharagpur alumni, Beyond Career offers personalized AI-driven roadmaps, prep kits, and mock interviews to help students confidently navigate their career journey from college to placement.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AdminProvider>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
