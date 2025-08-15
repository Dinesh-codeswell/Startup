/**
 * Test script for admin error handling and user feedback
 * Tests the implementation of task 8: Create error pages and user feedback
 */

const { createClient } = require('@supabase/supabase-js')

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  testEmails: {
    admin: 'dineshkatal.work@gmail.com',
    nonAdmin: 'test@example.com',
    invalid: 'invalid-email'
  }
}

class AdminErrorHandlingTester {
  constructor() {
    this.results = []
    // Only create Supabase client if credentials are available
    if (TEST_CONFIG.supabaseUrl && TEST_CONFIG.supabaseKey) {
      this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, type, message }
    this.results.push(logEntry)
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    }
    
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`)
  }

  async testApiErrorResponses() {
    this.log('Testing API error responses...', 'info')
    
    const testCases = [
      {
        name: 'Unauthenticated API request',
        url: '/api/case-match/upload',
        method: 'POST',
        headers: {},
        expectedStatus: 401,
        expectedCode: 'UNAUTHENTICATED'
      },
      {
        name: 'Invalid token API request',
        url: '/api/case-match/analyze',
        method: 'POST',
        headers: { 'Authorization': 'Bearer invalid-token' },
        expectedStatus: 401,
        expectedCode: 'UNAUTHENTICATED'
      },
      {
        name: 'Non-admin authenticated request',
        url: '/api/team-matching/approve',
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-non-admin-token' },
        expectedStatus: 403,
        expectedCode: 'FORBIDDEN'
      }
    ]

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${testCase.url}`, {
          method: testCase.method,
          headers: {
            'Content-Type': 'application/json',
            ...testCase.headers
          }
        })

        if (response.status === testCase.expectedStatus) {
          const errorData = await response.json()
          
          // Check error response structure
          const requiredFields = ['error', 'code', 'message', 'timestamp']
          const hasAllFields = requiredFields.every(field => errorData.hasOwnProperty(field))
          
          if (hasAllFields && errorData.code === testCase.expectedCode) {
            this.log(`✓ ${testCase.name}: Correct error response structure`, 'success')
            
            // Verify enhanced error details
            if (errorData.details) {
              this.log(`  - Enhanced details provided: ${errorData.details.substring(0, 50)}...`, 'info')
            }
            
            if (errorData.requestId) {
              this.log(`  - Request ID included: ${errorData.requestId}`, 'info')
            }
            
          } else {
            this.log(`✗ ${testCase.name}: Missing required fields or incorrect code`, 'error')
            this.log(`  Expected code: ${testCase.expectedCode}, Got: ${errorData.code}`, 'error')
          }
        } else {
          this.log(`✗ ${testCase.name}: Expected status ${testCase.expectedStatus}, got ${response.status}`, 'error')
        }
      } catch (error) {
        this.log(`✗ ${testCase.name}: Request failed - ${error.message}`, 'error')
      }
    }
  }

  async testPageRedirects() {
    this.log('Testing page redirect flows...', 'info')
    
    const testCases = [
      {
        name: 'Admin page without auth',
        url: '/admin/dashboard',
        expectedRedirect: '/login',
        shouldHaveReturnTo: true
      },
      {
        name: 'Admin page with non-admin user',
        url: '/admin/case-match',
        expectedRedirect: '/admin/unauthorized',
        shouldHaveReturnTo: true
      },
      {
        name: 'Nested admin route',
        url: '/admin/dashboard/settings',
        expectedRedirect: '/login',
        shouldHaveReturnTo: true
      }
    ]

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${testCase.url}`, {
          redirect: 'manual'
        })

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location')
          
          if (location && location.includes(testCase.expectedRedirect)) {
            this.log(`✓ ${testCase.name}: Correct redirect to ${testCase.expectedRedirect}`, 'success')
            
            // Check for returnTo parameter
            if (testCase.shouldHaveReturnTo) {
              const url = new URL(location, TEST_CONFIG.baseUrl)
              const returnTo = url.searchParams.get('returnTo')
              
              if (returnTo) {
                this.log(`  - Return URL preserved: ${returnTo}`, 'info')
              } else {
                this.log(`  - Warning: Return URL not preserved`, 'warning')
              }
            }
          } else {
            this.log(`✗ ${testCase.name}: Incorrect redirect. Expected: ${testCase.expectedRedirect}, Got: ${location}`, 'error')
          }
        } else {
          this.log(`✗ ${testCase.name}: Expected redirect, got status ${response.status}`, 'error')
        }
      } catch (error) {
        this.log(`✗ ${testCase.name}: Request failed - ${error.message}`, 'error')
      }
    }
  }

  async testErrorPageContent() {
    this.log('Testing error page content...', 'info')
    
    const testCases = [
      {
        name: 'Admin unauthorized page',
        url: '/admin/unauthorized',
        expectedContent: ['Access Denied', 'admin', 'permission']
      },
      {
        name: 'Admin unauthorized with return URL',
        url: '/admin/unauthorized?returnTo=/admin/dashboard',
        expectedContent: ['Access Denied', '/admin/dashboard', 'Attempted to access']
      },
      {
        name: 'General access denied page',
        url: '/access-denied?reason=admin_required',
        expectedContent: ['Access Denied', 'Admin access required']
      }
    ]

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${testCase.url}`)
        
        if (response.ok) {
          const html = await response.text()
          
          const hasAllContent = testCase.expectedContent.every(content => 
            html.toLowerCase().includes(content.toLowerCase())
          )
          
          if (hasAllContent) {
            this.log(`✓ ${testCase.name}: Contains expected content`, 'success')
          } else {
            this.log(`✗ ${testCase.name}: Missing expected content`, 'error')
            const missing = testCase.expectedContent.filter(content => 
              !html.toLowerCase().includes(content.toLowerCase())
            )
            this.log(`  Missing: ${missing.join(', ')}`, 'error')
          }
        } else {
          this.log(`✗ ${testCase.name}: Page not accessible (status: ${response.status})`, 'error')
        }
      } catch (error) {
        this.log(`✗ ${testCase.name}: Request failed - ${error.message}`, 'error')
      }
    }
  }

  async testLoginPageEnhancements() {
    this.log('Testing login page enhancements...', 'info')
    
    const testCases = [
      {
        name: 'Login with return URL',
        url: '/login?returnTo=/admin/dashboard',
        expectedContent: ['returnTo', '/admin/dashboard']
      },
      {
        name: 'Login with admin required message',
        url: '/login?reason=admin_required&message=Admin access required',
        expectedContent: ['Admin access required', 'authorized admin']
      },
      {
        name: 'Login with both return URL and admin message',
        url: '/login?returnTo=/admin/case-match&reason=admin_required',
        expectedContent: ['returnTo', '/admin/case-match', 'Admin access required']
      }
    ]

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${testCase.url}`)
        
        if (response.ok) {
          const html = await response.text()
          
          const hasAllContent = testCase.expectedContent.every(content => 
            html.toLowerCase().includes(content.toLowerCase())
          )
          
          if (hasAllContent) {
            this.log(`✓ ${testCase.name}: Enhanced login page working`, 'success')
          } else {
            this.log(`✗ ${testCase.name}: Login enhancements not working`, 'error')
          }
        } else {
          this.log(`✗ ${testCase.name}: Login page not accessible`, 'error')
        }
      } catch (error) {
        this.log(`✗ ${testCase.name}: Request failed - ${error.message}`, 'error')
      }
    }
  }

  async testMiddlewareEnhancements() {
    this.log('Testing middleware enhancements...', 'info')
    
    // Test that middleware provides enhanced error information
    const testCases = [
      {
        name: 'API route with enhanced error headers',
        url: '/api/case-match/upload',
        method: 'POST'
      },
      {
        name: 'Admin page redirect with context',
        url: '/admin/dashboard'
      }
    ]

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${testCase.url}`, {
          method: testCase.method || 'GET',
          redirect: 'manual'
        })

        // Check for enhanced headers
        const errorCode = response.headers.get('X-Error-Code')
        const timestamp = response.headers.get('X-Timestamp')
        const requestId = response.headers.get('X-Request-ID')

        if (errorCode || timestamp || requestId) {
          this.log(`✓ ${testCase.name}: Enhanced headers present`, 'success')
          if (errorCode) this.log(`  - Error code: ${errorCode}`, 'info')
          if (timestamp) this.log(`  - Timestamp: ${timestamp}`, 'info')
          if (requestId) this.log(`  - Request ID: ${requestId}`, 'info')
        } else {
          this.log(`✗ ${testCase.name}: Enhanced headers missing`, 'warning')
        }
      } catch (error) {
        this.log(`✗ ${testCase.name}: Request failed - ${error.message}`, 'error')
      }
    }
  }

  generateReport() {
    this.log('Generating test report...', 'info')
    
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.type === 'success').length,
      error: this.results.filter(r => r.type === 'error').length,
      warning: this.results.filter(r => r.type === 'warning').length,
      info: this.results.filter(r => r.type === 'info').length
    }

    console.log('\n' + '='.repeat(60))
    console.log('ADMIN ERROR HANDLING TEST REPORT')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${summary.total}`)
    console.log(`✓ Passed: ${summary.success}`)
    console.log(`✗ Failed: ${summary.error}`)
    console.log(`⚠ Warnings: ${summary.warning}`)
    console.log(`ℹ Info: ${summary.info}`)
    console.log('='.repeat(60))

    if (summary.error > 0) {
      console.log('\nFAILED TESTS:')
      this.results
        .filter(r => r.type === 'error')
        .forEach(r => console.log(`  - ${r.message}`))
    }

    if (summary.warning > 0) {
      console.log('\nWARNINGS:')
      this.results
        .filter(r => r.type === 'warning')
        .forEach(r => console.log(`  - ${r.message}`))
    }

    return summary
  }

  async runAllTests() {
    this.log('Starting comprehensive admin error handling tests...', 'info')
    
    try {
      await this.testApiErrorResponses()
      await this.testPageRedirects()
      await this.testErrorPageContent()
      await this.testLoginPageEnhancements()
      await this.testMiddlewareEnhancements()
      
      const summary = this.generateReport()
      
      if (summary.error === 0) {
        this.log('All tests completed successfully! ✓', 'success')
        return true
      } else {
        this.log(`Tests completed with ${summary.error} failures`, 'error')
        return false
      }
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error')
      return false
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AdminErrorHandlingTester()
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = AdminErrorHandlingTester