import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { isAuthorizedAdmin } from './admin-utils'

export interface AdminAPIResponse {
  authorized: boolean
  user?: {
    id: string
    email: string
    email_verified: boolean
  }
  error?: string
}

export interface AdminErrorResponse {
  error: string
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'UNAUTHENTICATED'
  message: string
  details?: string
  redirectTo?: string
  timestamp: string
  requestId?: string
}

/**
 * Verifies if the current request has admin access
 * @param request - The incoming request object
 * @returns Promise<AdminAPIResponse> - Admin verification result
 */
export async function requireAdminAccess(request: NextRequest): Promise<AdminAPIResponse> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authorized: false,
        error: 'No authorization token provided'
      }
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the JWT token using the admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return {
        authorized: false,
        error: 'User not authenticated'
      }
    }
    
    // Check if user email is in authorized admin list
    if (!user.email || !isAuthorizedAdmin(user.email)) {
      return {
        authorized: false,
        error: 'Insufficient permissions - admin access required'
      }
    }
    
    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        email_verified: !!user.email_confirmed_at
      }
    }
    
  } catch (error) {
    console.error('Admin access verification error:', error)
    return {
      authorized: false,
      error: 'Internal server error during admin verification'
    }
  }
}

/**
 * Creates a standardized error response for unauthorized API access
 * @param type - Type of authorization error
 * @param customMessage - Optional custom error message
 * @param details - Optional additional details about the error
 * @param requestId - Optional request ID for tracking
 * @returns NextResponse with appropriate error status and body
 */
export function createUnauthorizedResponse(
  type: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'UNAUTHORIZED' = 'FORBIDDEN',
  customMessage?: string,
  details?: string,
  requestId?: string
): NextResponse {
  const timestamp = new Date().toISOString()
  
  const errorResponses: Record<string, Omit<AdminErrorResponse, 'timestamp' | 'requestId' | 'details'>> = {
    UNAUTHENTICATED: {
      error: 'Authentication required',
      code: 'UNAUTHENTICATED',
      message: customMessage || 'You must be logged in to access this resource',
      redirectTo: '/login'
    },
    FORBIDDEN: {
      error: 'Access forbidden',
      code: 'FORBIDDEN',
      message: customMessage || 'You do not have permission to access this resource. Admin privileges are required.'
    },
    UNAUTHORIZED: {
      error: 'Unauthorized access',
      code: 'UNAUTHORIZED',
      message: customMessage || 'Admin privileges required to access this resource'
    }
  }
  
  const baseResponse = errorResponses[type]
  const errorResponse: AdminErrorResponse = {
    ...baseResponse,
    timestamp,
    ...(details && { details }),
    ...(requestId && { requestId })
  }
  
  const statusCode = type === 'UNAUTHENTICATED' ? 401 : 403
  
  // Add helpful headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Error-Code': errorResponse.code,
    'X-Timestamp': timestamp
  })
  
  if (requestId) {
    headers.set('X-Request-ID', requestId)
  }
  
  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers
  })
}

/**
 * Higher-order function that wraps API route handlers with admin protection
 * @param handler - The original API route handler function
 * @returns Protected API route handler
 */
export function withAdminProtection(
  handler: (request: NextRequest, context: any, adminUser: NonNullable<AdminAPIResponse['user']>) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Verify admin access
      const adminCheck = await requireAdminAccess(request)
      
      if (!adminCheck.authorized) {
        // Generate request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Determine appropriate error type with enhanced details
        if (adminCheck.error?.includes('not authenticated') || adminCheck.error?.includes('No authorization token')) {
          return createUnauthorizedResponse(
            'UNAUTHENTICATED', 
            'Authentication required to access admin resources',
            `Original error: ${adminCheck.error}. Please sign in with an authorized admin account.`,
            requestId
          )
        } else if (adminCheck.error?.includes('not verified')) {
          return createUnauthorizedResponse(
            'UNAUTHENTICATED', 
            'Email verification required',
            'Please verify your email address before accessing admin features.',
            requestId
          )
        } else if (adminCheck.error?.includes('Insufficient permissions')) {
          return createUnauthorizedResponse(
            'FORBIDDEN', 
            'Admin access denied',
            'Your account does not have administrative privileges. Contact your system administrator if you believe this is an error.',
            requestId
          )
        } else {
          return createUnauthorizedResponse(
            'FORBIDDEN', 
            'Access denied',
            `Admin verification failed: ${adminCheck.error}`,
            requestId
          )
        }
      }
      
      // Call the original handler with admin user context
      return await handler(request, context, adminCheck.user!)
      
    } catch (error) {
      console.error('Admin protection wrapper error:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'UNAUTHORIZED',
          message: 'An error occurred while verifying admin access'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Simplified admin check for API routes that just need boolean verification
 * @param request - The incoming request object
 * @returns Promise<boolean> - True if user has admin access
 */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const adminCheck = await requireAdminAccess(request)
  return adminCheck.authorized
}

/**
 * Middleware-style admin verification that can be used in API routes
 * Returns early response if not authorized, otherwise continues
 * @param request - The incoming request object
 * @returns Promise<NextResponse | null> - Error response if unauthorized, null if authorized
 */
export async function verifyAdminOrRespond(request: NextRequest): Promise<NextResponse | null> {
  const adminCheck = await requireAdminAccess(request)
  
  if (!adminCheck.authorized) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (adminCheck.error?.includes('not authenticated') || adminCheck.error?.includes('No authorization token')) {
      return createUnauthorizedResponse(
        'UNAUTHENTICATED', 
        'Authentication required',
        `Please sign in with an authorized admin account. ${adminCheck.error}`,
        requestId
      )
    } else if (adminCheck.error?.includes('not verified')) {
      return createUnauthorizedResponse(
        'UNAUTHENTICATED', 
        'Email verification required',
        'Please verify your email address before accessing admin features.',
        requestId
      )
    } else {
      return createUnauthorizedResponse(
        'FORBIDDEN', 
        'Admin access denied',
        `Your account does not have administrative privileges. ${adminCheck.error}`,
        requestId
      )
    }
  }
  
  return null // Continue processing
}
