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
const SECOND_ADMIN_EMAIL = 'katal091995@gmail.com'
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

// Mock API handler for testing
const createMockApiHandler = (responseData: any) => {
  return vi.fn().mockResolvedValue(NextResponse.json(responseData))
}

describe('Admin End-to-End Flow Tests', () => {
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

  describe('Complete Admin Login and Access Flow', () => {
    it('should handle complete admin login to dashboard flow', async () => {
      // Step 1: Unauthenticated user tries to access admin dashboard
      let request = createMockRequest('/admin/dashboard')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      let response = await middleware(request)
      
      // Should redirect to login with return URL
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('returnTo=%2Fadmin%2Fdashboard')
      
      // Step 2: User logs in successfully with admin credentials
      request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token-after-login'
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
      
      response = await middleware(request)
      
      // Should allow access to admin dashboard
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307) // Not a redirect
      expect(response.status).not.toBe(403) // Not forbidden
    })

    it('should handle non-admin user login attempt', async () => {
      // Step 1: Unauthenticated user tries to access admin dashboard
      let request = createMockRequest('/admin/dashboard')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No user found'
      })
      
      let response = await middleware(request)
      
      // Should redirect to login
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      
      // Step 2: User logs in with non-admin credentials
      request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-user-token-after-login'
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
      
      response = await middleware(request)
      
      // Should redirect to not-found (access denied)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/not-found')
    })

    it('should handle admin user accessing multiple admin features', async () => {
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/case-match',
        '/admin/team-matching'
      ]
      
      // Mock admin user session
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
      
      // Test access to all admin routes
      for (const route of adminRoutes) {
        const request = createMockRequest(route, {
          'sb-access-token': 'valid-admin-token'
        })
        
        const response = await middleware(request)
        
        // Should allow access to all admin routes
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(307)
        expect(response.status).not.toBe(403)
      }
    })
  })

  describe('Admin API Access Flow', () => {
    it('should handle complete admin API workflow', async () => {
      // Mock admin session for API calls
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'admin-user-123',
              email: ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          }
        },
        error: null
      })
      
      // Test case-match upload workflow
      const uploadHandler = createMockApiHandler({ success: true, uploadId: 'upload-123' })
      const protectedUploadHandler = withAdminProtection(uploadHandler)
      
      let request = createMockRequest('/api/case-match/upload')
      let response = await protectedUploadHandler(request, {})
      
      expect(uploadHandler).toHaveBeenCalledWith(request, {}, {
        id: 'admin-user-123',
        email: ADMIN_EMAIL,
        email_verified: true
      })
      
      let body = await response.json()
      expect(body.success).toBe(true)
      expect(body.uploadId).toBe('upload-123')
      
      // Test case-match analyze workflow
      const analyzeHandler = createMockApiHandler({ 
        success: true, 
        teams: [{ id: 1, members: ['user1', 'user2'] }] 
      })
      const protectedAnalyzeHandler = withAdminProtection(analyzeHandler)
      
      request = createMockRequest('/api/case-match/analyze')
      response = await protectedAnalyzeHandler(request, {})
      
      expect(analyzeHandler).toHaveBeenCalled()
      body = await response.json()
      expect(body.success).toBe(true)
      expect(body.teams).toHaveLength(1)
      
      // Test team formation workflow
      const formTeamsHandler = createMockApiHandler({ 
        success: true, 
        teamsFormed: 5 
      })
      const protectedFormTeamsHandler = withAdminProtection(formTeamsHandler)
      
      request = createMockRequest('/api/team-matching/form-teams')
      response = await protectedFormTeamsHandler(request, {})
      
      expect(formTeamsHandler).toHaveBeenCalled()
      body = await response.json()
      expect(body.success).toBe(true)
      expect(body.teamsFormed).toBe(5)
    })

    it('should block non-admin user from API workflow', async () => {
      // Mock non-admin session
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'regular-user-123',
              email: NON_ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          }
        },
        error: null
      })
      
      const adminApiEndpoints = [
        '/api/case-match/upload',
        '/api/case-match/analyze',
        '/api/case-match/save-teams',
        '/api/team-matching/form-teams',
        '/api/team-matching/approve',
        '/api/rl-metrics'
      ]
      
      for (const endpoint of adminApiEndpoints) {
        const mockHandler = createMockApiHandler({ data: 'sensitive' })
        const protectedHandler = withAdminProtection(mockHandler)
        
        const request = createMockRequest(endpoint)
        const response = await protectedHandler(request, {})
        
        // Should not execute the handler
        expect(mockHandler).not.toHaveBeenCalled()
        
        // Should return 403 Forbidden
        expect(response.status).toBe(403)
        
        const body = await response.json()
        expect(body.error).toBe('Admin access required')
        expect(body.code).toBe('FORBIDDEN')
      }
    })
  })

  describe('Session Management Flow', () => {
    it('should handle session expiry during admin operations', async () => {
      // Step 1: Admin user successfully accesses dashboard
      let request = createMockRequest('/admin/dashboard', {
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
      
      let response = await middleware(request)
      
      // Should allow access
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
      
      // Step 2: Session expires, user tries to access admin API
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: 'Session expired'
      })
      
      const apiHandler = createMockApiHandler({ data: 'sensitive' })
      const protectedApiHandler = withAdminProtection(apiHandler)
      
      request = createMockRequest('/api/case-match/upload')
      response = await protectedApiHandler(request, {})
      
      // Should not execute handler and return 401
      expect(apiHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
      
      // Step 3: User re-authenticates and tries again
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'admin-user-123',
              email: ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          }
        },
        error: null
      })
      
      request = createMockRequest('/api/case-match/upload')
      response = await protectedApiHandler(request, {})
      
      // Should now execute handler successfully
      expect(apiHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should handle admin user logout and re-login flow', async () => {
      // Step 1: Admin user is logged in and accessing dashboard
      let request = createMockRequest('/admin/dashboard', {
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
      
      let response = await middleware(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
      
      // Step 2: User logs out (no session)
      request = createMockRequest('/admin/dashboard')
      
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: 'No session'
      })
      
      response = await middleware(request)
      
      // Should redirect to login
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      
      // Step 3: User logs back in with admin credentials
      request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'new-valid-admin-token'
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
      
      response = await middleware(request)
      
      // Should allow access again
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
    })
  })

  describe('Multi-Admin User Flow', () => {
    it('should handle multiple admin users accessing system', async () => {
      const adminUsers = [
        { id: 'admin-1', email: ADMIN_EMAIL },
        { id: 'admin-2', email: SECOND_ADMIN_EMAIL }
      ]
      
      for (const admin of adminUsers) {
        // Test page access
        let request = createMockRequest('/admin/dashboard', {
          'sb-access-token': `valid-token-${admin.id}`
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              ...admin,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        let response = await middleware(request)
        
        // Should allow access for both admin users
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(307)
        
        // Test API access
        mockGetSession.mockResolvedValue({
          data: { 
            session: { 
              user: { 
                ...admin,
                email_confirmed_at: '2023-01-01T00:00:00Z'
              }
            }
          },
          error: null
        })
        
        const apiHandler = createMockApiHandler({ success: true, adminId: admin.id })
        const protectedApiHandler = withAdminProtection(apiHandler)
        
        request = createMockRequest('/api/case-match/upload')
        response = await protectedApiHandler(request, {})
        
        expect(apiHandler).toHaveBeenCalledWith(request, {}, {
          id: admin.id,
          email: admin.email,
          email_verified: true
        })
        
        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.adminId).toBe(admin.id)
      }
    })

    it('should handle additional admin emails from environment', async () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'additional@admin.com,another@admin.com'
      
      const additionalAdmins = [
        { id: 'admin-3', email: 'additional@admin.com' },
        { id: 'admin-4', email: 'another@admin.com' }
      ]
      
      for (const admin of additionalAdmins) {
        const request = createMockRequest('/admin/dashboard', {
          'sb-access-token': `valid-token-${admin.id}`
        })
        
        mockGetUser.mockResolvedValue({
          data: { 
            user: { 
              ...admin,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          },
          error: null
        })
        
        const response = await middleware(request)
        
        // Should allow access for additional admin users
        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).not.toBe(307)
      }
    })
  })

  describe('Error Recovery Flow', () => {
    it('should handle service errors gracefully in complete flow', async () => {
      // Step 1: Service error during initial access
      let request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token'
      })
      
      mockGetUser.mockRejectedValue(new Error('Supabase service unavailable'))
      
      let response = await middleware(request)
      
      // Should redirect to login due to service error
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      
      // Step 2: Service recovers, user tries again
      request = createMockRequest('/admin/dashboard', {
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
      
      response = await middleware(request)
      
      // Should now allow access
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
      
      // Step 3: API call with service error
      mockGetSession.mockRejectedValue(new Error('Database connection failed'))
      
      const apiHandler = createMockApiHandler({ data: 'test' })
      const protectedApiHandler = withAdminProtection(apiHandler)
      
      request = createMockRequest('/api/case-match/upload')
      response = await protectedApiHandler(request, {})
      
      // Should handle error gracefully
      expect(apiHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(500)
      
      const body = await response.json()
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('INTERNAL_ERROR')
      
      // Step 4: Service recovers for API
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'admin-user-123',
              email: ADMIN_EMAIL,
              email_confirmed_at: '2023-01-01T00:00:00Z'
            }
          }
        },
        error: null
      })
      
      request = createMockRequest('/api/case-match/upload')
      response = await protectedApiHandler(request, {})
      
      // Should now work correctly
      expect(apiHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })
  })

  describe('Cross-Feature Admin Flow', () => {
    it('should handle admin user workflow across all features', async () => {
      // Mock admin session
      const adminSession = {
        user: {
          id: 'admin-user-123',
          email: ADMIN_EMAIL,
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockGetUser.mockResolvedValue({
        data: { user: adminSession.user },
        error: null
      })
      
      mockGetSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      })
      
      // Step 1: Access admin dashboard
      let request = createMockRequest('/admin/dashboard', {
        'sb-access-token': 'valid-admin-token'
      })
      
      let response = await middleware(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).not.toBe(307)
      
      // Step 2: Upload case match data
      const uploadHandler = createMockApiHandler({ success: true, uploadId: 'upload-123' })
      const protectedUploadHandler = withAdminProtection(uploadHandler)
      
      request = createMockRequest('/api/case-match/upload')
      response = await protectedUploadHandler(request, {})
      
      expect(uploadHandler).toHaveBeenCalled()
      let body = await response.json()
      expect(body.success).toBe(true)
      
      // Step 3: Analyze case match data
      const analyzeHandler = createMockApiHandler({ 
        success: true, 
        analysis: { totalParticipants: 100, teamsFormed: 20 } 
      })
      const protectedAnalyzeHandler = withAdminProtection(analyzeHandler)
      
      request = createMockRequest('/api/case-match/analyze')
      response = await protectedAnalyzeHandler(request, {})
      
      expect(analyzeHandler).toHaveBeenCalled()
      body = await response.json()
      expect(body.success).toBe(true)
      expect(body.analysis.totalParticipants).toBe(100)
      
      // Step 4: Access team matching features
      const formTeamsHandler = createMockApiHandler({ 
        success: true, 
        teamsFormed: 15 
      })
      const protectedFormTeamsHandler = withAdminProtection(formTeamsHandler)
      
      request = createMockRequest('/api/team-matching/form-teams')
      response = await protectedFormTeamsHandler(request, {})
      
      expect(formTeamsHandler).toHaveBeenCalled()
      body = await response.json()
      expect(body.success).toBe(true)
      expect(body.teamsFormed).toBe(15)
      
      // Step 5: Access RL metrics
      const rlMetricsHandler = createMockApiHandler({ 
        success: true, 
        metrics: { accuracy: 0.85, learningRate: 0.01 } 
      })
      const protectedRlMetricsHandler = withAdminProtection(rlMetricsHandler)
      
      request = createMockRequest('/api/rl-metrics')
      response = await protectedRlMetricsHandler(request, {})
      
      expect(rlMetricsHandler).toHaveBeenCalled()
      body = await response.json()
      expect(body.success).toBe(true)
      expect(body.metrics.accuracy).toBe(0.85)
    })
  })
})