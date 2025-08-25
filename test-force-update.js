#!/usr/bin/env node

/**
 * Test the force update API directly
 */

async function testForceUpdate() {
  console.log('🔧 Testing Force Update API');
  console.log('============================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Get a submission to test with
    console.log('📊 Getting a test submission...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?status=pending_match&limit=1`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || [];
      
      if (submissions.length > 0) {
        const testSubmission = submissions[0];
        console.log(`Test submission: ${testSubmission.full_name} (${testSubmission.id})`);
        console.log(`Current status: ${testSubmission.status}`);

        // Test the force update API
        console.log('\n🔧 Testing force update API...');
        
        const forceUpdateResponse = await fetch(`${BASE_URL}/api/team-matching/force-status-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionIds: [testSubmission.id],
            newStatus: 'team_formed'
          })
        });

        const forceUpdateResult = await forceUpdateResponse.json();
        
        if (forceUpdateResponse.ok && forceUpdateResult.success) {
          console.log('✅ Force update successful!');
          console.log(`Method used: ${forceUpdateResult.data.method}`);
          console.log('Updated submissions:', forceUpdateResult.data.updatedSubmissions);
        } else {
          console.log('❌ Force update failed:');
          console.log(`Error: ${forceUpdateResult.error}`);
          if (forceUpdateResult.details) {
            console.log('Details:', forceUpdateResult.details);
          }
          if (forceUpdateResult.suggestion) {
            console.log('Suggestion:', forceUpdateResult.suggestion);
          }
        }

        // Verify the update
        console.log('\n🔍 Verifying the update...');
        
        const verifyResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=50`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const updatedSubmission = verifyData.data?.find(s => s.id === testSubmission.id);
          
          if (updatedSubmission) {
            console.log(`Status check: ${testSubmission.status} → ${updatedSubmission.status}`);
            console.log(`Status changed: ${updatedSubmission.status !== testSubmission.status ? '✅' : '❌'}`);
          }
        }
      } else {
        console.log('❌ No pending submissions found to test with');
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testForceUpdate();