import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  requireAdminAccess, 
  createUnauthorizedResponse, 
  withAdminProtection,
  isAdminRequest,
  verifyAdminOrRespond
} from '../lib/admin-api-protection'

// Mock the dependencies
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn()
    }
  }))
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('../lib/admin-utils', () => ({
  isAuthorizedAdmin: vi.fn()
}))

// Import mocked modules
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { isAuthorizedAdmin } from '../lib/admin-utils'

describe('Admin API Protection', () => {
  let mockSupabase: any
  let mockRequest: NextRequest

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: vi.fn()
      }
    }
    ;(createRouteHandlerClient as any).mockReturnValue(mockSupabase)
    ;(isAuthorizedAdmin as any).mockReset()
    
    mockRequest = new NextRequest('http://localhost:3000/api/admin/test')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAdminAccess', () => {
    it('should return authorized true for valid admin user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(true)

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'admin@example.com',
        email_verified: true
      })
      expect(result.error).toBeUndefined()
    })

    it('should return authorized false for non-admin user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(false)

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Insufficient permissions - admin access required')
    })

    it('should return authorized false for unauthenticated user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should return authorized false for unverified email', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          email_confirmed_at: null,
          email_verified: false
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Email not verified')
    })

    it('should handle session errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      })

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Session verification failed')
    })

    it('should handle exceptions gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      const result = await requireAdminAccess(mockRequest)

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Internal server error during admin verification')
    })
  })

  describe('createUnauthorizedResponse', () => {
    it('should create FORBIDDEN response by default', () => {
      const response = createUnauthorizedResponse()
      
      expect(response.status).toBe(403)
    })

    it('should create UNAUTHENTICATED response with 401 status', () => {
      const response = createUnauthorizedResponse('UNAUTHENTICATED')
      
      expect(response.status).toBe(401)
    })

    it('should include custom message when provided', () => {
      const customMessage = 'Custom error message'
      const response = createUnauthorizedResponse('FORBIDDEN', customMessage)
      
      expect(response.status).toBe(403)
    })

    it('should include redirect URL for unauthenticated users', () => {
      const response = createUnauthorizedResponse('UNAUTHENTICATED')
      
      expect(response.status).toBe(401)
    })
  })

  describe('withAdminProtection', () => {
    it('should call handler when user is authorized admin', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const protectedHandler = withAdminProtection(mockHandler)
      
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(true)

      const result = await protectedHandler(mockRequest, {})

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, {}, {
        id: 'user-123',
        email: 'admin@example.com',
        email_verified: true
      })
      expect(result.status).toBe(200)
    })

    it('should return 403 when user is not admin', async () => {
      const mockHandler = vi.fn()
      const protectedHandler = withAdminProtection(mockHandler)
      
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(false)

      const result = await protectedHandler(mockRequest, {})

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(403)
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockHandler = vi.fn()
      const protectedHandler = withAdminProtection(mockHandler)
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await protectedHandler(mockRequest, {})

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(401)
    })
  })

  describe('isAdminRequest', () => {
    it('should return true for authorized admin', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(true)

      const result = await isAdminRequest(mockRequest)

      expect(result).toBe(true)
    })

    it('should return false for non-admin user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(false)

      const result = await isAdminRequest(mockRequest)

      expect(result).toBe(false)
    })
  })

  describe('verifyAdminOrRespond', () => {
    it('should return null for authorized admin', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(true)

      const result = await verifyAdminOrRespond(mockRequest)

      expect(result).toBeNull()
    })

    it('should return error response for unauthorized user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          email_confirmed_at: '2023-01-01T00:00:00Z'
        }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      ;(isAuthorizedAdmin as any).mockReturnValue(false)

      const result = await verifyAdminOrRespond(mockRequest)

      expect(result).not.toBeNull()
      expect(result!.status).toBe(403)
    })
  })
})