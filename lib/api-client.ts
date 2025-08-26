// Optimized API client with caching and request deduplication

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class ApiClient {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  private setCache(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private getCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (entry && this.isValidCache(entry)) {
      return entry.data
    }
    if (entry) {
      this.cache.delete(key)
    }
    return null
  }

  async request<T = any>(
    url: string,
    options: RequestInit & { 
      cache?: boolean
      cacheTTL?: number
      skipDeduplication?: boolean 
    } = {}
  ): Promise<T> {
    const { cache = true, cacheTTL = this.defaultTTL, skipDeduplication = false, ...fetchOptions } = options
    const cacheKey = this.getCacheKey(url, fetchOptions)

    // Check cache for GET requests
    if (cache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      const cachedData = this.getCache(cacheKey)
      if (cachedData) {
        return cachedData
      }
    }

    // Check for pending requests to avoid duplication
    if (!skipDeduplication && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Make the request
    const requestPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        // Cache successful GET requests
        if (cache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
          this.setCache(cacheKey, data, cacheTTL)
        }
        
        return data
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey)
      })

    // Store pending request
    this.pendingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }

  // Convenience methods
  async get<T = any>(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, options?: Omit<Parameters<typeof this.request>[1], 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      cache: false, // Don't cache POST requests
    })
  }

  async put<T = any>(url: string, data?: any, options?: Omit<Parameters<typeof this.request>[1], 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      cache: false, // Don't cache PUT requests
    })
  }

  async delete<T = any>(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE', cache: false })
  }

  // Clear cache
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Prefetch data
  async prefetch(url: string, options?: Parameters<typeof this.request>[1]): Promise<void> {
    try {
      await this.request(url, options)
    } catch (error) {
      console.warn('Prefetch failed:', error)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// React hook for API calls
import { useState, useEffect, useCallback } from 'react'

interface UseApiOptions<T> {
  initialData?: T
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T = any>(
  url: string | null,
  options: RequestInit & UseApiOptions<T> = {}
) {
  const { initialData, enabled = true, onSuccess, onError, ...fetchOptions } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiClient.request<T>(url, fetchOptions)
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [url, enabled, onSuccess, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    if (url) {
      apiClient.clearCache(url)
      fetchData()
    }
  }, [url, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
  }
}