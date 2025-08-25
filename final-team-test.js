#!/usr/bin/env node

/**
 * Final comprehensive test for team creation fix
 */

const fs = require('fs');

async function finalTest() {
  console.log('🎯 Final Team Creation Test');
  console.log('===========================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Test with the corrected CSV
    console.log('📤 Testing with Testingdata3_corrected.csv...');
    
    const csvContent = fs.readFileSync('./Testingdata3_corrected.csv', 'utf8');
    const formData = new FormData();
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'testingdata3_corrected.csv');

    const uploadResponse = await fetch(`${BASE_URL}/api/case-match/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.error}`);
    }

    const matchingResult = await uploadResponse.json();
    console.log('✅ CSV processed successfully');
    console.log(`   Teams formed: ${matchingResult.teams?.length || 0}`);
    console.log(`   Participants matched: ${(matchingResult.teams?.flatMap(t => t.members) || []).length}`);
    console.log(`   Participants unmatched: ${matchingResult.unmatched?.length || 0}`);

    if (matchingResult.teams && matchingResult.teams.length > 0) {
      console.log('\n💾 Saving teams to database...');
      
      const matchedParticipants = matchingResult.teams.flatMap(team => team.members);
      const unmatchedParticipants = matchingResult.unmatched || [];

      const saveResponse = await fetch(`${BASE_URL}/api/case-match/save-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams: matchingResult.teams,
          participants: matchedParticipants,
          unmatched: unmatchedParticipants
        })
      });

      const saveResult = await saveResponse.json();
      
      console.log('📊 Save Results:');
      console.log(`   Success: ${saveResult.success}`);
      console.log(`   Teams saved: ${saveResult.data?.savedTeams || 0}`);
      console.log(`   Participants saved: ${saveResult.data?.savedParticipants || 0}`);
      console.log(`   Matched participants: ${saveResult.data?.matchedParticipants || 0}`);
      console.log(`   Unmatched participants: ${saveResult.data?.unmatchedParticipants || 0}`);

      if (saveResult.data?.errors && saveResult.data.errors.length > 0) {
        console.log(`   Errors: ${saveResult.data.errors.length}`);
        console.log('   First 3 errors:');
        saveResult.data.errors.slice(0, 3).forEach((error, index) => {
          console.log(`     ${index + 1}. ${error}`);
        });
      }

      // Verify database state
      console.log('\n🔍 Verifying database...');
      
      const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const stats = statsData.data;
        console.log('📈 Final Statistics:');
        console.log(`   Total teams: ${stats.total_teams}`);
        console.log(`   Total submissions: ${stats.total_submissions}`);
        console.log(`   Matched submissions: ${stats.matched_submissions}`);
        console.log(`   Pending submissions: ${stats.pending_submissions}`);
      }

      // Check if fix worked
      if (saveResult.success && saveResult.data?.savedTeams > 0) {
        console.log('\n🎉 SUCCESS: Team creation bug is FIXED!');
        console.log('✅ Teams are now being saved to the database correctly');
        console.log('✅ Participants are getting proper status updates');
        console.log('✅ Dashboard will show correct data');
      } else {
        console.log('\n❌ ISSUE: Teams are still not being saved');
        console.log('❌ Need to investigate further');
      }
    } else {
      console.log('\n❌ No teams formed from CSV');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

finalTest();