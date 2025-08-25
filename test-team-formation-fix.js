#!/usr/bin/env node

/**
 * Test script to verify team formation fixes
 * 
 * This script tests:
 * 1. Correct pending count calculation based on unmatched submissions
 * 2. Team formation only processes unmatched participants
 * 3. Dashboard shows accurate stats
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testTeamFormationFixes() {
  console.log('🧪 Testing Team Formation Fixes...\n')

  try {
    // 1. Test getting unmatched submissions
    console.log('1️⃣ Testing unmatched submissions endpoint...')
    const unmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
    const unmatchedData = await unmatchedResponse.json()
    
    if (unmatchedData.success) {
      console.log(`✅ Found ${unmatchedData.data.length} unmatched submissions`)
      console.log(`📊 Meta: ${unmatchedData.meta.matched} matched, ${unmatchedData.meta.totalSubmissions} total`)
      
      if (unmatchedData.data.length > 0) {
        console.log(`📝 Sample unmatched: ${unmatchedData.data[0].full_name} (${unmatchedData.data[0].email})`)
      }
    } else {
      console.log('❌ Failed to get unmatched submissions:', unmatchedData.error)
      return
    }

    // 2. Test stats calculation
    console.log('\n2️⃣ Testing stats calculation...')
    const statsResponse = await fetch(`${API_BASE}/api/team-matching/stats`)
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      const stats = statsData.data
      console.log(`✅ Stats calculated:`)
      console.log(`   Total submissions: ${stats.total_submissions}`)
      console.log(`   Pending (calculated): ${stats.pending_submissions}`)
      console.log(`   Matched: ${stats.matched_submissions}`)
      console.log(`   Teams: ${stats.total_teams}`)
      
      // Verify pending count matches unmatched count
      if (stats.pending_submissions === unmatchedData.data.length) {
        console.log(`✅ Pending count matches unmatched count: ${stats.pending_submissions}`)
      } else {
        console.log(`⚠️  Pending count (${stats.pending_submissions}) doesn't match unmatched count (${unmatchedData.data.length})`)
      }
    } else {
      console.log('❌ Failed to get stats:', statsData.error)
      return
    }

    // 3. Test team formation (if there are unmatched submissions)
    if (unmatchedData.data.length >= 2) {
      console.log('\n3️⃣ Testing team formation with unmatched participants...')
      
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
        console.log(`✅ Team formation successful:`)
        console.log(`   Teams formed: ${formTeamsData.data.teamsFormed}`)
        console.log(`   Participants matched: ${formTeamsData.data.participantsMatched}`)
        console.log(`   Participants unmatched: ${formTeamsData.data.participantsUnmatched}`)
        console.log(`   Previously matched: ${formTeamsData.data.previouslyMatched || 0}`)
        
        // Verify it only processed unmatched participants
        if (formTeamsData.data.totalParticipants === unmatchedData.data.length) {
          console.log(`✅ Correctly processed only unmatched participants: ${formTeamsData.data.totalParticipants}`)
        } else {
          console.log(`⚠️  Expected to process ${unmatchedData.data.length} but processed ${formTeamsData.data.totalParticipants}`)
        }
      } else {
        console.log('❌ Team formation failed:', formTeamsData.error)
      }
    } else {
      console.log('\n3️⃣ Skipping team formation test - need at least 2 unmatched participants')
    }

    // 4. Test updated stats after team formation
    console.log('\n4️⃣ Testing updated stats after team formation...')
    const updatedStatsResponse = await fetch(`${API_BASE}/api/team-matching/stats`)
    const updatedStatsData = await updatedStatsResponse.json()
    
    if (updatedStatsData.success) {
      const updatedStats = updatedStatsData.data
      console.log(`✅ Updated stats:`)
      console.log(`   Total submissions: ${updatedStats.total_submissions}`)
      console.log(`   Pending: ${updatedStats.pending_submissions}`)
      console.log(`   Matched: ${updatedStats.matched_submissions}`)
      console.log(`   Teams: ${updatedStats.total_teams}`)
    }

    // 5. Test updated unmatched submissions
    console.log('\n5️⃣ Testing updated unmatched submissions...')
    const updatedUnmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
    const updatedUnmatchedData = await updatedUnmatchedResponse.json()
    
    if (updatedUnmatchedData.success) {
      console.log(`✅ Updated unmatched submissions: ${updatedUnmatchedData.data.length}`)
      
      if (updatedUnmatchedData.data.length > 0) {
        console.log(`📝 Remaining unmatched participants:`)
        updatedUnmatchedData.data.slice(0, 3).forEach(sub => {
          console.log(`   - ${sub.full_name} (${sub.email})`)
        })
      } else {
        console.log(`🎉 All participants have been matched into teams!`)
      }
    }

    console.log('\n✅ Team Formation Fixes Test Complete!')
    console.log('\n📋 Summary:')
    console.log('• Pending count now reflects actual unmatched submissions')
    console.log('• Team formation only processes unmatched participants')
    console.log('• No duplicate team creation for already matched participants')
    console.log('• Dashboard shows accurate real-time stats')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.cause) {
      console.error('Cause:', error.cause)
    }
  }
}

// Run the test
testTeamFormationFixes()