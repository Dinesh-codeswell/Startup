#!/usr/bin/env node

/**
 * Test to check current dashboard status and identify issues
 */

async function testDashboardStatus() {
  console.log('🔍 Testing Dashboard Status Issues');
  console.log('==================================\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Check current submissions and their statuses
    console.log('📊 Checking current submission statuses...');
    
    const submissionsResponse = await fetch(`${BASE_URL}/api/team-matching/submissions?limit=50`);
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || [];
      
      console.log(`Total submissions: ${submissions.length}`);
      
      // Group by status
      const statusCounts = submissions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // Show recent submissions that would appear in dashboard
      const recentSubmissions = submissions.slice(0, 10);
      console.log('\nRecent submissions (what dashboard shows):');
      recentSubmissions.forEach(sub => {
        console.log(`  ${sub.full_name} (${sub.email}) - Status: ${sub.status}`);
      });
    }

    // Check teams and their members
    console.log('\n🏆 Checking teams and member statuses...');
    
    const teamsResponse = await fetch(`${BASE_URL}/api/team-matching/teams?limit=20`);
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      const teams = teamsData.data || [];
      
      console.log(`Total teams: ${teams.length}`);
      
      if (teams.length > 0) {
        console.log('\nTeam member statuses:');
        teams.slice(0, 3).forEach((team, index) => {
          console.log(`  Team ${index + 1}: ${team.team_name}`);
          if (team.members && team.members.length > 0) {
            team.members.forEach(member => {
              const submission = member.submission;
              if (submission) {
                console.log(`    - ${submission.full_name}: ${submission.status}`);
              }
            });
          }
        });
      }
    }

    // Test Form Teams API endpoint
    console.log('\n🔧 Testing Form Teams API endpoint...');
    
    try {
      const formTeamsResponse = await fetch(`${BASE_URL}/api/team-matching/form-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTeamSize: 4,
          minTeamSize: 2
        })
      });

      if (formTeamsResponse.ok) {
        const result = await formTeamsResponse.json();
        console.log('✅ Form Teams API exists and responds');
        console.log(`Response: ${JSON.stringify(result, null, 2)}`);
      } else {
        console.log(`❌ Form Teams API error: ${formTeamsResponse.status}`);
        const errorText = await formTeamsResponse.text();
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Form Teams API not accessible: ${error.message}`);
    }

    // Check dashboard stats
    console.log('\n📈 Checking dashboard statistics...');
    
    const statsResponse = await fetch(`${BASE_URL}/api/team-matching/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      console.log('Dashboard stats:');
      console.log(`  Total submissions: ${stats.total_submissions}`);
      console.log(`  Pending submissions: ${stats.pending_submissions}`);
      console.log(`  Matched submissions: ${stats.matched_submissions}`);
      console.log(`  Total teams: ${stats.total_teams}`);
    }

    console.log('\n🔍 Issue Analysis:');
    console.log('1. If matched participants still show "pending_match", status update is broken');
    console.log('2. If Form Teams API doesn\'t exist, that\'s why the button doesn\'t work');
    console.log('3. Dashboard should only show participants with "pending_match" status');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testDashboardStatus();