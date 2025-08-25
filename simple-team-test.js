#!/usr/bin/env node

/**
 * Simple test to check team creation issue
 */

async function simpleTest() {
  console.log('🧪 Simple Team Creation Test');
  console.log('============================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    
    if (healthResponse.ok) {
      const statsData = await healthResponse.json();
      console.log('✅ Server is running');
      console.log(`   Current teams in DB: ${statsData.data?.total_teams || 0}`);
      console.log(`   Current submissions: ${statsData.data?.total_submissions || 0}`);
    } else {
      console.log('❌ Server not responding');
      return;
    }

    // Test 2: Create a simple CSV and test upload
    console.log('\n2. Testing CSV upload...');
    
    const testCSV = `Full Name,Email,WhatsApp Number,College Name,Current Year,Core Strengths,Preferred Roles,Availability,Experience,Case Preferences,Preferred Team Size,Team Preference
Alice Test,alice@test.com,+1234567890,Test University,Second Year,Research;Analysis,Researcher;Data Analyst,Fully Available (10–15 hrs/week),None,Consulting,4,Undergrads only
Bob Test,bob@test.com,+1234567891,Test University,Second Year,Presentation;Strategy,Presenter;Team Lead,Fully Available (10–15 hrs/week),None,Consulting,4,Undergrads only
Carol Test,carol@test.com,+1234567892,Test University,Second Year,Design;Creativity,Designer;Coordinator,Fully Available (10–15 hrs/week),None,Product/Tech,4,Undergrads only
Dave Test,dave@test.com,+1234567893,Test University,Second Year,Technical;Problem Solving,Data Analyst;Researcher,Fully Available (10–15 hrs/week),None,Product/Tech,4,Undergrads only`;

    const formData = new FormData();
    const csvBlob = new Blob([testCSV], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'simple-test.csv');

    const uploadResponse = await fetch(`${BASE_URL}/api/case-match/upload`, {
      method: 'POST',
      body: formData
    });

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ CSV upload successful');
      console.log(`   Teams formed: ${result.teams?.length || 0}`);
      console.log(`   Unmatched: ${result.unmatched?.length || 0}`);

      if (result.teams && result.teams.length > 0) {
        // Test 3: Save teams to database
        console.log('\n3. Testing team save to database...');
        
        const matchedParticipants = result.teams.flatMap(team => team.members);
        const unmatchedParticipants = result.unmatched || [];

        const saveResponse = await fetch(`${BASE_URL}/api/case-match/save-teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teams: result.teams,
            participants: matchedParticipants,
            unmatched: unmatchedParticipants
          })
        });

        const saveResult = await saveResponse.json();
        
        if (saveResponse.ok && saveResult.success) {
          console.log('✅ Team save successful');
          console.log(`   Teams saved: ${saveResult.data?.savedTeams || 0}`);
          console.log(`   Participants saved: ${saveResult.data?.savedParticipants || 0}`);
        } else {
          console.log('❌ Team save failed');
          console.log(`   Error: ${saveResult.error}`);
          if (saveResult.data?.errors) {
            console.log('   First few errors:');
            saveResult.data.errors.slice(0, 3).forEach(error => {
              console.log(`     - ${error}`);
            });
          }
        }

        // Test 4: Verify in database
        console.log('\n4. Verifying database state...');
        
        const newStatsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
        if (newStatsResponse.ok) {
          const newStatsData = await newStatsResponse.json();
          console.log('✅ Updated database stats:');
          console.log(`   Teams: ${newStatsData.data?.total_teams || 0}`);
          console.log(`   Submissions: ${newStatsData.data?.total_submissions || 0}`);
          console.log(`   Matched: ${newStatsData.data?.matched_submissions || 0}`);
        }
      } else {
        console.log('❌ No teams formed from CSV');
      }
    } else {
      const error = await uploadResponse.json();
      console.log('❌ CSV upload failed:', error.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
simpleTest();