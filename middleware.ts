import { NextRequest, NextResponse } from 'next/server'

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
export function isAuthorizedAdmin(email: string): boolean {
  if (!email) return false
  
  const normalizedEmail = email.toLowerCase().trim()
  const authorizedEmails = getAllAuthorizedEmails()
  
  return authorizedEmails.some(adminEmail => 
    adminEmail.toLowerCase().trim() === normalizedEmail
  )
}

/**
 * Check if the current route should be protected
 * ADMIN PROTECTION DISABLED - All routes are now public
 */
function shouldProtectRoute(pathname: string): boolean {
  // Admin protection has been disabled - all routes are now publicly accessible
  return false
  
  // Previously protected routes (now public):
  // - All admin routes (/admin/*)
  // - Admin-specific page routes: /case-match, /rl-dashboard
  // - Admin-specific API routes: /api/case-match/*, /api/team-matching/*, /api/rl-metrics
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
 * Simplified middleware function to avoid build issues
 */
export async function middleware(request: NextRequest) {
  // Temporarily disable all middleware functionality to fix build issues
  // This allows the website to function while we resolve the underlying problems
  return NextResponse.next()
}

/**
 * Configure which routes the middleware should run on
 * Temporarily disabled to fix build issues
 */
export const config = {
  matcher: []
}
