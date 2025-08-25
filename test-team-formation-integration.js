#!/usr/bin/env node

/**
 * Test script to verify team formation and database integration with a CSV that should form teams
 */

const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CSV_PATH = './test-team-formation.csv';

async function testTeamFormationIntegration() {
  console.log('🧪 Testing Team Formation Integration');
  console.log('====================================\n');

  try {
    // Step 1: Upload CSV and get matching results
    console.log('📤 Step 1: Uploading CSV for team matching...');
    
    const formData = new FormData();
    const csvContent = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'team-formation-test.csv');

    const uploadResponse = await fetch(`${BASE_URL}/api/case-match/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.error}`);
    }

    const matchingResult = await uploadResponse.json();
    console.log('✅ CSV uploaded and processed successfully');
    console.log(`   Teams formed: ${matchingResult.teams?.length || 0}`);
    console.log(`   Unmatched participants: ${matchingResult.unmatched?.length || 0}`);
    console.log(`   Total participants: ${(matchingResult.teams?.flatMap(t => t.members) || []).length + (matchingResult.unmatched?.length || 0)}`);

    if (matchingResult.teams && matchingResult.teams.length > 0) {
      console.log('\n   Team details:');
      matchingResult.teams.forEach((team, index) => {
        console.log(`   Team ${index + 1}: ${team.members.length} members, Score: ${team.compatibilityScore?.toFixed(1) || 'N/A'}`);
        team.members.forEach(member => {
          console.log(`     - ${member.fullName} (${member.email})`);
        });
      });
    }

    // Step 2: Save teams to database
    console.log('\n💾 Step 2: Saving teams to database...');
    
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
    console.log('✅ Teams saved to database successfully');
    console.log(`   Saved teams: ${saveResult.data?.savedTeams || 0}`);
    console.log(`   Saved participants: ${saveResult.data?.savedParticipants || 0}`);
    console.log(`   Matched participants: ${saveResult.data?.matchedParticipants || 0}`);
    console.log(`   Unmatched participants: ${saveResult.data?.unmatchedParticipants || 0}`);

    // Step 3: Verify teams in database
    console.log('\n🔍 Step 3: Verifying teams in database...');
    
    const teamsResponse = await fetch(`${BASE_URL}/api/team-matching/teams?limit=10`);
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log(`✅ Found ${teamsData.data?.length || 0} teams in database`);
      
      if (teamsData.data && teamsData.data.length > 0) {
        console.log('   Recent teams:');
        teamsData.data.slice(0, 3).forEach(team => {
          console.log(`   - ${team.team_name} (${team.members?.length || 0} members) - Score: ${team.compatibility_score}`);
          if (team.members) {
            team.members.forEach(member => {
              console.log(`     - ${member.submission?.full_name} (${member.submission?.email})`);
            });
          }
        });
      }
    }

    // Step 4: Check dashboard statistics
    console.log('\n📊 Step 4: Checking updated dashboard statistics...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('✅ Updated dashboard statistics:');
      console.log(`   Total submissions: ${stats.total_submissions}`);
      console.log(`   Pending submissions: ${stats.pending_submissions}`);
      console.log(`   Matched submissions: ${stats.matched_submissions}`);
      console.log(`   Total teams: ${stats.total_teams}`);
    }

    console.log('\n🎉 Team Formation Integration Test Completed Successfully!');
    console.log('\n📋 Results Summary:');
    console.log(`✅ Teams formed from CSV: ${matchingResult.teams?.length || 0}`);
    console.log(`✅ Teams saved to database: ${saveResult.data?.savedTeams || 0}`);
    console.log(`✅ Participants matched: ${saveResult.data?.matchedParticipants || 0}`);
    console.log(`✅ Participants unmatched: ${saveResult.data?.unmatchedParticipants || 0}`);
    
    console.log('\n🔗 Verification steps:');
    console.log('1. Visit /admin/dashboard to see all participants and teams');
    console.log('2. Check that CSV participants show with "CSV" badges');
    console.log('3. Verify matched participants show "TEAM FORMED" status');
    console.log('4. Confirm unmatched participants show "PENDING MATCH" status');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testTeamFormationIntegration();
}

module.exports = { testTeamFormationIntegration };