import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'

// Mock Supabase
const mockGetUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}))

// Test data
const ADMIN_EMAIL = 'dineshkatal.work@gmail.com'
const NON_ADMIN_EMAIL = 'user@example.com'

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
  })

  describe('Admin Route Protection', () => {
    it('should allow admin user access to admin dashboard', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-user-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
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
        data: { 
          user: { 
            id: 'regular-user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/admin/unauthorized')
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

  describe('Admin API Protection', () => {
    it('should allow admin user to access protected API endpoints', async () => {
      const request = createMockRequest('/api/case-match/upload', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-user-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
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
        data: { 
          user: { 
            id: 'regular-user-123',
            email: NON_ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
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

  describe('Multiple Admin Routes Protection', () => {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/case-match',
      '/admin/team-matching'
    ]

    it('should protect all admin page routes', async () => {
      for (const route of adminRoutes) {
        const request = createMockRequest(route, {
          'sb-access-token': 'valid-user-token'
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              id: 'regular-user-123',
              email: NON_ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(307) // Should redirect non-admin users
        expect(response.headers.get('location')).toContain('/admin/unauthorized')
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
          data: { 
            user: { 
              id: 'regular-user-123',
              email: NON_ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403) // Should return 403 for API routes
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase service errors gracefully', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockRejectedValue(new Error('Supabase service unavailable'))
      
      const response = await middleware(request)
      
      // Should default to denying access
      expect(response.status).toBe(307) // Redirect to login
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
      expect(response.status).toBe(307) // Redirect to login
    })

    it('should handle case-insensitive email matching', async () => {
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: 'DINESHKATAL.WORK@GMAIL.COM', // Uppercase
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access despite case difference
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
    })
  })

  describe('Session State Management', () => {
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

    it('should support additional admin emails from environment', async () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'additional@admin.com'
      
      const request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-token'
      })
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-3',
            email: 'additional@admin.com',
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })
      
      const response = await middleware(request)
      
      // Should allow access for additional admin email
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
    })
  })
})