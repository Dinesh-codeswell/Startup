#!/usr/bin/env node

/**
 * Debug script to identify database integration issues
 */

const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';

async function debugDatabaseIntegration() {
  console.log('🔍 Debugging Database Integration Issues');
  console.log('========================================\n');

  try {
    // Step 1: Check current database state
    console.log('📊 Step 1: Checking current database state...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('✅ Current database statistics:');
      console.log(`   • Total submissions: ${stats.total_submissions}`);
      console.log(`   • Pending submissions: ${stats.pending_submissions}`);
      console.log(`   • Matched submissions: ${stats.matched_submissions}`);
      console.log(`   • Total teams: ${stats.total_teams}`);
    } else {
      console.log('❌ Failed to fetch stats');
    }

    // Step 2: Check recent submissions
    console.log('\n📝 Step 2: Checking recent submissions...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=10`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || [];
      console.log(`✅ Found ${submissions.length} recent submissions:`);
      
      submissions.slice(0, 5).forEach(sub => {
        console.log(`   • ${sub.full_name} (${sub.email}) - Status: ${sub.status} - Source: ${sub.user_id ? 'Form' : 'CSV'}`);
      });
      
      const csvSubmissions = submissions.filter(s => !s.user_id);
      console.log(`   📄 CSV submissions: ${csvSubmissions.length}`);
      console.log(`   📝 Form submissions: ${submissions.length - csvSubmissions.length}`);
    } else {
      console.log('❌ Failed to fetch submissions');
    }

    // Step 3: Check teams
    console.log('\n🏆 Step 3: Checking teams...');
    
    const teamsResponse = await fetch(`${BASE_URL}/api/team-matching/teams?limit=10`);
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      const teams = teamsData.data || [];
      console.log(`✅ Found ${teams.length} teams:`);
      
      teams.forEach(team => {
        console.log(`   • ${team.team_name} - ${team.members?.length || 0} members - Score: ${team.compatibility_score || 'N/A'}`);
        if (team.members && team.members.length > 0) {
          team.members.forEach(member => {
            console.log(`     - ${member.submission?.full_name || 'Unknown'} (${member.submission?.status || 'Unknown status'})`);
          });
        }
      });
    } else {
      console.log('❌ Failed to fetch teams');
    }

    // Step 4: Test a simple CSV upload and save
    console.log('\n🧪 Step 4: Testing simple CSV upload and save...');
    
    const testCSV = `Full Name,Email,WhatsApp Number,College Name,Current Year,Core Strengths,Preferred Roles,Availability,Experience,Case Preferences,Preferred Team Size,Team Preference
Test User 1,test1@debug.com,+1234567890,Test University,Second Year,Research;Analysis;Strategy,Researcher;Data Analyst,Fully Available (10–15 hrs/week),None,Consulting;Finance,4,Undergrads only
Test User 2,test2@debug.com,+1234567891,Test University,Second Year,Presentation;Communication;Strategy,Presenter;Team Lead,Fully Available (10–15 hrs/week),None,Consulting;Finance,4,Undergrads only
Test User 3,test3@debug.com,+1234567892,Test University,Second Year,Design;Creativity;Product,Designer;Coordinator,Fully Available (10–15 hrs/week),None,Consulting;Product/Tech,4,Undergrads only
Test User 4,test4@debug.com,+1234567893,Test University,Second Year,Technical;Problem Solving;Innovation,Data Analyst;Researcher,Fully Available (10–15 hrs/week),None,Product/Tech;Consulting,4,Undergrads only`;

    // Upload CSV
    const formData = new FormData();
    const csvBlob = new Blob([testCSV], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'debug-test.csv');

    const uploadResponse = await fetch(`${BASE_URL}/api/case-match/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.log('❌ CSV upload failed:', errorData.error);
      return;
    }

    const matchingResult = await uploadResponse.json();
    console.log('✅ CSV processed successfully');
    console.log(`   • Teams formed: ${matchingResult.teams?.length || 0}`);
    console.log(`   • Participants matched: ${(matchingResult.teams?.flatMap(t => t.members) || []).length}`);
    console.log(`   • Participants unmatched: ${matchingResult.unmatched?.length || 0}`);

    // Save to database
    console.log('\n💾 Step 5: Testing database save...');
    
    const matchedParticipants = matchingResult.teams?.flatMap(team => team.members) || [];
    const unmatchedParticipants = matchingResult.unmatched || [];

    console.log('📤 Sending save request with:');
    console.log(`   • Teams: ${matchingResult.teams?.length || 0}`);
    console.log(`   • Matched participants: ${matchedParticipants.length}`);
    console.log(`   • Unmatched participants: ${unmatchedParticipants.length}`);

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

    const saveResult = await saveResponse.json();
    
    if (saveResponse.ok && saveResult.success) {
      console.log('✅ Database save successful');
      console.log(`   • Teams saved: ${saveResult.data?.savedTeams || 0}`);
      console.log(`   • Participants saved: ${saveResult.data?.savedParticipants || 0}`);
      console.log(`   • Matched participants: ${saveResult.data?.matchedParticipants || 0}`);
      console.log(`   • Unmatched participants: ${saveResult.data?.unmatchedParticipants || 0}`);
    } else {
      console.log('❌ Database save failed');
      console.log('   Error:', saveResult.error);
      if (saveResult.data?.errors) {
        console.log('   Detailed errors:');
        saveResult.data.errors.forEach(error => {
          console.log(`     • ${error}`);
        });
      }
    }

    // Step 6: Verify the save worked
    console.log('\n🔍 Step 6: Verifying save results...');
    
    const newStatsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (newStatsResponse.ok) {
      const newStatsData = await newStatsResponse.json();
      const newStats = newStatsData.data;
      console.log('✅ Updated database statistics:');
      console.log(`   • Total submissions: ${newStats.total_submissions}`);
      console.log(`   • Pending submissions: ${newStats.pending_submissions}`);
      console.log(`   • Matched submissions: ${newStats.matched_submissions}`);
      console.log(`   • Total teams: ${newStats.total_teams}`);
    }

    console.log('\n📋 Debug Summary:');
    console.log('• Check if teams are being created in the database');
    console.log('• Check if participant statuses are being updated correctly');
    console.log('• Verify the save-teams API is working as expected');

  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
if (require.main === module) {
  debugDatabaseIntegration();
}

module.exports = { debugDatabaseIntegration };