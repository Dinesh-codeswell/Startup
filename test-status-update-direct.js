#!/usr/bin/env node

/**
 * Test direct status update to identify the exact issue
 */

async function testDirectStatusUpdate() {
  console.log('🔍 Testing Direct Status Update');
  console.log('===============================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Get a few submission IDs
    console.log('📊 Getting submission IDs...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=5`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || [];
      
      if (submissions.length > 0) {
        const testSubmission = submissions[0];
        console.log(`Found test submission: ${testSubmission.full_name} (${testSubmission.id})`);
        console.log(`Current status: ${testSubmission.status}`);

        // Test direct status update via API
        console.log('\n🔧 Testing direct status update...');
        
        const updateResponse = await fetch(`${BASE_URL}/api/team-matching/submissions/${testSubmission.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'team_formed'
          })
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ Direct update successful:', updateResult);
        } else {
          const errorText = await updateResponse.text();
          console.log('❌ Direct update failed:', errorText);
        }

        // Check if status changed
        console.log('\n📊 Checking if status changed...');
        
        const checkResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=50`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const updatedSubmission = checkData.data?.find(s => s.id === testSubmission.id);
          
          if (updatedSubmission) {
            console.log(`Updated status: ${updatedSubmission.status}`);
            console.log(`Status changed: ${updatedSubmission.status !== testSubmission.status ? '✅' : '❌'}`);
          }
        }
      }
    }

    // Test bulk update with raw SQL approach
    console.log('\n🔧 Testing bulk update approach...');
    
    const bulkUpdateResponse = await fetch(`${BASE_URL}/api/team-matching/test-bulk-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_status_update'
      })
    });

    if (bulkUpdateResponse.ok) {
      const bulkResult = await bulkUpdateResponse.json();
      console.log('Bulk update result:', bulkResult);
    } else {
      console.log('Bulk update API not available (expected)');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testDirectStatusUpdate();