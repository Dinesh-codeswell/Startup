import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Suspense } from "react"
import ScrollToTop from "@/components/scroll-to-top"
import BackToTop from "@/components/back-to-top"
import { resourcePreloader } from "@/lib/resource-preloader"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beyond Career : Personalized career guidance for every student",
  icons: {
    icon: "data:image/jpeg;base64,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", // Make sure this matches the file name
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
       <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JKJEHSF44V"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JKJEHSF44V');
            `,
          }}
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/images/beyond-career-logo.png" as="image" />
        <link rel="preload" href="/images/beyond-career-main-logo.png" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <AuthProvider>

          <ScrollToTop />
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </AuthProvider>
         <Analytics />
         <SpeedInsights/>
      </body>
    </html>
  )
}
