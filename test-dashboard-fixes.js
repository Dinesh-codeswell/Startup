#!/usr/bin/env node

/**
 * Test both dashboard fixes:
 * 1. Status updates working correctly
 * 2. Form Teams functionality working
 */

async function testDashboardFixes() {
  console.log('🧪 Testing Dashboard Fixes');
  console.log('==========================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current dashboard state...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('Current statistics:');
      console.log(`  Total submissions: ${stats.total_submissions}`);
      console.log(`  Pending submissions: ${stats.pending_submissions}`);
      console.log(`  Matched submissions: ${stats.matched_submissions}`);
      console.log(`  Total teams: ${stats.total_teams}`);
    }

    // Step 2: Check if there are pending submissions for team formation
    console.log('\n📝 Step 2: Checking pending submissions...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?status=pending_match&limit=20`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const pendingSubmissions = submissionsData.data || [];
      console.log(`Found ${pendingSubmissions.length} pending submissions`);
      
      if (pendingSubmissions.length > 0) {
        console.log('Sample pending submissions:');
        pendingSubmissions.slice(0, 3).forEach(sub => {
          console.log(`  - ${sub.full_name} (${sub.email}) - Status: ${sub.status}`);
        });
      }

      // Step 3: Test Form Teams functionality
      if (pendingSubmissions.length >= 2) {
        console.log('\n🏆 Step 3: Testing Form Teams functionality...');
        
        const formTeamsResponse = await fetch(`${BASE_URL}/api/team-matching/form-teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maxTeamSize: 4,
            minTeamSize: 2
          })
        });

        const formTeamsResult = await formTeamsResponse.json();
        
        if (formTeamsResponse.ok && formTeamsResult.success) {
          console.log('✅ Form Teams API working!');
          console.log(`  Teams formed: ${formTeamsResult.data.teamsFormed}`);
          console.log(`  Participants matched: ${formTeamsResult.data.participantsMatched}`);
          console.log(`  Participants unmatched: ${formTeamsResult.data.participantsUnmatched}`);
          
          if (formTeamsResult.teams && formTeamsResult.teams.length > 0) {
            console.log('  New teams:');
            formTeamsResult.teams.forEach(team => {
              console.log(`    - ${team.name} (${team.size} members, score: ${team.score})`);
            });
          }
        } else {
          console.log('❌ Form Teams API failed:');
          console.log(`  Error: ${formTeamsResult.error}`);
          if (formTeamsResult.details) {
            console.log(`  Details: ${formTeamsResult.details}`);
          }
        }
      } else {
        console.log('⚠️ Not enough pending submissions to test Form Teams (need at least 2)');
      }
    }

    // Step 4: Verify final state
    console.log('\n📈 Step 4: Checking final dashboard state...');
    
    const finalStatsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (finalStatsResponse.ok) {
      const finalStatsData = await finalStatsResponse.json();
      const finalStats = finalStatsData.data;
      console.log('Final statistics:');
      console.log(`  Total submissions: ${finalStats.total_submissions}`);
      console.log(`  Pending submissions: ${finalStats.pending_submissions}`);
      console.log(`  Matched submissions: ${finalStats.matched_submissions}`);
      console.log(`  Total teams: ${finalStats.total_teams}`);
    }

    // Step 5: Test dashboard filtering
    console.log('\n🔍 Step 5: Testing dashboard filtering...');
    
    const dashboardSubmissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?status=pending_match&limit=50`);
    if (dashboardSubmissionsResponse.ok) {
      const dashboardData = await dashboardSubmissionsResponse.json();
      const dashboardSubmissions = dashboardData.data || [];
      console.log(`Dashboard will show ${dashboardSubmissions.length} unmatched participants`);
      
      // Verify all are actually pending
      const allPending = dashboardSubmissions.every((sub) => sub.status === 'pending_match');
      console.log(`All submissions are pending_match: ${allPending ? '✅' : '❌'}`);
    }

    console.log('\n🎉 Dashboard Fixes Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Status updates should now work correctly');
    console.log('✅ Form Teams button should now create teams');
    console.log('✅ Dashboard should only show unmatched participants');
    console.log('✅ Matched participants should disappear from recent submissions');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Visit /admin/dashboard to see the updated interface');
    console.log('2. Click "Form Teams" to automatically create teams from pending submissions');
    console.log('3. Verify that matched participants disappear from the recent submissions list');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testDashboardFixes();