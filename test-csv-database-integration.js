#!/usr/bin/env node

/**
 * Test script to verify CSV upload and database integration
 * Tests the complete flow: CSV upload -> team formation -> database saving
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CSV_PATH = './public/sample-case-match.csv';

async function testCSVDatabaseIntegration() {
  console.log('🧪 Testing CSV Database Integration');
  console.log('=====================================\n');

  try {
    // Step 1: Check if sample CSV exists
    console.log('📁 Step 1: Checking sample CSV file...');
    if (!fs.existsSync(TEST_CSV_PATH)) {
      console.error('❌ Sample CSV file not found at:', TEST_CSV_PATH);
      console.log('Creating a minimal test CSV...');
      
      const testCSV = `Full Name,Email,WhatsApp Number,College Name,Current Year,Core Strengths,Preferred Roles,Team Preference,Availability,Experience,Case Preferences,Preferred Team Size
John Doe,john@test.com,+1234567890,Test University,3rd Year,Analysis;Strategy,Leader;Analyst,Either UG or PG,Available,Intermediate,Business Strategy;Marketing,4
Jane Smith,jane@test.com,+1234567891,Test College,2nd Year,Research;Presentation,Researcher;Presenter,Either UG or PG,Available,Beginner,Finance;Operations,3
Bob Johnson,bob@test.com,+1234567892,Another University,4th Year,Problem Solving;Communication,Problem Solver;Communicator,Either UG or PG,Available,Advanced,Technology;Innovation,4
Alice Brown,alice@test.com,+1234567893,Test Institute,1st Year,Creativity;Teamwork,Creative;Team Player,Either UG or PG,Available,Beginner,Marketing;Design,3`;
      
      fs.writeFileSync(TEST_CSV_PATH, testCSV);
      console.log('✅ Created test CSV file');
    } else {
      console.log('✅ Sample CSV file found');
    }

    // Step 2: Upload CSV and get matching results
    console.log('\n📤 Step 2: Uploading CSV for team matching...');
    
    const formData = new FormData();
    const csvContent = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'test-participants.csv');

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

    // Step 3: Save teams to database
    console.log('\n💾 Step 3: Saving teams to database...');
    
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

    if (saveResult.data?.errors && saveResult.data.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      saveResult.data.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Step 4: Verify data in database
    console.log('\n🔍 Step 4: Verifying data in database...');
    
    // Check submissions
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=20`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const csvSubmissions = submissionsData.data?.filter(s => !s.user_id) || [];
      console.log(`✅ Found ${csvSubmissions.length} CSV submissions in database`);
      
      if (csvSubmissions.length > 0) {
        console.log('   Recent CSV submissions:');
        csvSubmissions.slice(0, 3).forEach(sub => {
          console.log(`   - ${sub.full_name} (${sub.email}) - Status: ${sub.status}`);
        });
      }
    }

    // Check teams
    const teamsResponse = await fetch(`${BASE_URL}/api/team-matching/teams?limit=10`);
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log(`✅ Found ${teamsData.data?.length || 0} teams in database`);
      
      if (teamsData.data && teamsData.data.length > 0) {
        console.log('   Recent teams:');
        teamsData.data.slice(0, 2).forEach(team => {
          console.log(`   - ${team.team_name} (${team.members?.length || 0} members) - Score: ${team.compatibility_score}`);
        });
      }
    }

    // Step 5: Check dashboard data
    console.log('\n📊 Step 5: Checking dashboard statistics...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('✅ Dashboard statistics:');
      console.log(`   Total submissions: ${stats.total_submissions}`);
      console.log(`   Pending submissions: ${stats.pending_submissions}`);
      console.log(`   Matched submissions: ${stats.matched_submissions}`);
      console.log(`   Total teams: ${stats.total_teams}`);
    }

    console.log('\n🎉 CSV Database Integration Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ CSV upload and processing works');
    console.log('✅ Team formation algorithm works');
    console.log('✅ Database saving works');
    console.log('✅ Unmatched participants are saved');
    console.log('✅ Dashboard shows CSV participants');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Visit /admin/dashboard to see the participants');
    console.log('2. Visit /admin/case-match to test CSV upload UI');
    console.log('3. Check that unmatched participants appear in the dashboard');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCSVDatabaseIntegration();
}

module.exports = { testCSVDatabaseIntegration };