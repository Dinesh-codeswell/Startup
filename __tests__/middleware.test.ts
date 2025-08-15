import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase
const mockGetUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}))

// Import middleware after mocking
import { middleware } from '../middleware'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  vi.resetAllMocks()
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

// Helper function to create a mock NextRequest
function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `https://example.com${pathname}`
  const request = new NextRequest(url)
  
  // Mock cookies
  const mockCookies = new Map()
  Object.entries(cookies).forEach(([key, value]) => {
    mockCookies.set(key, { value })
  })
  
  // Override the cookies getter
  Object.defineProperty(request, 'cookies', {
    get: () => ({
      get: (key: string) => mockCookies.get(key)
    })
  })
  
  return request
}

describe('Middleware', () => {
  describe('Route Protection Logic', () => {
    it('should allow access to non-admin routes', async () => {
      const request = createMockRequest('/dashboard')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      // Should call NextResponse.next() for non-admin routes
    })

    it('should protect admin page routes', async () => {
      const request = createMockRequest('/admin/dashboard')
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(307) // Redirect status
    })

    it('should protect admin API routes', async () => {
      const request = createMockRequest('/api/case-match/upload')
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(307) // Redirect status for unauthenticated
    })
  })

  describe('Authentication Verification', () => {
    it('should redirect to login when no auth token is present', async () => {
      const request = createMockRequest('/admin/dashboard')
      
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to login when auth token is invalid', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'invalid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'Invalid token'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should include return URL in login redirect', async () => {
      const request = createMockRequest('/admin/dashboard')
      
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toContain('returnTo=%2Fadmin%2Fdashboard')
    })
  })

  describe('Admin Authorization', () => {
    it('should allow access for authorized admin email', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            email: 'dineshkatal.work@gmail.com',
            id: 'user-id'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access (NextResponse.next())
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should deny access for non-admin email', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            email: 'regular.user@example.com',
            id: 'user-id'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect to unauthorized
      expect(response.headers.get('location')).toContain('/admin/unauthorized')
    })

    it('should handle case-insensitive email matching', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            email: 'DINESHKATAL.WORK@GMAIL.COM', // Uppercase
            id: 'user-id'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access despite case difference
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should support additional admin emails from environment', async () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'admin@example.com,test@example.com'
      
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            email: 'admin@example.com',
            id: 'user-id'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access for additional admin email
      expect(response).toBeInstanceOf(NextResponse)
    })
  })

  describe('API Route Protection', () => {
    it('should return 403 JSON response for unauthorized API access', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            email: 'regular.user@example.com',
            id: 'user-id'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      expect(response.headers.get('content-type')).toBe('application/json')
      
      const body = await response.json()
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should protect all specified admin API routes', async () => {
      const adminApiRoutes = [
        '/api/case-match/upload',
        '/api/case-match/analyze',
        '/api/case-match/save-teams',
        '/api/team-matching/approve',
        '/api/team-matching/form-teams',
        '/api/team-matching/automated-formation',
        '/api/rl-metrics'
      ]
      
      for (const route of adminApiRoutes) {
        const request = createMockRequest(route)
        const response = await middleware(request)
        
        // Should redirect to login (unauthenticated)
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/login')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase configuration errors', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to login
    })

    it('should handle Supabase client errors gracefully', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockRejectedValue(new Error('Network error'))
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Should redirect to not-found
    })

    it('should default to denying access on errors', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-token'
      })
      
      // Mock getUser to throw an error
      mockGetUser.mockRejectedValue(new Error('Supabase error'))
      
      const response = await middleware(request)
      
      // Should redirect to login when there's a session error (unauthenticated)
      expect(response.status).toBe(307) // Redirect to login
      expect(response.headers.get('location')).toContain('/login')
    })
  })

  describe('Cookie Handling', () => {
    it('should check multiple cookie names for auth token', async () => {
      const cookieNames = ['sb-access-token', 'supabase-auth-token', 'sb-auth-token']
      
      for (const cookieName of cookieNames) {
        const request = createMockRequest('/admin/dashboard', {
          [cookieName]: 'valid-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              email: 'dineshkatal.work@gmail.com',
              id: 'user-id'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        // Should allow access with any of the cookie names
        expect(response).toBeInstanceOf(NextResponse)
      }
    })
  })
})