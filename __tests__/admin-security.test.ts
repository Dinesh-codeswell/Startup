import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'
import { requireAdminAccess, withAdminProtection } from '../lib/admin-api-protection'
import { isAuthorizedAdmin } from '../lib/admin-utils'

// Mock Supabase
const mockGetUser = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}))

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession
    }
  }))
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Helper function to create mock request with custom headers
function createMockRequest(
  pathname: string, 
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
) {
  const url = `https://example.com${pathname}`
  const request = new NextRequest(url, { headers })
  
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

describe('Admin Security Tests', () => {
  const ADMIN_EMAIL = 'dineshkatal.work@gmail.com'
  const NON_ADMIN_EMAIL = 'user@example.com'
  
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

  describe('Authentication Bypass Attempts', () => {
    it('should reject requests with forged admin cookies', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'forged-admin-token',
        'admin-bypass': 'true', // Fake admin flag
        'user-role': 'admin' // Fake role
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'Invalid token'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to login
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should reject requests with manipulated JWT tokens', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4ifQ.invalid-signature'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'Invalid JWT signature'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to login
    })

    it('should reject requests with expired tokens claiming admin access', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'expired-token-with-admin-claims'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'Token expired'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to login
    })

    it('should reject requests with no authentication attempting admin access', async () => {
      const request = createMockRequest('/admin/dashboard')
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to login
      expect(response.headers.get('location')).toContain('/login')
    })
  })

  describe('Authorization Bypass Attempts', () => {
    it('should reject valid user with non-admin email attempting admin access', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-user-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to not-found
      expect(response.headers.get('location')).toContain('/not-found')
    })

    it('should reject attempts to access admin APIs with non-admin credentials', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-user-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should reject requests with custom admin headers', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-user-token'
      }, {
        'X-Admin-Override': 'true',
        'X-User-Role': 'admin',
        'Authorization': 'Bearer admin-override-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should ignore custom headers and check actual session
      expect(response.status).toBe(307) // Should redirect to not-found
    })
  })

  describe('Email Manipulation Attempts', () => {
    it('should handle email case manipulation attempts', async () => {
      // Test that case variations don't bypass security
      const emailVariations = [
        'DINESHKATAL.WORK@GMAIL.COM',
        'dineshkatal.work@GMAIL.COM',
        'DiNeSh KaTaL.WoRk@GmAiL.CoM'
      ]
      
      for (const email of emailVariations) {
        const request = createMockRequest('/admin/dashboard', {
          'sb-access-token': 'valid-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              id: 'user-123',
              email: email,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        // Should allow access for case variations of admin email
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(307)
        expect(response.status).not.toBe(403)
      }
    })

    it('should reject similar but non-matching admin emails', async () => {
      const similarEmails = [
        'dineshkatal.work@gmail.co', // Missing 'm'
        'dineshkatal.works@gmail.com', // Extra 's'
        'dineshkatal-work@gmail.com', // Dash instead of dot
        'dineshkatal.work+admin@gmail.com', // Plus addressing
        'admin@dineshkatal.work.gmail.com' // Subdomain manipulation
      ]
      
      for (const email of similarEmails) {
        const request = createMockRequest('/admin/dashboard', {
          'sb-access-token': 'valid-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              id: 'user-123',
              email: email,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        // Should deny access for similar but non-matching emails
        expect(response.status).toBe(307) // Should redirect to not-found
      }
    })

    it('should handle whitespace manipulation in emails', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: '  dineshkatal.work@gmail.com  ', // Whitespace padding
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should handle whitespace and still allow access
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
    })
  })

  describe('Session Manipulation Attempts', () => {
    it('should reject requests with malformed user objects', async () => {
      const malformedUsers = [
        null,
        undefined,
        {},
        { id: 'user-123' }, // Missing email
        { email: ADMIN_EMAIL }, // Missing id
        { id: 'user-123', email: '' }, // Empty email
        { id: '', email: ADMIN_EMAIL }, // Empty id
      ]
      
      for (const user of malformedUsers) {
        const request = createMockRequest('/admin/dashboard', {
          'sb-access-token': 'valid-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { user },
          error: null
        })
        
        const response = await middleware(request)
        
        // Should deny access for malformed user data
        expect(response.status).toBe(307) // Should redirect
      }
    })

    it('should handle concurrent session manipulation attempts', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createMockRequest('/admin/dashboard', {
          'sb-access-token': `concurrent-token-${i}`
        })
      )
      
      // Mock different responses for concurrent requests
      mockGetUser
        .mockResolvedValueOnce({ data: { user: { id: '1', email: ADMIN_EMAIL, email_confirmed_at: '2023-01-01T00:00:00Z' }}, error: null })
        .mockResolvedValueOnce({ data: { user: null }, error: 'Invalid token' })
        .mockResolvedValueOnce({ data: { user: { id: '2', email: NON_ADMIN_EMAIL, email_confirmed_at: '2023-01-01T00:00:00Z' }}, error: null })
        .mockResolvedValue({ data: { user: null }, error: 'Session error' })
      
      const responses = await Promise.all(
        requests.map(request => middleware(request))
      )
      
      // First request should succeed (admin user)
      expect(responses[0]).toBeInstanceOf(NextResponse)
      expect(responses[0].status).not.toBe(307)
      
      // Second request should redirect (invalid token)
      expect(responses[1].status).toBe(307)
      
      // Third request should redirect (non-admin user)
      expect(responses[2].status).toBe(307)
      
      // Remaining requests should redirect (session errors)
      for (let i = 3; i < responses.length; i++) {
        expect(responses[i].status).toBe(307)
      }
    })
  })

  describe('API Security Edge Cases', () => {
    it('should handle API requests with mixed authentication states', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'sensitive' }))
      const protectedHandler = withAdminProtection(mockHandler)
      
      // First call - authenticated admin
      mockGetSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { 
              id: 'admin-123', 
              email: ADMIN_EMAIL, 
              email_confirmed_at: '2023-01-01T00:00:00Z' 
            }
          }
        },
        error: null
      })
      
      let request = createMockRequest('/api/admin/test')
      let response = await protectedHandler(request, {})
      
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
      
      // Second call - session expired
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: 'Session expired'
      })
      
      request = createMockRequest('/api/admin/test')
      response = await protectedHandler(request, {})
      
      expect(mockHandler).toHaveBeenCalledTimes(1) // Should not be called again
      expect(response.status).toBe(401)
    })

    it('should prevent timing attacks on admin verification', async () => {
      const startTime = Date.now()
      
      // Test with non-existent user
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: 'User not found'
      })
      
      let request = createMockRequest('/api/admin/test')
      await requireAdminAccess(request)
      
      const nonExistentUserTime = Date.now() - startTime
      
      // Test with valid non-admin user
      const startTime2 = Date.now()
      
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'user-123', 
              email: NON_ADMIN_EMAIL, 
              email_confirmed_at: '2023-01-01T00:00:00Z' 
            }
          }
        },
        error: null
      })
      
      request = createMockRequest('/api/admin/test')
      await requireAdminAccess(request)
      
      const validUserTime = Date.now() - startTime2
      
      // Time difference should be minimal to prevent timing attacks
      const timeDifference = Math.abs(nonExistentUserTime - validUserTime)
      expect(timeDifference).toBeLessThan(100) // Less than 100ms difference
    })

    it('should handle rapid successive admin verification requests', async () => {
      const requests = Array.from({ length: 50 }, () => 
        createMockRequest('/api/admin/test')
      )
      
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'admin-123', 
              email: ADMIN_EMAIL, 
              email_confirmed_at: '2023-01-01T00:00:00Z' 
            }
          }
        },
        error: null
      })
      
      const startTime = Date.now()
      const results = await Promise.all(
        requests.map(request => requireAdminAccess(request))
      )
      const endTime = Date.now()
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.authorized).toBe(true)
      })
      
      // Should complete within reasonable time (not be rate limited)
      expect(endTime - startTime).toBeLessThan(5000) // Less than 5 seconds
    })
  })

  describe('Environment Variable Security', () => {
    it('should handle missing Supabase configuration securely', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      const response = await middleware(request)
      
      // Should deny access when Supabase is not configured
      expect(response.status).toBe(307) // Redirect to login
    })

    it('should validate additional admin emails from environment', async () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'test@example.com,malicious@hacker.com'
      
      // Test legitimate additional admin
      expect(isAuthorizedAdmin('test@example.com')).toBe(true)
      
      // Test that base admins still work
      expect(isAuthorizedAdmin(ADMIN_EMAIL)).toBe(true)
      
      // Test non-admin email
      expect(isAuthorizedAdmin('random@user.com')).toBe(false)
    })

    it('should handle malformed additional admin emails', async () => {
      const malformedConfigs = [
        'invalid-email,test@example.com',
        'test@example.com,,admin@test.com',
        '  ,  ,test@example.com,  ',
        'test@example.com;admin@test.com', // Wrong separator
      ]
      
      for (const config of malformedConfigs) {
        process.env.ADDITIONAL_ADMIN_EMAILS = config
        
        // Should still work for valid emails in the config
        expect(isAuthorizedAdmin('test@example.com')).toBe(true)
        
        // Should not break the base admin functionality
        expect(isAuthorizedAdmin(ADMIN_EMAIL)).toBe(true)
        
        // Should reject invalid emails
        expect(isAuthorizedAdmin('invalid-email')).toBe(false)
      }
    })
  })

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error responses', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-user-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      
      const body = await response.json()
      
      // Should not leak user information
      expect(body).not.toHaveProperty('user')
      expect(body).not.toHaveProperty('session')
      expect(body).not.toHaveProperty('email')
      
      // Should only contain generic error information
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should handle database errors without exposing internal details', async () => {
      const request = createMockRequest('/api/admin/test')
      
      mockGetSession.mockRejectedValue(new Error('Database connection failed: host=db.internal.com port=5432'))
      
      const result = await requireAdminAccess(request)
      
      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Internal server error during admin verification')
      
      // Should not expose internal database details
      expect(result.error).not.toContain('db.internal.com')
      expect(result.error).not.toContain('5432')
    })
  })
})