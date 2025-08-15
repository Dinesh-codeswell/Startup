/**
 * Rate limiting middleware for admin endpoints
 * Implements sliding window rate limiting with progressive delays
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
  lastRequest: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Admin authentication endpoints - stricter limits
  ADMIN_AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  
  // Admin API endpoints - moderate limits
  ADMIN_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    skipSuccessfulRequests: false
  },
  
  // Admin dashboard pages - lenient limits
  ADMIN_PAGES: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    skipSuccessfulRequests: true
  },
  
  // General API endpoints
  GENERAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: true
  }
} as const

/**
 * Generate a rate limit key based on IP address and endpoint
 */
function generateRateLimitKey(request: NextRequest, prefix: string = 'rl'): string {
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname
  return `${prefix}:${ip}:${pathname}`
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default value
  return 'unknown'
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const key = config.keyGenerator ? config.keyGenerator(request) : generateRateLimitKey(request)
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime <= now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      lastRequest: now
    }
  }
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredEntries()
  }
  
  // Check if within rate limit
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    }
  }
  
  // Increment counter
  entry.count++
  entry.lastRequest = now
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(
  retryAfter: number,
  message: string = 'Too many requests'
): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message,
      retryAfter,
      timestamp: new Date().toISOString()
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString()
      }
    }
  )
}

/**
 * Rate limiting middleware for admin endpoints
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResult = checkRateLimit(request, config)
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${getClientIP(request)} on ${request.nextUrl.pathname}`, {
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      })
      
      return createRateLimitResponse(
        rateLimitResult.retryAfter!,
        'Too many requests to admin endpoint. Please try again later.'
      )
    }
    
    // Execute the original handler
    const response = await handler(request, ...args)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return response
  }
}

/**
 * Get rate limit configuration based on request path
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    return RATE_LIMIT_CONFIGS.ADMIN_AUTH
  }
  
  if (pathname.startsWith('/api/admin') || 
      pathname.startsWith('/api/case-match') || 
      pathname.startsWith('/api/team-matching') ||
      pathname.startsWith('/api/rl-metrics')) {
    return RATE_LIMIT_CONFIGS.ADMIN_API
  }
  
  if (pathname.startsWith('/admin')) {
    return RATE_LIMIT_CONFIGS.ADMIN_PAGES
  }
  
  return RATE_LIMIT_CONFIGS.GENERAL_API
}

/**
 * Enhanced rate limiting with progressive delays
 */
export function checkProgressiveRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number; delayMs?: number } {
  const result = checkRateLimit(request, config)
  
  if (!result.allowed) {
    // Progressive delay based on how much over the limit
    const key = generateRateLimitKey(request, 'progressive')
    const entry = rateLimitStore.get(key)
    
    if (entry) {
      const overLimit = entry.count - config.maxRequests
      const delayMs = Math.min(overLimit * 1000, 30000) // Max 30 second delay
      
      return {
        ...result,
        delayMs
      }
    }
  }
  
  return result
}

/**
 * Clear rate limit for a specific IP (admin function)
 */
export function clearRateLimit(ip: string, pathname?: string): boolean {
  if (pathname) {
    const key = `rl:${ip}:${pathname}`
    return rateLimitStore.delete(key)
  } else {
    // Clear all entries for this IP
    let cleared = false
    for (const key of rateLimitStore.keys()) {
      if (key.includes(`:${ip}:`)) {
        rateLimitStore.delete(key)
        cleared = true
      }
    }
    return cleared
  }
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(request: NextRequest): RateLimitEntry | null {
  const key = generateRateLimitKey(request)
  return rateLimitStore.get(key) || null
}

/**
 * Export store size for monitoring
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size
}