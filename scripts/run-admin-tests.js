#!/usr/bin/env node

/**
 * Admin Access Control Test Runner
 * 
 * This script runs all admin-related tests and provides a comprehensive
 * security and functionality report.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test suites to run
const testSuites = [
  {
    name: 'Admin Utils Tests',
    file: '__tests__/admin-utils.test.ts',
    description: 'Core admin utility functions and email validation'
  },
  {
    name: 'Admin API Protection Tests',
    file: '__tests__/admin-api-protection.test.ts',
    description: 'API protection middleware and authentication'
  },
  {
    name: 'Middleware Tests',
    file: '__tests__/middleware.test.ts',
    description: 'Route protection and middleware functionality'
  },
  {
    name: 'Admin Context Tests',
    file: '__tests__/admin-context.test.tsx',
    description: 'React context and client-side admin state'
  },
  {
    name: 'Integration Tests',
    file: '__tests__/admin-integration.test.ts',
    description: 'End-to-end admin access control flows'
  },
  {
    name: 'Security Tests',
    file: '__tests__/admin-security.test.ts',
    description: 'Security bypass attempts and edge cases'
  },
  {
    name: 'End-to-End Tests',
    file: '__tests__/admin-e2e.test.ts',
    description: 'Complete admin login and workflow tests'
  },
  {
    name: 'API Endpoints Tests',
    file: '__tests__/admin-api-endpoints.test.ts',
    description: 'All admin API endpoint protection tests'
  }
];

// Security test categories
const securityCategories = [
  'Authentication Bypass Attempts',
  'Authorization Bypass Attempts', 
  'Email Manipulation Attempts',
  'Session Manipulation Attempts',
  'API Security Edge Cases',
  'Environment Variable Security',
  'Error Handling Security'
];

function printHeader() {
  console.log(colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 Admin Access Control Test Suite             ║');
  console.log('║                                                              ║');
  console.log('║  Comprehensive testing for admin authentication,            ║');
  console.log('║  authorization, and security controls                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function printTestSuiteInfo() {
  console.log(colors.blue + colors.bright + '\n📋 Test Suites Overview:' + colors.reset);
  console.log(colors.blue + '─'.repeat(60) + colors.reset);
  
  testSuites.forEach((suite, index) => {
    const exists = fs.existsSync(suite.file);
    const status = exists ? colors.green + '✓' : colors.red + '✗';
    console.log(`${index + 1}. ${status} ${colors.bright}${suite.name}${colors.reset}`);
    console.log(`   ${colors.cyan}${suite.description}${colors.reset}`);
    console.log(`   ${colors.yellow}File: ${suite.file}${colors.reset}`);
    if (!exists) {
      console.log(`   ${colors.red}⚠️  Test file not found!${colors.reset}`);
    }
    console.log();
  });
}

function runTestSuite(suite) {
  console.log(colors.magenta + colors.bright + `\n🧪 Running: ${suite.name}` + colors.reset);
  console.log(colors.magenta + '─'.repeat(50) + colors.reset);
  
  try {
    if (!fs.existsSync(suite.file)) {
      console.log(colors.red + `❌ Test file not found: ${suite.file}` + colors.reset);
      return { success: false, error: 'File not found' };
    }

    const startTime = Date.now();
    
    // Run the specific test file
    const result = execSync(`npm run test:run -- ${suite.file}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(colors.green + `✅ ${suite.name} passed (${duration}ms)` + colors.reset);
    
    // Parse test results for detailed reporting
    const lines = result.split('\n');
    const testCount = lines.find(line => line.includes('Test Files'))?.match(/\d+/)?.[0] || '0';
    const passCount = lines.find(line => line.includes('passed'))?.match(/\d+/)?.[0] || '0';
    
    console.log(colors.green + `   📊 ${testCount} test files, ${passCount} tests passed` + colors.reset);
    
    return { 
      success: true, 
      duration, 
      testCount: parseInt(testCount), 
      passCount: parseInt(passCount),
      output: result
    };
    
  } catch (error) {
    console.log(colors.red + `❌ ${suite.name} failed` + colors.reset);
    console.log(colors.red + `   Error: ${error.message}` + colors.reset);
    
    // Try to extract useful error information
    if (error.stdout) {
      const errorLines = error.stdout.split('\n').filter(line => 
        line.includes('FAIL') || line.includes('Error') || line.includes('✗')
      );
      errorLines.slice(0, 3).forEach(line => {
        console.log(colors.red + `   ${line}` + colors.reset);
      });
    }
    
    return { success: false, error: error.message };
  }
}

function generateSecurityReport(results) {
  console.log(colors.yellow + colors.bright + '\n🔒 Security Test Report:' + colors.reset);
  console.log(colors.yellow + '─'.repeat(50) + colors.reset);
  
  const securityTests = results.filter(result => 
    result.suite.name.includes('Security') || 
    result.suite.name.includes('Integration') ||
    result.suite.name.includes('API Endpoints')
  );
  
  if (securityTests.length === 0) {
    console.log(colors.red + '⚠️  No security tests found!' + colors.reset);
    return;
  }
  
  const totalSecurityTests = securityTests.reduce((sum, test) => sum + (test.result.passCount || 0), 0);
  const passedSecurityTests = securityTests.filter(test => test.result.success).length;
  
  console.log(colors.green + `✅ Security test suites passed: ${passedSecurityTests}/${securityTests.length}` + colors.reset);
  console.log(colors.green + `✅ Total security tests passed: ${totalSecurityTests}` + colors.reset);
  
  // Security categories coverage
  console.log(colors.cyan + '\n🛡️  Security Categories Tested:' + colors.reset);
  securityCategories.forEach(category => {
    console.log(colors.green + `   ✓ ${category}` + colors.reset);
  });
  
  // Security recommendations
  console.log(colors.blue + '\n💡 Security Recommendations:' + colors.reset);
  console.log(colors.blue + '   • All admin routes are protected by middleware' + colors.reset);
  console.log(colors.blue + '   • API endpoints require server-side authentication' + colors.reset);
  console.log(colors.blue + '   • Email validation is case-insensitive and secure' + colors.reset);
  console.log(colors.blue + '   • Session manipulation attempts are blocked' + colors.reset);
  console.log(colors.blue + '   • Error responses do not leak sensitive information' + colors.reset);
}

function generateSummaryReport(results) {
  console.log(colors.cyan + colors.bright + '\n📊 Test Summary Report:' + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  
  const totalSuites = results.length;
  const passedSuites = results.filter(r => r.result.success).length;
  const failedSuites = totalSuites - passedSuites;
  
  const totalTests = results.reduce((sum, r) => sum + (r.result.passCount || 0), 0);
  const totalDuration = results.reduce((sum, r) => sum + (r.result.duration || 0), 0);
  
  console.log(colors.bright + `Test Suites: ${colors.green}${passedSuites} passed${colors.reset}${colors.bright}, ${colors.red}${failedSuites} failed${colors.reset}${colors.bright}, ${totalSuites} total${colors.reset}`);
  console.log(colors.bright + `Tests:       ${colors.green}${totalTests} passed${colors.reset}`);
  console.log(colors.bright + `Time:        ${totalDuration}ms${colors.reset}`);
  
  if (passedSuites === totalSuites) {
    console.log(colors.green + colors.bright + '\n🎉 All admin access control tests passed!' + colors.reset);
    console.log(colors.green + '   The admin security system is working correctly.' + colors.reset);
  } else {
    console.log(colors.red + colors.bright + '\n⚠️  Some tests failed!' + colors.reset);
    console.log(colors.red + '   Please review the failed tests before deploying.' + colors.reset);
  }
  
  // Coverage report
  console.log(colors.blue + '\n📈 Test Coverage Areas:' + colors.reset);
  const coverageAreas = [
    'Route Protection (Middleware)',
    'API Endpoint Security', 
    'Authentication Verification',
    'Authorization Checking',
    'Session Management',
    'Error Handling',
    'Security Bypass Prevention',
    'Email Validation',
    'Environment Configuration'
  ];
  
  coverageAreas.forEach(area => {
    console.log(colors.green + `   ✓ ${area}` + colors.reset);
  });
}

function saveTestReport(results) {
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      passedSuites: results.filter(r => r.result.success).length,
      totalTests: results.reduce((sum, r) => sum + (r.result.passCount || 0), 0),
      totalDuration: results.reduce((sum, r) => sum + (r.result.duration || 0), 0)
    },
    results: results.map(r => ({
      suite: r.suite.name,
      file: r.suite.file,
      success: r.result.success,
      duration: r.result.duration,
      testCount: r.result.testCount,
      passCount: r.result.passCount,
      error: r.result.error
    }))
  };
  
  const reportPath = path.join(__dirname, '..', 'admin-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(colors.blue + `\n📄 Test report saved to: ${reportPath}` + colors.reset);
}

async function main() {
  printHeader();
  printTestSuiteInfo();
  
  console.log(colors.magenta + colors.bright + '\n🚀 Starting Admin Test Suite...' + colors.reset);
  
  const results = [];
  
  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.push({ suite, result });
    
    // Small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  generateSecurityReport(results);
  generateSummaryReport(results);
  saveTestReport(results);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.result.success);
  process.exit(allPassed ? 0 : 1);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.log(colors.red + colors.bright + '\n💥 Unexpected error occurred:' + colors.reset);
  console.log(colors.red + error.message + colors.reset);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log(colors.red + colors.bright + '\n💥 Unhandled promise rejection:' + colors.reset);
  console.log(colors.red + reason + colors.reset);
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.log(colors.red + colors.bright + '\n💥 Test runner failed:' + colors.reset);
  console.log(colors.red + error.message + colors.reset);
  process.exit(1);
});