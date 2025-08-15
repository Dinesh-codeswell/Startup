interface PreloadOptions {
  priority?: "high" | "low"
  as?: "script" | "style" | "image" | "font"
  crossOrigin?: "anonymous" | "use-credentials"
}

class ResourcePreloader {
  private preloadedResources = new Set<string>()

  preload(href: string, options: PreloadOptions = {}) {
    if (this.preloadedResources.has(href)) {
      return
    }

    const link = document.createElement("link")
    link.rel = "preload"
    link.href = href

    if (options.as) {
      link.as = options.as
    }

    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin
    }

    if (options.priority === "high") {
      link.setAttribute("fetchpriority", "high")
    }

    document.head.appendChild(link)
    this.preloadedResources.add(href)
  }

  preloadImage(src: string, priority: "high" | "low" = "low") {
    this.preload(src, { as: "image", priority })
  }

  preloadScript(src: string, priority: "high" | "low" = "low") {
    this.preload(src, { as: "script", priority })
  }

  preloadStyle(href: string, priority: "high" | "low" = "low") {
    this.preload(href, { as: "style", priority })
  }

  preloadFont(href: string, crossOrigin: "anonymous" | "use-credentials" = "anonymous") {
    this.preload(href, { as: "font", crossOrigin })
  }

  isPreloaded(href: string): boolean {
    return this.preloadedResources.has(href)
  }

  clear() {
    this.preloadedResources.clear()
  }
}

export const resourcePreloader = new ResourcePreloader()
