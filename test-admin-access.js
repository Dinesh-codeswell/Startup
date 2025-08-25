#!/usr/bin/env node

/**
 * Test script to verify admin authentication is disabled
 * This script tests access to admin routes without authentication
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/case-match',
  '/case-match',
  '/rl-dashboard',
  '/api/admin/validate-session'
];

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        'User-Agent': 'Admin-Access-Test/1.0'
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test admin route access
 */
async function testAdminRoute(route) {
  const url = `${BASE_URL}${route}`;
  
  try {
    console.log(`\n🔍 Testing: ${route}`);
    
    const response = await makeRequest(url);
    
    // Check if route is accessible
    if (response.statusCode === 200) {
      console.log(`✅ SUCCESS: ${route} is accessible (Status: ${response.statusCode})`);
      
      // For API routes, check if response indicates admin access
      if (route.startsWith('/api/')) {
        try {
          const jsonResponse = JSON.parse(response.body);
          if (jsonResponse.isAdmin === true) {
            console.log(`   🔓 Admin access granted: ${jsonResponse.authDisabled ? 'Auth disabled' : 'Authorized'}`);
          } else if (jsonResponse.authDisabled) {
            console.log(`   🔓 Auth disabled, access granted`);
          }
        } catch (e) {
          // Not JSON, that's fine for non-API routes
        }
      }
      
      return { route, success: true, status: response.statusCode };
    } else if (response.statusCode === 302 || response.statusCode === 301) {
      const location = response.headers.location;
      console.log(`⚠️  REDIRECT: ${route} redirects to ${location} (Status: ${response.statusCode})`);
      
      // Check if redirecting to login or unauthorized page
      if (location && (location.includes('/login') || location.includes('/unauthorized'))) {
        console.log(`❌ BLOCKED: ${route} still requires authentication`);
        return { route, success: false, status: response.statusCode, redirect: location };
      } else {
        console.log(`✅ REDIRECT OK: ${route} redirects but not to auth page`);
        return { route, success: true, status: response.statusCode, redirect: location };
      }
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log(`❌ BLOCKED: ${route} returns ${response.statusCode} (Authentication required)`);
      return { route, success: false, status: response.statusCode };
    } else {
      console.log(`⚠️  UNEXPECTED: ${route} returns ${response.statusCode}`);
      return { route, success: false, status: response.statusCode };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${route} - ${error.message}`);
    return { route, success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Testing Admin Authentication Bypass');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const route of ADMIN_ROUTES) {
    const result = await testAdminRoute(route);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Accessible routes: ${successful.length}/${results.length}`);
  console.log(`❌ Blocked routes: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ ACCESSIBLE ROUTES:');
    successful.forEach(r => {
      console.log(`   • ${r.route} (${r.status})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ BLOCKED ROUTES:');
    failed.forEach(r => {
      console.log(`   • ${r.route} (${r.status || 'Error'}) ${r.redirect ? `-> ${r.redirect}` : ''}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed.length === 0) {
    console.log('🎉 SUCCESS: All admin routes are accessible without authentication!');
    process.exit(0);
  } else {
    console.log('⚠️  WARNING: Some admin routes are still protected. Check the configuration.');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testAdminRoute, runTests };