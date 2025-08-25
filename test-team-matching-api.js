#!/usr/bin/env node

/**
 * Test script to verify team matching API endpoints
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Team-Matching-API-Test/1.0'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData,
            url: url
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            url: url
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${method} ${url}`);
    
    const response = await makeRequest(url, method, body);
    
    if (response.statusCode === 200) {
      console.log(`✅ SUCCESS: ${name} (Status: ${response.statusCode})`);
      
      if (response.body && typeof response.body === 'object') {
        if (response.body.success !== undefined) {
          console.log(`   📊 Success: ${response.body.success}`);
        }
        if (response.body.data) {
          if (Array.isArray(response.body.data)) {
            console.log(`   📋 Data: ${response.body.data.length} items`);
          } else if (typeof response.body.data === 'object') {
            const keys = Object.keys(response.body.data);
            console.log(`   📋 Data keys: ${keys.join(', ')}`);
          }
        }
        if (response.body.error) {
          console.log(`   ⚠️  Error: ${response.body.error}`);
        }
      }
      
      return { success: true, response };
    } else {
      console.log(`❌ FAILED: ${name} (Status: ${response.statusCode})`);
      if (response.body && response.body.error) {
        console.log(`   Error: ${response.body.error}`);
      }
      return { success: false, response };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Team Matching API Endpoints');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: 'Get Team Matching Stats',
      url: `${BASE_URL}/api/team-matching/stats`,
      method: 'GET'
    },
    {
      name: 'Get Pending Submissions',
      url: `${BASE_URL}/api/team-matching/submissions?status=pending_match&limit=10`,
      method: 'GET'
    },
    {
      name: 'Get All Submissions',
      url: `${BASE_URL}/api/team-matching/submissions?limit=5`,
      method: 'GET'
    },
    {
      name: 'Get Test Data Info',
      url: `${BASE_URL}/api/team-matching/test-data`,
      method: 'GET'
    },
    {
      name: 'Create Test Data',
      url: `${BASE_URL}/api/team-matching/test-data`,
      method: 'POST',
      body: { action: 'create' }
    },
    {
      name: 'Check Formation Trigger',
      url: `${BASE_URL}/api/team-matching/automated-formation`,
      method: 'GET'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.method, test.body);
    results.push({ ...test, ...result });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:');
    successful.forEach(r => {
      console.log(`   • ${r.name}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failed.forEach(r => {
      console.log(`   • ${r.name} ${r.error ? `(${r.error})` : ''}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed.length === 0) {
    console.log('🎉 SUCCESS: All team matching API endpoints are working!');
  } else {
    console.log('⚠️  WARNING: Some endpoints failed. Check the logs above.');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testEndpoint, runTests };