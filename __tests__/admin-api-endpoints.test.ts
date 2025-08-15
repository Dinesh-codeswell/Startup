import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}))

const mockGetUser = vi.fn()

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

describe('Admin API Endpoints Security Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    
    // Reset mock implementations
    const { createClient } = require('@supabase/supabase-js')
    
    createClient.mockReturnValue({
      auth: {
        getUser: mockGetUser
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Case Match API Endpoints', () => {
    const caseMatchEndpoints = [
      '/api/case-match/upload',
      '/api/case-match/analyze', 
      '/api/case-match/save-teams'
    ]

    it('should allow admin access to case match endpoints', async () => {
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })

      for (const endpoint of caseMatchEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-admin-token'
        })
        
        const response = await middleware(request)
        
        // Should allow access (NextResponse.next())
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(403)
        expect(response.status).not.toBe(307)
      }
    })

    it('should block non-admin access to case match endpoints', async () => {
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

      for (const endpoint of caseMatchEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-user-token'
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403)
        expect(response.headers.get('content-type')).toBe('application/json')
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
        expect(body.code).toBe('FORBIDDEN')
        expect(body.message).toContain('admin access')
      }
    })

    it('should redirect unauthenticated users to login for case match endpoints', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })

      for (const endpoint of caseMatchEndpoints) {
        const request = createMockRequest(endpoint)
        
        const response = await middleware(request)
        
        expect(response.status).toBe(307) // Redirect
        expect(response.headers.get('location')).toContain('/login')
        expect(response.headers.get('location')).toContain(`returnTo=${encodeURIComponent(endpoint)}`)
      }
    })
  })

  describe('Team Matching API Endpoints', () => {
    const teamMatchingEndpoints = [
      '/api/team-matching/approve',
      '/api/team-matching/form-teams',
      '/api/team-matching/automated-formation'
    ]

    it('should allow admin access to team matching endpoints', async () => {
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })

      for (const endpoint of teamMatchingEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-admin-token'
        })
        
        const response = await middleware(request)
        
        // Should allow access
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(403)
        expect(response.status).not.toBe(307)
      }
    })

    it('should block non-admin access to team matching endpoints', async () => {
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

      for (const endpoint of teamMatchingEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-user-token'
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403)
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
        expect(body.code).toBe('FORBIDDEN')
      }
    })

    it('should handle team matching endpoints with different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE']
      
      for (const method of methods) {
        for (const endpoint of teamMatchingEndpoints) {
          // Test with admin user
          mockGetUser.mockResolvedValue({
            data: { 
              user: { 
                id: 'admin-123',
                email: ADMIN_EMAIL,
                email_confirmed_at: '2023-01-01T00:00:00Z'
              }
            },
            error: null
          })

          const adminRequest = new NextRequest(`https://example.com${endpoint}`, { method })
          const mockCookies = new Map([['sb-access-token', { value: 'valid-admin-token' }]])
          Object.defineProperty(adminRequest, 'cookies', {
            get: () => ({ get: (key: string) => mockCookies.get(key) })
          })
          
          const adminResponse = await middleware(adminRequest)
          expect(adminResponse).toBeInstanceOf(NextResponse)
          expect(adminResponse.status).not.toBe(403)

          // Test with non-admin user
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

          const userRequest = new NextRequest(`https://example.com${endpoint}`, { method })
          const userMockCookies = new Map([['sb-access-token', { value: 'valid-user-token' }]])
          Object.defineProperty(userRequest, 'cookies', {
            get: () => ({ get: (key: string) => userMockCookies.get(key) })
          })
          
          const userResponse = await middleware(userRequest)
          expect(userResponse.status).toBe(403)
        }
      }
    })
  })

  describe('RL Metrics API Endpoint', () => {
    it('should allow admin access to RL metrics endpoint', async () => {
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })

      const request = createMockRequest('/api/rl-metrics', {
        'sb-access-token': 'valid-admin-token'
      })
      
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(403)
      expect(response.status).not.toBe(307)
    })

    it('should block non-admin access to RL metrics endpoint', async () => {
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

      const request = createMockRequest('/api/rl-metrics', {
        'sb-access-token': 'valid-user-token'
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should handle RL metrics endpoint with query parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })

      const queryParams = [
        '?period=7d',
        '?metric=accuracy&period=30d',
        '?startDate=2023-01-01&endDate=2023-01-31'
      ]

      for (const params of queryParams) {
        const request = createMockRequest(`/api/rl-metrics${params}`, {
          'sb-access-token': 'valid-admin-token'
        })
        
        const response = await middleware(request)
        
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(403)
      }
    })
  })

  describe('API Endpoint Pattern Matching', () => {
    it('should protect all admin API patterns correctly', async () => {
      const adminApiPatterns = [
        // Case match patterns
        '/api/case-match/upload',
        '/api/case-match/upload/batch',
        '/api/case-match/analyze',
        '/api/case-match/analyze/detailed',
        '/api/case-match/save-teams',
        '/api/case-match/save-teams/bulk',
        
        // Team matching patterns
        '/api/team-matching/approve',
        '/api/team-matching/approve/bulk',
        '/api/team-matching/form-teams',
        '/api/team-matching/form-teams/auto',
        '/api/team-matching/automated-formation',
        '/api/team-matching/automated-formation/schedule',
        
        // RL metrics patterns
        '/api/rl-metrics',
        '/api/rl-metrics/detailed',
        '/api/rl-metrics/export'
      ]

      // Test with non-admin user
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

      for (const pattern of adminApiPatterns) {
        const request = createMockRequest(pattern, {
          'sb-access-token': 'valid-user-token'
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403)
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
      }
    })

    it('should not protect non-admin API endpoints', async () => {
      const publicApiEndpoints = [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/callback',
        '/api/user/profile',
        '/api/team-matching/submit',
        '/api/team-matching/submissions',
        '/api/health',
        '/api/status'
      ]

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

      for (const endpoint of publicApiEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-user-token'
        })
        
        const response = await middleware(request)
        
        // Should allow access (NextResponse.next())
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(403)
      }
    })
  })

  describe('API Error Response Format', () => {
    it('should return consistent error format for all protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/case-match/upload',
        '/api/case-match/analyze',
        '/api/team-matching/approve',
        '/api/team-matching/form-teams',
        '/api/rl-metrics'
      ]

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

      for (const endpoint of protectedEndpoints) {
        const request = createMockRequest(endpoint, {
          'sb-access-token': 'valid-user-token'
        })
        
        const response = await middleware(request)
        
        expect(response.status).toBe(403)
        expect(response.headers.get('content-type')).toBe('application/json')
        
        const body = await response.json()
        
        // Check consistent error format
        expect(body).toHaveProperty('error')
        expect(body).toHaveProperty('code')
        expect(body).toHaveProperty('message')
        
        expect(body.error).toBe('Admin access required')
        expect(body.code).toBe('FORBIDDEN')
        expect(typeof body.message).toBe('string')
        expect(body.message.length).toBeGreaterThan(0)
      }
    })

    it('should return appropriate error codes for different scenarios', async () => {
      const endpoint = '/api/case-match/upload'

      // Test unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })

      let request = createMockRequest(endpoint)
      let response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect to login
      expect(response.headers.get('location')).toContain('/login')

      // Test authenticated non-admin user
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

      request = createMockRequest(endpoint, {
        'sb-access-token': 'valid-user-token'
      })
      response = await middleware(request)
      
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')

      // Test user with unverified email
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: null // Unverified
          }
        },
        error: null
      })

      request = createMockRequest(endpoint, {
        'sb-access-token': 'valid-token-unverified'
      })
      response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect due to unverified email
    })
  })

  describe('API Endpoint Performance', () => {
    it('should handle high volume of admin API requests efficiently', async () => {
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-123',
            email: ADMIN_EMAIL,
            email_confirmed_at: '2023-01-01T00:00:00Z'
          }
        },
        error: null
      })

      const endpoints = [
        '/api/case-match/upload',
        '/api/case-match/analyze',
        '/api/team-matching/approve',
        '/api/rl-metrics'
      ]

      const startTime = Date.now()
      
      // Create 100 concurrent requests across different endpoints
      const requests = Array.from({ length: 100 }, (_, i) => {
        const endpoint = endpoints[i % endpoints.length]
        return createMockRequest(endpoint, {
          'sb-access-token': `admin-token-${i}`
        })
      })

      const responses = await Promise.all(
        requests.map(request => middleware(request))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(403)
        expect(response.status).not.toBe(307)
      })

      // Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000)
    })

    it('should handle mixed admin and non-admin requests efficiently', async () => {
      const endpoints = [
        '/api/case-match/upload',
        '/api/team-matching/approve',
        '/api/rl-metrics'
      ]

      const requests = Array.from({ length: 50 }, (_, i) => {
        const endpoint = endpoints[i % endpoints.length]
        const isAdmin = i % 2 === 0
        
        mockGetUser.mockResolvedValueOnce({
          data: { 
            user: { 
              id: `user-${i}`,
              email: isAdmin ? ADMIN_EMAIL : NON_ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })

        return createMockRequest(endpoint, {
          'sb-access-token': `token-${i}`
        })
      })

      const startTime = Date.now()
      const responses = await Promise.all(
        requests.map(request => middleware(request))
      )
      const endTime = Date.now()

      // Check that admin requests succeeded and non-admin requests were blocked
      responses.forEach((response, i) => {
        const isAdmin = i % 2 === 0
        if (isAdmin) {
          expect(response).toBeInstanceOf(NextResponse)
          expect(response.status).not.toBe(403)
        } else {
          expect(response.status).toBe(403)
        }
      })

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(3000)
    })
  })
})