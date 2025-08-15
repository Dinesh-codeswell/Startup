import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'
import { requireAdminAccess, withAdminProtection } from '../lib/admin-api-protection'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}))

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn()
    }
  }))
}))

const mockGetUser = vi.fn()
const mockGetSession = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Test data
const ADMIN_EMAIL = 'dineshkatal.work@gmail.com'
const NON_ADMIN_EMAIL = 'user@example.com'
const VALID_USER_SESSION = {
  user: {
    id: 'admin-user-123',
    email: ADMIN_EMAIL,
    email_confirmed_at: '2023-01-01T00:00:00Z'
  }
}
const NON_ADMIN_USER_SESSION = {
  user: {
    id: 'regular-user-123',
    email: NON_ADMIN_EMAIL,
    email_confirmed_at: '2023-01-01T00:00:00Z'
  }
}

// Helper function to create mock request
function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `https://example.com${pathname}`
  const request = new NextRequest(url)
  
  const mockCookies = new Map()
  Object.entries(cookies).forEach(([key, value]) => {
    mockCookies.set(key, { value })
  })
  
  Object.defineProperty(request, 'cookies', {
    get: () => ({
      get: (key: string) => mockCookies.get(key)
    })
  })
  
  return request
}

describe('Admin Access Control Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    
    // Reset mock implementations
    const { createClient } = require('@supabase/supabase-js')
    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
    
    createClient.mockReturnValue({
      auth: {
        getUser: mockGetUser
      }
    })
    
    createRouteHandlerClient.mockReturnValue({
      auth: {
        getSession: mockGetSession
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Admin Route Protection Flow', () => {
    it('should allow admin user complete access to admin dashboard', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: VALID_USER_SESSION.user },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access (NextResponse.next())
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307) // Not a redirect
      expect(response.status).not.toBe(403) // Not forbidden
    })

    it('should block non-admin user from admin dashboard', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-user-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: NON_ADMIN_USER_SESSION.user },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/not-found')
    })

    it('should redirect unauthenticated user to login', async () => {
      const request = createMockRequest('/admin/dashboard')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('returnTo=%2Fadmin%2Fdashboard')
    })
  })

  describe('Admin API Endpoint Protection Flow', () => {
    it('should allow admin user to access protected API endpoints', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: VALID_USER_SESSION.user },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access for admin API routes
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(403)
      expect(response.status).not.toBe(307)
    })

    it('should block non-admin user from protected API endpoints', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-user-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: NON_ADMIN_USER_SESSION.user },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      expect(response.headers.get('content-type')).toBe('application/json')
      
      const body = await response.json()
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 401 for unauthenticated API requests', async () => {
      const request = createMockRequest('/api/case-match/upload')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect to login for unauthenticated
      expect(response.headers.get('location')).toContain('/login')
    })
  })

  describe('API Protection with requireAdminAccess', () => {
    it('should authorize admin user through requireAdminAccess', async () => {
      const request = createMockRequest('/api/admin/test')
      
      mockGetSession.mockResolvedValue({
        data: { session: VALID_USER_SESSION },
        error: null
      })
      
      const result = await requireAdminAccess(request)
      
      expect(result.authorized).toBe(true)
      expect(result.user).toEqual({
        id: 'admin-user-123',
        email: ADMIN_EMAIL,
        email_verified: true
      })
      expect(result.error).toBeUndefined()
    })

    it('should reject non-admin user through requireAdminAccess', async () => {
      const request = createMockRequest('/api/admin/test')
      
      mockGetSession.mockResolvedValue({
        data: { session: NON_ADMIN_USER_SESSION },
        error: null
      })
      
      const result = await requireAdminAccess(request)
      
      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Insufficient permissions - admin access required')
    })
  })

  describe('Protected Handler Integration', () => {
    it('should execute handler for admin user', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const protectedHandler = withAdminProtection(mockHandler)
      
      const request = createMockRequest('/api/admin/test')
      
      mockGetSession.mockResolvedValue({
        data: { session: VALID_USER_SESSION },
        error: null
      })
      
      const response = await protectedHandler(request, {})
      
      expect(mockHandler).toHaveBeenCalledWith(request, {}, {
        id: 'admin-user-123',
        email: ADMIN_EMAIL,
        email_verified: true
      })
      
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should block handler execution for non-admin user', async () => {
      const mockHandler = vi.fn()
      const protectedHandler = withAdminProtection(mockHandler)
      
      const request = createMockRequest('/api/admin/test')
      
      mockGetSession.mockResolvedValue({
        data: { session: NON_ADMIN_USER_SESSION },
        error: null
      })
      
      const response = await protectedHandler(request, {})
      
      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
    })
  })

  describe('Multiple Admin Routes Protection', () => {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/case-match',
      '/admin/team-matching',
      '/admin/settings'
    ]

    it('should protect all admin page routes', async () => {
      for (const route of adminRoutes) {
        const request = createMockRequest(route, {
          'sb-access-token': 'valid-user-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { user: NON_ADMIN_USER_SESSION.user },
          error: null
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(307) // Should redirect non-admin users
        expect(response.headers.get('location')).toContain('/not-found')
      }
    })

    const adminApiRoutes = [
      '/api/case-match/upload',
      '/api/case-match/analyze',
      '/api/case-match/save-teams',
      '/api/team-matching/approve',
      '/api/team-matching/form-teams',
      '/api/team-matching/automated-formation',
      '/api/rl-metrics'
    ]

    it('should protect all admin API routes', async () => {
      for (const route of adminApiRoutes) {
        const request = createMockRequest(route, {
          'sb-access-token': 'valid-user-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { user: NON_ADMIN_USER_SESSION.user },
          error: null
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403) // Should return 403 for API routes
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
      }
    })
  })

  describe('Session State Transitions', () => {
    it('should handle session expiry during admin operations', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'expired-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'Token expired'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect to login
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('returnTo=%2Fadmin%2Fdashboard')
    })

    it('should handle admin user logout and re-authentication', async () => {
      // First request - authenticated admin
      let request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: VALID_USER_SESSION.user },
        error: null
      })
      
      let response = await middleware(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
      
      // Second request - logged out
      request = createMockRequest('/admin/dashboard')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No session'
      })
      
      response = await middleware(request)
      expect(response.status).toBe(307) // Redirect to login
      
      // Third request - re-authenticated
      request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'new-valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: VALID_USER_SESSION.user },
        error: null
      })
      
      response = await middleware(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle Supabase service errors gracefully', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockRejectedValue(new Error('Supabase service unavailable'))
      
      const response = await middleware(request)
      
      // Should default to denying access
      expect(response.status).toBe(307) // Redirect to login
    })

    it('should handle network errors during admin verification', async () => {
      const request = createMockRequest('/api/case-match/upload')
      
      mockGetSession.mockRejectedValue(new Error('Network timeout'))
      
      const result = await requireAdminAccess(request)
      
      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Internal server error during admin verification')
    })

    it('should handle malformed session data', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: {
            id: 'user-123',
            // Missing email field
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should deny access for malformed user data
      expect(response.status).toBe(307) // Redirect to not-found
    })
  })
})