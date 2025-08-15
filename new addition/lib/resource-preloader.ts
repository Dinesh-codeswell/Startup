// Resource preloading strategy for better performance
class ResourcePreloader {
  private preloadedResources = new Set<string>()
  private preloadQueue: Array<{ url: string; priority: 'high' | 'medium' | 'low' }> = []

  // Preload critical resources
  preloadCritical() {
    const criticalResources = [
      '/images/beyond-career-logo.png',
      '/images/beyond-career-main-logo.png'
    ]

    criticalResources.forEach(url => {
      if (!this.preloadedResources.has(url)) {
        this.preloadImage(url)
        this.preloadedResources.add(url)
      }
    })
  }

  // Preload images
  preloadImage(url: string) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  }

  // Preload API endpoints
  preloadAPI(endpoint: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = endpoint
    document.head.appendChild(link)
  }

  // Preload fonts
  preloadFonts() {
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ]

    fonts.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Preload critical CSS
  preloadCriticalCSS() {
    const criticalCSS = [
      '/globals.css'
    ]

    criticalCSS.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Add to preload queue
  queuePreload(url: string, priority: 'high' | 'medium' | 'low' = 'medium') {
    this.preloadQueue.push({ url, priority })
    this.processQueue()
  }

  // Process preload queue
  private processQueue() {
    if (this.preloadQueue.length === 0) return

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    // Process high priority items immediately
    const highPriority = this.preloadQueue.filter(item => item.priority === 'high')
    highPriority.forEach(item => {
      this.preloadImage(item.url)
      this.preloadedResources.add(item.url)
    })

    // Process medium and low priority items with delay
    const otherItems = this.preloadQueue.filter(item => item.priority !== 'high')
    if (otherItems.length > 0) {
      setTimeout(() => {
        otherItems.forEach(item => {
          this.preloadImage(item.url)
          this.preloadedResources.add(item.url)
        })
      }, 1000) // 1 second delay
    }

    this.preloadQueue = []
  }

  // Initialize preloading
  init() {
    this.preloadCritical()
    this.preloadFonts()
    this.preloadCriticalCSS()
    
    // Preload API endpoints
    this.preloadAPI('/api/resources/views/batch')
    
    // Preload Spline runtime (with delay to not block initial render)
    setTimeout(() => {
      this.preloadSplineRuntime()
    }, 3000) // 3 second delay
  }

  // Preload Spline runtime
  preloadSplineRuntime() {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = 'https://prod.spline.design/Gt17pQ-CXEgcTVUl/scene.splinecode'
    document.head.appendChild(link)
  }

  // Get preload stats
  getStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      queueLength: this.preloadQueue.length
    }
  }
}

export const resourcePreloader = new ResourcePreloader()

// Initialize preloader when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      resourcePreloader.init()
    })
  } else {
    resourcePreloader.init()
  }
}
