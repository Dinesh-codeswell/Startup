#!/usr/bin/env node

/**
 * Deep debug script to trace team creation issues
 */

const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_CSV_PATH = './Testingdata3_corrected.csv';

async function debugTeamCreation() {
  console.log('🔍 Deep Debug: Team Creation Issue');
  console.log('===================================\n');

  try {
    // Step 1: Upload CSV and get results
    console.log('📤 Step 1: Uploading CSV...');
    
    const csvContent = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const formData = new FormData();
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'debug-test.csv');

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
    console.log(`   Unmatched: ${matchingResult.unmatched?.length || 0}`);

    // Step 2: Analyze the team structure
    console.log('\n🔍 Step 2: Analyzing team structure...');
    
    if (matchingResult.teams && matchingResult.teams.length > 0) {
      console.log('✅ Teams structure:');
      matchingResult.teams.forEach((team, index) => {
        console.log(`   Team ${index + 1}:`);
        console.log(`     ID: ${team.id}`);
        console.log(`     Size: ${team.teamSize || team.members?.length}`);
        console.log(`     Score: ${team.compatibilityScore}`);
        console.log(`     Members: ${team.members?.length || 0}`);
        
        if (team.members) {
          team.members.forEach((member, mIndex) => {
            console.log(`       ${mIndex + 1}. ${member.fullName} (${member.id})`);
          });
        }
      });
    } else {
      console.log('❌ No teams formed - this is the issue!');
      return;
    }

    // Step 3: Test direct team creation API
    console.log('\n🧪 Step 3: Testing direct team creation...');
    
    const testTeam = {
      team_name: 'Debug Test Team',
      team_size: 2,
      compatibility_score: 85.5,
      member_submission_ids: [] // We'll populate this after creating submissions
    };

    // First create test submissions
    console.log('   Creating test submissions...');
    const testSubmissions = [];
    
    for (let i = 0; i < 2; i++) {
      const submissionData = {
        id: `debug-${Date.now()}-${i}`,
        full_name: `Debug User ${i + 1}`,
        email: `debug${i + 1}@test.com`,
        whatsapp_number: `+123456789${i}`,
        college_name: 'Debug University',
        current_year: 'Second Year',
        core_strengths: ['Research', 'Analysis'],
        preferred_roles: ['Researcher'],
        team_preference: 'Undergrads only',
        availability: 'Fully Available (10–15 hrs/week)',
        experience: 'None',
        case_preferences: ['Consulting'],
        preferred_team_size: 2,
        status: 'pending_match'
      };

      const createResponse = await fetch(`${BASE_URL}/api/team-matching/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        testSubmissions.push(result.data.id);
        console.log(`     ✅ Created submission: ${submissionData.full_name}`);
      } else {
        console.log(`     ❌ Failed to create submission: ${submissionData.full_name}`);
      }
    }

    if (testSubmissions.length === 0) {
      console.log('❌ No test submissions created, cannot test team creation');
      return;
    }

    testTeam.member_submission_ids = testSubmissions;

    // Now test team creation directly
    console.log('   Testing TeamMatchingService.createTeam...');
    
    const teamCreateResponse = await fetch(`${BASE_URL}/api/team-matching/create-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTeam)
    });

    if (teamCreateResponse.ok) {
      const teamResult = await teamCreateResponse.json();
      console.log('     ✅ Direct team creation successful');
      console.log(`     Team ID: ${teamResult.data?.id}`);
    } else {
      const teamError = await teamCreateResponse.json();
      console.log('     ❌ Direct team creation failed:', teamError.error);
    }

    // Step 4: Test the save-teams API with actual data
    console.log('\n💾 Step 4: Testing save-teams API...');
    
    const matchedParticipants = matchingResult.teams?.flatMap(team => team.members) || [];
    const unmatchedParticipants = matchingResult.unmatched || [];

    console.log('   Preparing save request:');
    console.log(`     Teams to save: ${matchingResult.teams?.length || 0}`);
    console.log(`     Matched participants: ${matchedParticipants.length}`);
    console.log(`     Unmatched participants: ${unmatchedParticipants.length}`);

    // Log the first team structure for debugging
    if (matchingResult.teams && matchingResult.teams.length > 0) {
      const firstTeam = matchingResult.teams[0];
      console.log('   First team structure:');
      console.log(`     Team ID: ${firstTeam.id}`);
      console.log(`     Team Size: ${firstTeam.teamSize}`);
      console.log(`     Compatibility Score: ${firstTeam.compatibilityScore}`);
      console.log(`     Members count: ${firstTeam.members?.length}`);
      
      if (firstTeam.members && firstTeam.members.length > 0) {
        console.log('     First member structure:');
        const firstMember = firstTeam.members[0];
        console.log(`       ID: ${firstMember.id}`);
        console.log(`       Name: ${firstMember.fullName}`);
        console.log(`       Email: ${firstMember.email}`);
      }
    }

    const saveResponse = await fetch(`${BASE_URL}/api/case-match/save-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: matchingResult.teams || [],
        participants: matchedParticipants,
        unmatched: unmatchedParticipants
      })
    });

    const saveResult = await saveResponse.json();
    
    console.log('   Save API Response:');
    console.log(`     Success: ${saveResult.success}`);
    console.log(`     Status: ${saveResponse.status}`);
    
    if (saveResult.success) {
      console.log('     ✅ Save operation completed');
      console.log(`     Teams saved: ${saveResult.data?.savedTeams || 0}`);
      console.log(`     Participants saved: ${saveResult.data?.savedParticipants || 0}`);
      console.log(`     Matched participants: ${saveResult.data?.matchedParticipants || 0}`);
      console.log(`     Unmatched participants: ${saveResult.data?.unmatchedParticipants || 0}`);
    } else {
      console.log('     ❌ Save operation failed');
      console.log(`     Error: ${saveResult.error}`);
    }

    if (saveResult.data?.errors && saveResult.data.errors.length > 0) {
      console.log('     Detailed errors:');
      saveResult.data.errors.forEach((error, index) => {
        console.log(`       ${index + 1}. ${error}`);
      });
    }

    // Step 5: Verify database state
    console.log('\n🔍 Step 5: Verifying database state...');
    
    // Check teams
    const teamsResponse = await fetch(`${BASE_URL}/api/team-matching/teams?limit=5`);
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log(`   Teams in database: ${teamsData.data?.length || 0}`);
      
      if (teamsData.data && teamsData.data.length > 0) {
        teamsData.data.forEach((team, index) => {
          console.log(`     ${index + 1}. ${team.team_name} - ${team.members?.length || 0} members`);
        });
      }
    }

    // Check submissions
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=10`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || [];
      console.log(`   Submissions in database: ${submissions.length}`);
      
      const csvSubmissions = submissions.filter(s => !s.user_id);
      const teamFormedSubmissions = submissions.filter(s => s.status === 'team_formed');
      
      console.log(`     CSV submissions: ${csvSubmissions.length}`);
      console.log(`     Team formed status: ${teamFormedSubmissions.length}`);
      console.log(`     Pending match status: ${submissions.filter(s => s.status === 'pending_match').length}`);
    }

    console.log('\n📋 Debug Analysis:');
    console.log('1. Check if teams are being formed in CSV processing ✓');
    console.log('2. Check if save-teams API is being called ✓');
    console.log('3. Check if TeamMatchingService.createTeam works ✓');
    console.log('4. Check if database constraints are blocking inserts');
    console.log('5. Check if submission IDs are being mapped correctly');

  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

if (require.main === module) {
  debugTeamCreation();
}

module.exports = { debugTeamCreation };