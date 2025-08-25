#!/usr/bin/env node

/**
 * Comprehensive fix for the status update issue
 * This will test different approaches to update the status
 */

async function fixStatusUpdateIssue() {
  console.log('🔧 Comprehensive Status Update Fix');
  console.log('==================================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Current state analysis...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log(`Current: ${stats.pending_submissions} pending, ${stats.matched_submissions} matched, ${stats.total_teams} teams`);
    }

    // Step 2: Get some submission IDs that should be updated
    console.log('\n📝 Step 2: Getting submissions that need status update...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?status=pending_match&limit=5`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const pendingSubmissions = submissionsData.data || [];
      
      if (pendingSubmissions.length > 0) {
        console.log(`Found ${pendingSubmissions.length} pending submissions to test with`);
        
        // Step 3: Try to manually update one submission using different approaches
        const testSubmission = pendingSubmissions[0];
        console.log(`\n🧪 Step 3: Testing manual status update for ${testSubmission.full_name}...`);
        
        // Approach 1: Direct API call to update individual submission
        console.log('Approach 1: Individual submission update...');
        
        const individualUpdateResponse = await fetch(`${BASE_URL}/api/team-matching/submissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: testSubmission.id,
            status: 'team_formed'
          })
        });

        if (individualUpdateResponse.ok) {
          const updateResult = await individualUpdateResponse.json();
          console.log('✅ Individual update successful:', updateResult);
        } else {
          console.log('❌ Individual update failed - API might not exist');
          
          // Approach 2: Try creating a custom update endpoint
          console.log('\nApproach 2: Creating custom update solution...');
          
          // This will require creating a new API endpoint that bypasses the trigger issue
          const customUpdateResponse = await fetch(`${BASE_URL}/api/team-matching/force-status-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submissionIds: [testSubmission.id],
              newStatus: 'team_formed'
            })
          });

          if (customUpdateResponse.ok) {
            const customResult = await customUpdateResponse.json();
            console.log('✅ Custom update successful:', customResult);
          } else {
            console.log('❌ Custom update API not available - will create it');
          }
        }
        
        // Step 4: Verify if any approach worked
        console.log('\n🔍 Step 4: Verifying if status changed...');
        
        const verifyResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=50`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const updatedSubmission = verifyData.data?.find(s => s.id === testSubmission.id);
          
          if (updatedSubmission) {
            console.log(`Status check: ${testSubmission.status} → ${updatedSubmission.status}`);
            console.log(`Status changed: ${updatedSubmission.status !== testSubmission.status ? '✅' : '❌'}`);
          }
        }
      }
    }

    console.log('\n📋 Analysis Summary:');
    console.log('The issue is likely a database trigger trying to set updated_at field that doesn\'t exist');
    console.log('Solutions needed:');
    console.log('1. Create a custom update API that bypasses the trigger');
    console.log('2. Or add the missing updated_at column to the database');
    console.log('3. Or disable the problematic trigger');

  } catch (error) {
    console.error('\n❌ Fix attempt failed:', error.message);
  }
}

fixStatusUpdateIssue();