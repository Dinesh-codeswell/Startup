#!/usr/bin/env node

/**
 * Test script to verify questionnaire submission works
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Questionnaire-Submit-Test/1.0'
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

async function testQuestionnaireSubmit() {
  console.log('🚀 Testing Questionnaire Submission');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(60));

  // Generate a proper UUID for testing
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Test data that matches the questionnaire format
  const testSubmission = {
    id: generateUUID(),
    fullName: 'John Doe',
    email: `test-${Date.now()}@example.com`,
    whatsappNumber: '+1234567890',
    collegeName: 'Test University',
    currentYear: 'Third Year',
    coreStrengths: ['Strategy', 'Research', 'Financial'],
    preferredRoles: ['Team Lead', 'Researcher'],
    teamPreference: 'Either UG or PG',
    availability: 'Fully Available (10–15 hrs/week)',
    experience: 'Participated in 1–2',
    casePreferences: ['consulting', 'product', 'marketing'],
    preferredTeamSize: '3'
  };

  try {
    console.log('\n🔍 Testing: Questionnaire Submission');
    console.log('   URL: POST /api/team-matching/submit');
    console.log('   Data:', JSON.stringify(testSubmission, null, 2));

    const response = await makeRequest(
      `${BASE_URL}/api/team-matching/submit`,
      'POST',
      testSubmission
    );

    console.log(`\n📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Body:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body.success) {
      console.log('\n✅ SUCCESS: Questionnaire submission works correctly!');
      console.log(`   📧 Submitted for: ${response.body.data?.email}`);
      console.log(`   🆔 Submission ID: ${response.body.data?.id}`);
      console.log(`   📅 Status: ${response.body.data?.status}`);
      return true;
    } else {
      console.log('\n❌ FAILED: Questionnaire submission failed');
      console.log(`   Error: ${response.body.error || 'Unknown error'}`);
      return false;
    }

  } catch (error) {
    console.log('\n❌ ERROR: Request failed');
    console.log(`   Details: ${error.message}`);
    return false;
  }
}

async function testInvalidSubmission() {
  console.log('\n🔍 Testing: Invalid Submission (Missing Required Fields)');
  
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const invalidSubmission = {
    id: generateUUID(),
    fullName: '', // Missing required field
    email: 'invalid@example.com',
    // Missing other required fields
  };

  try {
    const response = await makeRequest(
      `${BASE_URL}/api/team-matching/submit`,
      'POST',
      invalidSubmission
    );

    console.log(`📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Body:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 400 && !response.body.success) {
      console.log('✅ SUCCESS: Validation works correctly (rejected invalid data)');
      return true;
    } else {
      console.log('❌ FAILED: Should have rejected invalid data');
      return false;
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function testDuplicateEmail() {
  console.log('\n🔍 Testing: Duplicate Email Handling');
  
  const duplicateSubmission = {
    id: generateUUID(),
    fullName: 'Jane Doe',
    email: 'duplicate@example.com', // Use same email twice
    whatsappNumber: '+1234567891',
    collegeName: 'Test University',
    currentYear: 'Second Year',
    coreStrengths: ['Marketing', 'Presentation', 'Management'],
    preferredRoles: ['Presenter', 'Coordinator'],
    teamPreference: 'Undergrads only',
    availability: 'Moderately Available (5–10 hrs/week)',
    experience: 'None',
    casePreferences: ['marketing', 'social'],
    preferredTeamSize: '2'
  };

  try {
    // Submit first time
    console.log('   Submitting first time...');
    const firstResponse = await makeRequest(
      `${BASE_URL}/api/team-matching/submit`,
      'POST',
      duplicateSubmission
    );

    if (firstResponse.statusCode === 200) {
      console.log('   ✅ First submission successful');
      
      // Submit second time with same email
      console.log('   Submitting duplicate...');
      const secondResponse = await makeRequest(
        `${BASE_URL}/api/team-matching/submit`,
        'POST',
        { ...duplicateSubmission, id: generateUUID() }
      );

      console.log(`📊 Duplicate Response Status: ${secondResponse.statusCode}`);
      console.log('📋 Duplicate Response:', JSON.stringify(secondResponse.body, null, 2));

      if (secondResponse.statusCode === 409 && !secondResponse.body.success) {
        console.log('✅ SUCCESS: Duplicate email detection works correctly');
        return true;
      } else {
        console.log('❌ FAILED: Should have rejected duplicate email');
        return false;
      }
    } else {
      console.log('❌ FAILED: First submission failed');
      return false;
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const results = [];
  
  results.push(await testQuestionnaireSubmit());
  results.push(await testInvalidSubmission());
  results.push(await testDuplicateEmail());

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 SUCCESS: All questionnaire submission tests passed!');
    console.log('The questionnaire submission system is working correctly.');
  } else {
    console.log('\n⚠️  WARNING: Some tests failed. Check the logs above.');
  }

  return passed === total;
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testQuestionnaireSubmit, testInvalidSubmission, testDuplicateEmail };