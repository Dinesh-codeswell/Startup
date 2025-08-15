/**
 * Verification script for admin error handling implementation
 * Verifies that task 8 has been properly implemented
 */

const fs = require('fs')
const path = require('path')

class AdminErrorImplementationVerifier {
  constructor() {
    this.results = []
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    }
    
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`)
    this.results.push({ type, message })
  }

  checkFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log(`✓ ${description} exists: ${filePath}`, 'success')
      return true
    } else {
      this.log(`✗ ${description} missing: ${filePath}`, 'error')
      return false
    }
  }

  checkFileContent(filePath, patterns, description) {
    if (!fs.existsSync(filePath)) {
      this.log(`✗ ${description}: File not found`, 'error')
      return false
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const missingPatterns = patterns.filter(pattern => {
      if (typeof pattern === 'string') {
        return !content.includes(pattern)
      } else if (pattern instanceof RegExp) {
        return !pattern.test(content)
      }
      return false
    })

    if (missingPatterns.length === 0) {
      this.log(`✓ ${description}: All required content present`, 'success')
      return true
    } else {
      this.log(`✗ ${description}: Missing content patterns`, 'error')
      missingPatterns.forEach(pattern => {
        this.log(`  - Missing: ${pattern}`, 'error')
      })
      return false
    }
  }

  verifyErrorPages() {
    this.log('Verifying error pages...', 'info')

    // Check enhanced unauthorized page
    this.checkFileExists('app/admin/unauthorized/page.tsx', 'Enhanced admin unauthorized page')
    this.checkFileContent('app/admin/unauthorized/page.tsx', [
      'useSearchParams',
      'attemptedUrl',
      'handleSignOut',
      'returnTo',
      'Sign Out & Try Different Account',
      'What you can do:',
      'Contact your system administrator'
    ], 'Enhanced unauthorized page content')

    // Check general access denied page
    this.checkFileExists('app/access-denied/page.tsx', 'General access denied page')
    this.checkFileContent('app/access-denied/page.tsx', [
      'AdminErrorFeedback',
      'AdminErrorPresets',
      'reason === \'admin_required\'',
      'Additional Options'
    ], 'Access denied page content')

    // Check admin not found page exists
    this.checkFileExists('app/admin/not-found.tsx', 'Admin not found page')
  }

  verifyApiErrorEnhancements() {
    this.log('Verifying API error enhancements...', 'info')

    // Check enhanced admin API protection
    this.checkFileExists('lib/admin-api-protection.ts', 'Admin API protection')
    this.checkFileContent('lib/admin-api-protection.ts', [
      'AdminErrorResponse',
      'timestamp: string',
      'requestId?: string',
      'details?: string',
      'createUnauthorizedResponse',
      'X-Error-Code',
      'X-Request-ID',
      'X-Timestamp',
      'req_${Date.now()}_${Math.random()'
    ], 'Enhanced API error responses')
  }

  verifyMiddlewareEnhancements() {
    this.log('Verifying middleware enhancements...', 'info')

    this.checkFileExists('middleware.ts', 'Middleware')
    this.checkFileContent('middleware.ts', [
      'createUnauthenticatedRedirect',
      'createUnauthorizedResponse',
      'returnTo',
      /reason.*admin_required/,
      /message.*Admin access required/,
      'X-Error-Code',
      'X-Request-ID',
      'timestamp',
      'requestId'
    ], 'Enhanced middleware redirects and errors')
  }

  verifyUserFeedbackComponents() {
    this.log('Verifying user feedback components...', 'info')

    // Check AdminErrorFeedback component
    this.checkFileExists('components/admin/AdminErrorFeedback.tsx', 'AdminErrorFeedback component')
    this.checkFileContent('components/admin/AdminErrorFeedback.tsx', [
      'AdminError',
      'AdminErrorFeedback',
      'AdminErrorPresets',
      'type: \'auth\' | \'permission\' | \'network\' | \'server\'',
      'getIcon',
      'getBgColor',
      'handleAction',
      'notAuthenticated',
      'notAuthorized',
      'sessionExpired',
      'networkError',
      'serverError'
    ], 'AdminErrorFeedback component content')

    // Check admin error handler hook
    this.checkFileExists('hooks/use-admin-error-handler.ts', 'Admin error handler hook')
    this.checkFileContent('hooks/use-admin-error-handler.ts', [
      'useAdminErrorHandler',
      'handleApiError',
      'handleNetworkError',
      'createAdminApiCall',
      'useAdminApiCall',
      'retryLastAction'
    ], 'Admin error handler hook content')
  }

  verifyLoginEnhancements() {
    this.log('Verifying login page enhancements...', 'info')

    this.checkFileExists('app/login/page.tsx', 'Login page')
    this.checkFileContent('app/login/page.tsx', [
      'returnTo',
      'isAdminRequired',
      'adminMessage',
      /reason.*===.*admin_required/,
      'Admin access required',
      'returnToParam',
      'You\'ll be redirected to:'
    ], 'Enhanced login page content')
  }

  verifyTestFiles() {
    this.log('Verifying test files...', 'info')

    this.checkFileExists('test-admin-error-handling.js', 'Admin error handling test')
    this.checkFileContent('test-admin-error-handling.js', [
      'AdminErrorHandlingTester',
      'testApiErrorResponses',
      'testPageRedirects',
      'testErrorPageContent',
      'testLoginPageEnhancements',
      'testMiddlewareEnhancements'
    ], 'Admin error handling test content')
  }

  generateReport() {
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.type === 'success').length,
      error: this.results.filter(r => r.type === 'error').length,
      warning: this.results.filter(r => r.type === 'warning').length
    }

    console.log('\n' + '='.repeat(70))
    console.log('ADMIN ERROR HANDLING IMPLEMENTATION VERIFICATION REPORT')
    console.log('='.repeat(70))
    console.log(`Total Checks: ${summary.total}`)
    console.log(`✓ Passed: ${summary.success}`)
    console.log(`✗ Failed: ${summary.error}`)
    console.log(`⚠ Warnings: ${summary.warning}`)
    
    const successRate = ((summary.success / summary.total) * 100).toFixed(1)
    console.log(`Success Rate: ${successRate}%`)
    console.log('='.repeat(70))

    if (summary.error > 0) {
      console.log('\nFAILED CHECKS:')
      this.results
        .filter(r => r.type === 'error')
        .forEach(r => console.log(`  - ${r.message}`))
    }

    return summary
  }

  verifyTaskRequirements() {
    this.log('Verifying task 8 requirements...', 'info')

    const requirements = [
      {
        name: 'Custom "Access Denied" page',
        check: () => {
          return this.checkFileExists('app/admin/unauthorized/page.tsx', 'Enhanced unauthorized page') &&
                 this.checkFileExists('app/access-denied/page.tsx', 'General access denied page')
        }
      },
      {
        name: 'Clear error messages for unauthorized API requests',
        check: () => {
          return this.checkFileContent('lib/admin-api-protection.ts', [
            'AdminErrorResponse',
            'details?: string',
            'timestamp: string',
            'requestId?: string'
          ], 'Enhanced API error messages')
        }
      },
      {
        name: 'User-friendly feedback for permission issues',
        check: () => {
          return this.checkFileExists('components/admin/AdminErrorFeedback.tsx', 'AdminErrorFeedback component') &&
                 this.checkFileExists('hooks/use-admin-error-handler.ts', 'Admin error handler hook')
        }
      },
      {
        name: 'Proper redirect flows after authentication',
        check: () => {
          return this.checkFileContent('middleware.ts', [
            'returnTo',
            /reason.*admin_required/
          ], 'Enhanced middleware redirects') &&
          this.checkFileContent('app/login/page.tsx', [
            'returnTo',
            'isAdminRequired'
          ], 'Enhanced login redirects')
        }
      }
    ]

    let allPassed = true
    requirements.forEach(req => {
      if (req.check()) {
        this.log(`✓ Requirement: ${req.name}`, 'success')
      } else {
        this.log(`✗ Requirement: ${req.name}`, 'error')
        allPassed = false
      }
    })

    return allPassed
  }

  runVerification() {
    this.log('Starting admin error handling implementation verification...', 'info')

    try {
      this.verifyErrorPages()
      this.verifyApiErrorEnhancements()
      this.verifyMiddlewareEnhancements()
      this.verifyUserFeedbackComponents()
      this.verifyLoginEnhancements()
      this.verifyTestFiles()

      const requirementsPassed = this.verifyTaskRequirements()
      const summary = this.generateReport()

      if (requirementsPassed && summary.error === 0) {
        this.log('\n🎉 Task 8 implementation verification PASSED! All requirements met.', 'success')
        return true
      } else {
        this.log('\n❌ Task 8 implementation verification FAILED. Some requirements not met.', 'error')
        return false
      }
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error')
      return false
    }
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const verifier = new AdminErrorImplementationVerifier()
  
  const success = verifier.runVerification()
  process.exit(success ? 0 : 1)
}

module.exports = AdminErrorImplementationVerifier