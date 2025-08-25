"use client"

import { useScrollRestoration } from "@/hooks/use-scroll-restoration"

export default function ScrollToTop() {
  useScrollRestoration()
  return null
}
