// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testTeamChangeRequest() {
  console.log('Testing Team Change Request API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/team-change-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        requestType: 'leave_team',
        reason: 'I need to leave the team due to scheduling conflicts with my other commitments',
        details: 'My work schedule has changed and I can no longer participate effectively in team activities'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Team change request submitted successfully!');
    } else {
      console.log('❌ Team change request failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing team change request:', error.message);
  }
}

testTeamChangeRequest();