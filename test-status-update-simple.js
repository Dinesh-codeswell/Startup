#!/usr/bin/env node

/**
 * Test the simple status update API
 */

async function testSimpleStatusUpdate() {
  console.log('🔧 Testing Simple Status Update');
  console.log('===============================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    const response = await fetch(`${BASE_URL}/api/team-matching/test-status-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Status update test successful!');
      console.log('\nOriginal submissions:');
      result.data.originalSubmissions?.forEach(sub => {
        console.log(`  - ${sub.email}: ${sub.status}`);
      });
      
      console.log('\nUpdated submissions:');
      result.data.updatedSubmissions?.forEach(sub => {
        console.log(`  - ${sub.email}: ${sub.status}`);
      });
      
      console.log('\nVerification submissions:');
      result.data.verificationSubmissions?.forEach(sub => {
        console.log(`  - ${sub.email}: ${sub.status}`);
      });
    } else {
      console.log('❌ Status update test failed:');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${result.details}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testSimpleStatusUpdate();