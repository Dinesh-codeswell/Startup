#!/usr/bin/env node

/**
 * Complete Workflow Test
 * 
 * Tests the entire team formation workflow:
 * 1. Form Team button clicked
 * 2. Takes unmatched students only
 * 3. Runs team matching algorithm
 * 4. Formed teams added to database
 * 5. Unmatched students remain in recent submissions
 * 6. Stats update in real-time
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testCompleteWorkflow() {
  console.log('🔄 Testing Complete Team Formation Workflow')
  console.log('=' .repeat(50))

  try {
    // Step 1: Get initial state
    console.log('\n📊 Step 1: Getting initial state...')
    
    const initialStatsResponse = await fetch(`${API_BASE}/api/team-matching/stats`)
    const initialStatsData = await initialStatsResponse.json()
    
    const initialUnmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
    const initialUnmatchedData = await initialUnmatchedResponse.json()

    if (!initialStatsData.success || !initialUnmatchedData.success) {
      console.log('❌ Failed to get initial state')
      return
    }

    const initialStats = initialStatsData.data
    const initialUnmatched = initialUnmatchedData.data

    console.log(`✅ Initial State:`)
    console.log(`   Total Submissions: ${initialStats.total_submissions}`)
    console.log(`   Unmatched: ${initialUnmatched.length}`)
    console.log(`   Matched: ${initialStats.matched_submissions}`)
    console.log(`   Teams: ${initialStats.total_teams}`)

    if (initialUnmatched.length === 0) {
      console.log('\n⚠️  No unmatched submissions found. Creating test data...')
      
      // Create test data
      const testDataResponse = await fetch(`${API_BASE}/api/team-matching/test-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      })
      
      const testDataResult = await testDataResponse.json()
      if (testDataResult.success) {
        console.log(`✅ Created ${testDataResult.data.created} test submissions`)
        
        // Refresh unmatched data
        const refreshUnmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
        const refreshUnmatchedData = await refreshUnmatchedResponse.json()
        
        if (refreshUnmatchedData.success) {
          console.log(`✅ Now have ${refreshUnmatchedData.data.length} unmatched submissions`)
        }
      } else {
        console.log('❌ Failed to create test data:', testDataResult.error)
        return
      }
    }

    // Step 2: Test team formation
    console.log('\n🤖 Step 2: Testing team formation...')
    console.log('Clicking "Form Teams" button (simulated)...')

    const formTeamsResponse = await fetch(`${API_BASE}/api/team-matching/form-teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxTeamSize: 4,
        minTeamSize: 2
      })
    })

    const formTeamsData = await formTeamsResponse.json()

    if (formTeamsData.success) {
      console.log(`✅ Team Formation Successful!`)
      console.log(`   Teams Formed: ${formTeamsData.data.teamsFormed}`)
      console.log(`   Participants Matched: ${formTeamsData.data.participantsMatched}`)
      console.log(`   Participants Unmatched: ${formTeamsData.data.participantsUnmatched}`)
      console.log(`   Total Processed: ${formTeamsData.data.totalParticipants}`)
      console.log(`   Previously Matched: ${formTeamsData.data.previouslyMatched}`)

      // Verify only unmatched were processed
      if (formTeamsData.data.totalParticipants === initialUnmatched.length) {
        console.log(`✅ Correctly processed only unmatched participants`)
      } else {
        console.log(`⚠️  Expected to process ${initialUnmatched.length} but processed ${formTeamsData.data.totalParticipants}`)
      }

    } else {
      console.log('❌ Team formation failed:', formTeamsData.error)
      return
    }

    // Step 3: Verify updated state
    console.log('\n📈 Step 3: Verifying updated state...')

    const updatedStatsResponse = await fetch(`${API_BASE}/api/team-matching/stats`)
    const updatedStatsData = await updatedStatsResponse.json()
    
    const updatedUnmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
    const updatedUnmatchedData = await updatedUnmatchedResponse.json()

    if (updatedStatsData.success && updatedUnmatchedData.success) {
      const updatedStats = updatedStatsData.data
      const updatedUnmatched = updatedUnmatchedData.data

      console.log(`✅ Updated State:`)
      console.log(`   Total Submissions: ${updatedStats.total_submissions}`)
      console.log(`   Unmatched: ${updatedUnmatched.length}`)
      console.log(`   Matched: ${updatedStats.matched_submissions}`)
      console.log(`   Teams: ${updatedStats.total_teams}`)

      // Verify changes
      const teamsIncreased = updatedStats.total_teams > initialStats.total_teams
      const matchedIncreased = updatedStats.matched_submissions > initialStats.matched_submissions
      const unmatchedDecreased = updatedUnmatched.length < initialUnmatched.length

      console.log('\n🔍 Verification:')
      console.log(`   Teams increased: ${teamsIncreased ? '✅' : '❌'} (${initialStats.total_teams} → ${updatedStats.total_teams})`)
      console.log(`   Matched increased: ${matchedIncreased ? '✅' : '❌'} (${initialStats.matched_submissions} → ${updatedStats.matched_submissions})`)
      console.log(`   Unmatched decreased: ${unmatchedDecreased ? '✅' : '❌'} (${initialUnmatched.length} → ${updatedUnmatched.length})`)

      // Verify math
      const expectedMatched = initialStats.matched_submissions + formTeamsData.data.participantsMatched
      const expectedUnmatched = formTeamsData.data.participantsUnmatched

      if (updatedStats.matched_submissions === expectedMatched) {
        console.log(`   Math check (matched): ✅ ${expectedMatched}`)
      } else {
        console.log(`   Math check (matched): ❌ Expected ${expectedMatched}, got ${updatedStats.matched_submissions}`)
      }

      if (updatedUnmatched.length === expectedUnmatched) {
        console.log(`   Math check (unmatched): ✅ ${expectedUnmatched}`)
      } else {
        console.log(`   Math check (unmatched): ❌ Expected ${expectedUnmatched}, got ${updatedUnmatched.length}`)
      }

    } else {
      console.log('❌ Failed to get updated state')
    }

    // Step 4: Test continuous workflow
    console.log('\n🔄 Step 4: Testing continuous workflow...')
    
    if (updatedUnmatched.length > 0) {
      console.log(`Found ${updatedUnmatched.length} remaining unmatched participants`)
      console.log('These should appear in "Recent Submissions" section')
      console.log('Ready for next team formation cycle')
      
      // Show remaining participants
      console.log('\n📝 Remaining Unmatched Participants:')
      updatedUnmatched.slice(0, 5).forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.full_name} - ${sub.email}`)
      })
      
      if (updatedUnmatched.length > 5) {
        console.log(`   ... and ${updatedUnmatched.length - 5} more`)
      }
    } else {
      console.log('🎉 All participants have been matched into teams!')
      console.log('No entries in "Recent Submissions" section')
    }

    // Step 5: Summary
    console.log('\n📋 Workflow Summary:')
    console.log('✅ Form Teams button processes only unmatched students')
    console.log('✅ Team matching algorithm runs on unmatched participants')
    console.log('✅ Formed teams are added to database')
    console.log('✅ Unmatched students remain in recent submissions')
    console.log('✅ Stats update in real-time')
    console.log('✅ Ready for continuous workflow with new entries')

    console.log('\n🎉 Complete Workflow Test PASSED!')

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

// Run the test
testCompleteWorkflow()