// Import Supabase dynamically to avoid issues in test environment
let createClient: any

try {
  const supabaseModule = require('@supabase/supabase-js')
  createClient = supabaseModule.createClient
} catch (error) {
  // Fallback for test environment
  createClient = () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: 'Supabase not available' })
    }
  })
}

// Admin configuration interface
export interface AdminConfig {
  authorizedEmails: string[]
}

// Result interface for admin checks
export interface AdminCheckResult {
  isAdmin: boolean
  email?: string
  error?: string
}

// Core admin configuration
const ADMIN_CONFIG: AdminConfig = {
  authorizedEmails: [
    'dineshkatal.work@gmail.com',
    'katal091995@gmail.com'
  ]
}

/**
 * Get the list of authorized admin emails
 * Supports additional emails from environment variables
 */
export function getAuthorizedEmails(): string[] {
  const baseEmails = ADMIN_CONFIG.authorizedEmails
  const additionalEmails = process.env.ADDITIONAL_ADMIN_EMAILS?.split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0) || []
  
  return [...baseEmails, ...additionalEmails]
}

/**
 * Validate email format using a simple regex
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if an email is in the authorized admin list
 * Performs case-insensitive matching
 */
export function isAuthorizedAdmin(email: string): boolean {
  if (!email) {
    return false
  }
  
  const trimmedEmail = email.trim()
  if (!isValidEmail(trimmedEmail)) {
    return false
  }
  
  const authorizedEmails = getAuthorizedEmails()
  const normalizedEmail = trimmedEmail.toLowerCase()
  
  return authorizedEmails.some(adminEmail => 
    adminEmail.toLowerCase().trim() === normalizedEmail
  )
}

/**
 * Extract user session from Supabase request
 */
async function getUserFromRequest(request: Request): Promise<{ email?: string; error?: string }> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No authorization header found' }
    }

    const token = authHeader.substring(7)
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { error: 'Supabase configuration missing' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { error: 'Invalid or expired token' }
    }

    return { email: user.email }
  } catch (error) {
    return { error: 'Failed to verify user session' }
  }
}

/**
 * Check admin access for a request
 * Verifies authentication and admin authorization
 */
export async function checkAdminAccess(request: Request): Promise<AdminCheckResult> {
  try {
    // First, get the user from the request
    const { email, error } = await getUserFromRequest(request)
    
    if (error || !email) {
      return {
        isAdmin: false,
        error: error || 'No user email found'
      }
    }

    // Check if the email is authorized
    const isAdmin = isAuthorizedAdmin(email)
    
    return {
      isAdmin,
      email,
      error: isAdmin ? undefined : 'Email not authorized for admin access'
    }
  } catch (error) {
    return {
      isAdmin: false,
      error: `Admin check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Alternative admin check using cookies (for middleware)
 */
export async function checkAdminAccessFromCookies(cookies: string): Promise<AdminCheckResult> {
  try {
    // Parse cookies to find the Supabase session
    const cookieMap = new Map<string, string>()
    cookies.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        cookieMap.set(key, decodeURIComponent(value))
      }
    })

    // Look for Supabase auth token in cookies
    const authToken = cookieMap.get('sb-access-token') || 
                     cookieMap.get('supabase-auth-token') ||
                     cookieMap.get('sb-auth-token')

    if (!authToken) {
      return {
        isAdmin: false,
        error: 'No authentication token found in cookies'
      }
    }

    // Create a mock request with the auth header
    const mockRequest = new Request('http://localhost', {
      headers: {
        'authorization': `Bearer ${authToken}`
      }
    })

    return await checkAdminAccess(mockRequest)
  } catch (error) {
    return {
      isAdmin: false,
      error: `Cookie-based admin check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Utility function to create standardized admin error responses
 */
export function createAdminErrorResponse(
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'UNAUTHENTICATED',
  message: string,
  redirectTo?: string
) {
  const statusCode = code === 'UNAUTHENTICATED' ? 401 : 403
  
  return new Response(
    JSON.stringify({
      error: 'Admin access required',
      code,
      message,
      redirectTo
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}