import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAuthorizedEmails,
  isValidEmail,
  isAuthorizedAdmin,
  createAdminErrorResponse
} from '../lib/admin-utils'

describe('Admin Utils', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.ADDITIONAL_ADMIN_EMAILS
  })

  describe('getAuthorizedEmails', () => {
    it('should return base admin emails', () => {
      const emails = getAuthorizedEmails()
      expect(emails).toContain('dineshkatal.work@gmail.com')
      expect(emails).toContain('katal091995@gmail.com')
      expect(emails).toHaveLength(2)
    })

    it('should include additional emails from environment variable', () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'test@example.com,admin@test.com'
      const emails = getAuthorizedEmails()
      
      expect(emails).toContain('dineshkatal.work@gmail.com')
      expect(emails).toContain('katal091995@gmail.com')
      expect(emails).toContain('test@example.com')
      expect(emails).toContain('admin@test.com')
      expect(emails).toHaveLength(4)
    })

    it('should handle empty additional emails', () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = ''
      const emails = getAuthorizedEmails()
      expect(emails).toHaveLength(2)
    })

    it('should trim whitespace from additional emails', () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = ' test@example.com , admin@test.com '
      const emails = getAuthorizedEmails()
      
      expect(emails).toContain('test@example.com')
      expect(emails).toContain('admin@test.com')
    })

    it('should filter out empty additional emails', () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'test@example.com,,admin@test.com,'
      const emails = getAuthorizedEmails()
      
      expect(emails).toHaveLength(4) // 2 base + 2 valid additional
      expect(emails).toContain('test@example.com')
      expect(emails).toContain('admin@test.com')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('admin+tag@test-domain.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('user name@domain.com')).toBe(false)
    })

    it('should handle null and undefined inputs', () => {
      expect(isValidEmail(null as any)).toBe(false)
      expect(isValidEmail(undefined as any)).toBe(false)
    })
  })

  describe('isAuthorizedAdmin', () => {
    it('should return true for authorized admin emails', () => {
      expect(isAuthorizedAdmin('dineshkatal.work@gmail.com')).toBe(true)
      expect(isAuthorizedAdmin('katal091995@gmail.com')).toBe(true)
    })

    it('should return false for non-authorized emails', () => {
      expect(isAuthorizedAdmin('unauthorized@example.com')).toBe(false)
      expect(isAuthorizedAdmin('test@gmail.com')).toBe(false)
    })

    it('should perform case-insensitive matching', () => {
      expect(isAuthorizedAdmin('DINESHKATAL.WORK@GMAIL.COM')).toBe(true)
      expect(isAuthorizedAdmin('Katal091995@Gmail.Com')).toBe(true)
    })

    it('should handle whitespace in emails', () => {
      expect(isAuthorizedAdmin(' dineshkatal.work@gmail.com ')).toBe(true)
      expect(isAuthorizedAdmin('  katal091995@gmail.com  ')).toBe(true)
    })

    it('should return false for invalid email formats', () => {
      expect(isAuthorizedAdmin('')).toBe(false)
      expect(isAuthorizedAdmin('invalid-email')).toBe(false)
      expect(isAuthorizedAdmin(null as any)).toBe(false)
      expect(isAuthorizedAdmin(undefined as any)).toBe(false)
    })

    it('should work with additional emails from environment', () => {
      process.env.ADDITIONAL_ADMIN_EMAILS = 'test@example.com'
      expect(isAuthorizedAdmin('test@example.com')).toBe(true)
      expect(isAuthorizedAdmin('TEST@EXAMPLE.COM')).toBe(true)
    })
  })

  describe('createAdminErrorResponse', () => {
    it('should create 401 response for UNAUTHENTICATED', async () => {
      const response = createAdminErrorResponse('UNAUTHENTICATED', 'Please log in')
      const body = await response.json()
      
      expect(response.status).toBe(401)
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('UNAUTHENTICATED')
      expect(body.message).toBe('Please log in')
    })

    it('should create 403 response for FORBIDDEN', async () => {
      const response = createAdminErrorResponse('FORBIDDEN', 'Access denied')
      const body = await response.json()
      
      expect(response.status).toBe(403)
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('FORBIDDEN')
      expect(body.message).toBe('Access denied')
    })

    it('should create 403 response for UNAUTHORIZED', async () => {
      const response = createAdminErrorResponse('UNAUTHORIZED', 'Not authorized')
      const body = await response.json()
      
      expect(response.status).toBe(403)
      expect(body.error).toBe('Admin access required')
      expect(body.code).toBe('UNAUTHORIZED')
      expect(body.message).toBe('Not authorized')
    })

    it('should include redirect URL when provided', async () => {
      const response = createAdminErrorResponse(
        'UNAUTHENTICATED', 
        'Please log in', 
        '/login'
      )
      const body = await response.json()
      
      expect(body.redirectTo).toBe('/login')
    })

    it('should set correct content type header', () => {
      const response = createAdminErrorResponse('FORBIDDEN', 'Access denied')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })
})