// Simple test for team change request API
const testUserId = 'bf12b02c-85f6-4aba-944d-a7be0aa66933';
const testTeamId = '5fa8e8be-c711-48d2-a02a-a597c51d52a3';
const baseUrl = 'http://localhost:3001';

async function testTeamChangeRequest() {
  console.log('🧪 Testing Team Change Request API...');
  
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
        message: 'Test team change request - this should work now with the fixed schema'
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS: Team Change Request API is working!');
    } else {
      console.log('❌ FAILED: Team Change Request API returned an error');
    }
  } catch (error) {
    console.log('❌ ERROR: Failed to connect to API');
    console.log('Error details:', error.message);
  }
}

// Run the test
testTeamChangeRequest();