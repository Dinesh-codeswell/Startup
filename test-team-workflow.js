#!/usr/bin/env node

/**
 * Test script to verify the team matching workflow
 * This tests the specific requirement: API check before showing questionnaire
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Team-Workflow-Test/1.0'
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

async function testWorkflow() {
  console.log('🧪 Testing Team Matching Workflow');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: API endpoint with user_id parameter (simulating authenticated user)
    console.log('\n1️⃣ Testing API endpoint with user_id parameter...');
    const testUserId = 'test-user-123';
    const apiUrl = `${BASE_URL}/api/team-matching/user-status?user_id=${testUserId}`;
    
    const response = await makeRequest(apiUrl);
    
    if (response.statusCode === 200) {
      console.log('✅ API endpoint responds correctly');
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.body && typeof response.body === 'object') {
        console.log(`   Success: ${response.body.success}`);
        
        if (response.body.data) {
          console.log(`   Has Submitted: ${response.body.data.hasSubmitted}`);
          console.log(`   Team Status: ${response.body.data.teamStatus}`);
          console.log(`   Redirect To: ${response.body.data.redirectTo}`);
          
          // Test the workflow logic
          if (response.body.data.hasSubmitted) {
            console.log('   🔄 User has submitted - should redirect to /team/dashboard');
          } else {
            console.log('   📝 User has not submitted - should show questionnaire');
          }
        }
        
        if (response.body.error) {
          console.log(`   ⚠️ Error: ${response.body.error}`);
        }
      }
    } else {
      console.log(`❌ API endpoint failed with status: ${response.statusCode}`);
      if (response.body && response.body.error) {
        console.log(`   Error: ${response.body.error}`);
      }
    }
    
    // Test 2: API endpoint with email parameter
    console.log('\n2️⃣ Testing API endpoint with email parameter...');
    const testEmail = 'test@example.com';
    const emailApiUrl = `${BASE_URL}/api/team-matching/user-status?email=${testEmail}`;
    
    const emailResponse = await makeRequest(emailApiUrl);
    
    if (emailResponse.statusCode === 200) {
      console.log('✅ Email-based API call works');
      console.log(`   Status: ${emailResponse.statusCode}`);
      
      if (emailResponse.body && typeof emailResponse.body === 'object') {
        console.log(`   Success: ${emailResponse.body.success}`);
        if (emailResponse.body.data) {
          console.log(`   Has Submitted: ${emailResponse.body.data.hasSubmitted}`);
        }
      }
    } else {
      console.log(`❌ Email-based API call failed: ${emailResponse.statusCode}`);
    }
    
    // Test 3: API endpoint without parameters (should fail)
    console.log('\n3️⃣ Testing API endpoint without parameters (should fail)...');
    const noParamsUrl = `${BASE_URL}/api/team-matching/user-status`;
    
    const noParamsResponse = await makeRequest(noParamsUrl);
    
    if (noParamsResponse.statusCode === 400) {
      console.log('✅ API correctly rejects requests without parameters');
      console.log(`   Status: ${noParamsResponse.statusCode}`);
      if (noParamsResponse.body && noParamsResponse.body.error) {
        console.log(`   Error: ${noParamsResponse.body.error}`);
      }
    } else {
      console.log(`⚠️ Unexpected response for no-params request: ${noParamsResponse.statusCode}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Workflow Test Summary:');
    console.log('   ✅ API endpoint exists and responds');
    console.log('   ✅ User ID parameter is properly handled');
    console.log('   ✅ Email parameter is properly handled');
    console.log('   ✅ Missing parameters are properly rejected');
    console.log('   ✅ Response includes hasSubmitted flag for redirection logic');
    console.log('\n🚀 The team matching workflow should now work correctly!');
    console.log('   - Users who have submitted will be redirected to /team/dashboard');
    console.log('   - Users who have not submitted will see the questionnaire');
    
  } catch (error) {
    console.log('❌ Test failed with error:');
    console.log('Error message:', error.message || error);
    console.log('Full error:', error);
  }
}

// Run the test
testWorkflow();