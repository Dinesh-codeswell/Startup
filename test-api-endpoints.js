// Test script to verify API endpoints work with actual database schema
// Using built-in fetch API (Node.js 18+)

// Test data
const testUserId = 'bf12b02c-85f6-4aba-944d-a7be0aa66933';
const testTeamId = '5fa8e8be-c711-48d2-a02a-a597c51d52a3';
const baseUrl = 'http://localhost:3001';

async function testTeamChangeRequest() {
  console.log('\n🧪 Testing Team Change Request API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/team-change-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        teamId: testTeamId,
        requestType: 'leave_team',
        message: 'Test team change request'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Team Change Request API: SUCCESS');
      console.log('   Response:', data);
    } else {
      console.log('❌ Team Change Request API: FAILED');
      console.log('   Error:', data);
    }
  } catch (error) {
    console.log('❌ Team Change Request API: ERROR');
    console.log('   Error:', error.message);
  }
}

async function testIssueReport() {
  console.log('\n🧪 Testing Issue Report API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/issue-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        teamId: testTeamId,
        reportType: 'bug',
        description: 'Test issue report',
        priority: 'medium'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Issue Report API: SUCCESS');
      console.log('   Response:', data);
    } else {
      console.log('❌ Issue Report API: FAILED');
      console.log('   Error:', data);
    }
  } catch (error) {
    console.log('❌ Issue Report API: ERROR');
    console.log('   Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...');
  console.log('   Base URL:', baseUrl);
  console.log('   Test User ID:', testUserId);
  console.log('   Test Team ID:', testTeamId);
  
  await testTeamChangeRequest();
  await testIssueReport();
  
  console.log('\n✨ Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testTeamChangeRequest, testIssueReport };