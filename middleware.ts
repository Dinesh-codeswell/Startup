import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'
import { checkRateLimit, getRateLimitConfig, createRateLimitResponse } from '@/lib/rate-limiter'

// Admin configuration - matches the admin-utils.ts configuration
const AUTHORIZED_ADMIN_EMAILS = [
  'dineshkatal.work@gmail.com',
  'katal091995@gmail.com'
]

/**
 * Get additional admin emails from environment variables
 */
function getAdditionalAdminEmails(): string[] {
  const additionalEmails = process.env.ADDITIONAL_ADMIN_EMAILS?.split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0) || []
  
  return additionalEmails
}

/**
 * Get all authorized admin emails
 */
function getAllAuthorizedEmails(): string[] {
  return [...AUTHORIZED_ADMIN_EMAILS, ...getAdditionalAdminEmails()]
}

/**
 * Check if an email is authorized for admin access
 */
function isAuthorizedAdmin(email: string): boolean {
  if (!email) return false
  
  const normalizedEmail = email.toLowerCase().trim()
  const authorizedEmails = getAllAuthorizedEmails()
  
  return authorizedEmails.some(adminEmail => 
    adminEmail.toLowerCase().trim() === normalizedEmail
  )
}

/**
 * Check if the current route should be protected
 */
function shouldProtectRoute(pathname: string): boolean {
  // Protect all admin routes
  if (pathname.startsWith('/admin')) {
    return true
  }
  
  // Protect admin-specific page routes
  const adminPageRoutes = [
    '/case-match',
    '/rl-dashboard'
  ]
  
  // Protect admin-specific API routes
  const adminApiRoutes = [
    '/api/case-match/upload',
    '/api/case-match/analyze', 
    '/api/case-match/save-teams',
    '/api/team-matching/approve',
    '/api/team-matching/form-teams',
    '/api/team-matching/automated-formation',
    '/api/rl-metrics'
  ]
  
  return adminPageRoutes.some(route => pathname === route) || 
         adminApiRoutes.some(route => pathname.startsWith(route))
}

/**
 * Create redirect response for unauthenticated users
 */
function createUnauthenticatedRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url)
  // Add return URL so user can be redirected back after login
  const returnTo = request.nextUrl.pathname + request.nextUrl.search
  loginUrl.searchParams.set('returnTo', returnTo)
  
  // Add helpful query parameters for better UX
  loginUrl.searchParams.set('reason', 'admin_required')
  loginUrl.searchParams.set('message', 'Admin access required')
  
  return NextResponse.redirect(loginUrl)
}

/**
 * Create response for unauthorized admin access
 */
function createUnauthorizedResponse(request: NextRequest, userEmail?: string): NextResponse {
  const timestamp = new Date().toISOString()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // For API routes, return enhanced JSON error
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({
        error: 'Admin access required',
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource. Admin privileges are required.',
        details: userEmail 
          ? `Account ${userEmail} is not authorized for admin access. Contact your system administrator if you believe this is an error.`
          : 'Please sign in with an authorized admin account.',
        timestamp,
        requestId,
        path: request.nextUrl.pathname
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Code': 'FORBIDDEN',
          'X-Request-ID': requestId,
          'X-Timestamp': timestamp
        }
      }
    )
  }
  
  // For page routes, redirect to unauthorized page with context
  const unauthorizedUrl = new URL('/admin/unauthorized', request.url)
  const returnTo = request.nextUrl.pathname + request.nextUrl.search
  unauthorizedUrl.searchParams.set('returnTo', returnTo)
  
  if (userEmail) {
    unauthorizedUrl.searchParams.set('email', userEmail)
  }
  
  return NextResponse.redirect(unauthorizedUrl)
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for non-admin routes
  if (!shouldProtectRoute(pathname)) {
    return NextResponse.next()
  }

  // Apply rate limiting to admin routes
  const rateLimitConfig = getRateLimitConfig(pathname)
  const rateLimitResult = checkRateLimit(request, rateLimitConfig)
  
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for admin route: ${pathname}`, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    })
    
    return createRateLimitResponse(
      rateLimitResult.retryAfter!,
      'Too many requests to admin endpoint. Please try again later.'
    )
  }

  try {
    // Update session and get user info using proper Supabase SSR
    const { response, user, error } = await updateSession(request)
    
    // If no valid session, redirect to login
    if (error || !user || !user.email) {
      console.log(`Admin access denied - no valid session: ${error?.message || 'No user found'}`)
      return createUnauthenticatedRedirect(request)
    }
    
    // Check if user is authorized admin
    if (!isAuthorizedAdmin(user.email)) {
      console.log(`Admin access denied - unauthorized email: ${user.email}`)
      return createUnauthorizedResponse(request, user.email)
    }
    
    // User is authenticated and authorized - allow access
    console.log(`Admin access granted to: ${user.email} for ${pathname}`)
    return response
    
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, deny access for security
    return createUnauthorizedResponse(request)
  }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    // Match all admin pages
    '/admin/:path*',
    // Match admin-specific page routes
    '/case-match',
    '/rl-dashboard',
    // Match admin-specific API routes
    '/api/case-match/upload',
    '/api/case-match/analyze',
    '/api/case-match/save-teams',
    '/api/team-matching/approve',
    '/api/team-matching/form-teams', 
    '/api/team-matching/automated-formation',
    '/api/rl-metrics'
  ]
}
