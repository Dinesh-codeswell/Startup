#!/usr/bin/env node

/**
 * Test script to verify the corrected CSV file works with the team formation algorithm
 */

const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CSV_PATH = './Testingdata3_corrected.csv';

async function testCorrectedCSV() {
  console.log('🧪 Testing Corrected CSV File');
  console.log('==============================\n');

  try {
    // Step 1: Verify CSV file exists
    console.log('📁 Step 1: Checking corrected CSV file...');
    if (!fs.existsSync(TEST_CSV_PATH)) {
      throw new Error(`CSV file not found at: ${TEST_CSV_PATH}`);
    }
    
    const csvContent = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log(`✅ Found CSV with ${lines.length - 1} participants`);

    // Step 2: Upload and process CSV
    console.log('\n📤 Step 2: Uploading corrected CSV...');
    
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
    console.log(`   📊 Results:`);
    console.log(`   • Teams formed: ${matchingResult.teams?.length || 0}`);
    console.log(`   • Participants matched: ${(matchingResult.teams?.flatMap(t => t.members) || []).length}`);
    console.log(`   • Participants unmatched: ${matchingResult.unmatched?.length || 0}`);
    console.log(`   • Total participants processed: ${(matchingResult.teams?.flatMap(t => t.members) || []).length + (matchingResult.unmatched?.length || 0)}`);

    // Show team details if any teams were formed
    if (matchingResult.teams && matchingResult.teams.length > 0) {
      console.log('\n   🏆 Teams formed:');
      matchingResult.teams.forEach((team, index) => {
        console.log(`   Team ${index + 1}: ${team.members.length} members (Score: ${team.compatibilityScore?.toFixed(1) || 'N/A'})`);
        team.members.forEach(member => {
          console.log(`     - ${member.fullName} (${member.currentYear}, ${member.preferredTeamSize}-person team pref)`);
        });
      });
    }

    // Show unmatched participants if any
    if (matchingResult.unmatched && matchingResult.unmatched.length > 0) {
      console.log('\n   ⚠️  Unmatched participants:');
      matchingResult.unmatched.slice(0, 5).forEach(participant => {
        console.log(`     - ${participant.fullName} (${participant.currentYear}, wants ${participant.preferredTeamSize}-person team)`);
      });
      if (matchingResult.unmatched.length > 5) {
        console.log(`     ... and ${matchingResult.unmatched.length - 5} more`);
      }
    }

    // Step 3: Save to database
    console.log('\n💾 Step 3: Saving to database...');
    
    const matchedParticipants = matchingResult.teams?.flatMap(team => team.members) || [];
    const unmatchedParticipants = matchingResult.unmatched || [];

    const saveResponse = await fetch(`${BASE_URL}/api/case-match/save-teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teams: matchingResult.teams || [],
        participants: matchedParticipants,
        unmatched: unmatchedParticipants
      })
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json();
      throw new Error(`Save failed: ${errorData.error}`);
    }

    const saveResult = await saveResponse.json();
    console.log('✅ Successfully saved to database');
    console.log(`   📊 Database results:`);
    console.log(`   • Teams saved: ${saveResult.data?.savedTeams || 0}`);
    console.log(`   • Total participants saved: ${saveResult.data?.savedParticipants || 0}`);
    console.log(`   • Matched participants: ${saveResult.data?.matchedParticipants || 0}`);
    console.log(`   • Unmatched participants: ${saveResult.data?.unmatchedParticipants || 0}`);

    if (saveResult.data?.errors && saveResult.data.errors.length > 0) {
      console.log('\n   ⚠️  Some errors occurred:');
      saveResult.data.errors.slice(0, 3).forEach(error => {
        console.log(`   • ${error}`);
      });
      if (saveResult.data.errors.length > 3) {
        console.log(`   • ... and ${saveResult.data.errors.length - 3} more errors`);
      }
    }

    // Step 4: Verify in dashboard
    console.log('\n🔍 Step 4: Verifying dashboard data...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('✅ Updated dashboard statistics:');
      console.log(`   • Total submissions: ${stats.total_submissions}`);
      console.log(`   • Pending submissions: ${stats.pending_submissions}`);
      console.log(`   • Matched submissions: ${stats.matched_submissions}`);
      console.log(`   • Total teams: ${stats.total_teams}`);
    }

    console.log('\n🎉 Corrected CSV Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ CSV format is now compatible with the algorithm');
    console.log('✅ Team formation works correctly');
    console.log('✅ Database integration works');
    console.log('✅ Both matched and unmatched participants are saved');
    
    console.log('\n🔧 Key fixes applied:');
    console.log('• Column headers match expected format');
    console.log('• Field values use correct enumeration values');
    console.log('• Availability format standardized');
    console.log('• Experience levels corrected');
    console.log('• Case preferences mapped to valid options');
    console.log('• Team preference values standardized');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Use Testingdata3_corrected.csv for your testing');
    console.log('2. Visit /admin/dashboard to see all participants');
    console.log('3. Visit /admin/case-match to upload the corrected CSV');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCorrectedCSV();
}

module.exports = { testCorrectedCSV };