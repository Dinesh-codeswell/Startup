#!/usr/bin/env node

/**
 * Quick verification script to check dashboard stats accuracy
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function verifyDashboardStats() {
  console.log('🔍 Verifying Dashboard Stats Accuracy...\n')

  try {
    // Get stats
    const statsResponse = await fetch(`${API_BASE}/api/team-matching/stats`)
    const statsData = await statsResponse.json()
    
    // Get unmatched submissions
    const unmatchedResponse = await fetch(`${API_BASE}/api/team-matching/unmatched-submissions`)
    const unmatchedData = await unmatchedResponse.json()

    if (statsData.success && unmatchedData.success) {
      const stats = statsData.data
      const actualUnmatched = unmatchedData.data.length
      
      console.log('📊 Current Stats:')
      console.log(`   Total Submissions: ${stats.total_submissions}`)
      console.log(`   Pending (Stats API): ${stats.pending_submissions}`)
      console.log(`   Actual Unmatched: ${actualUnmatched}`)
      console.log(`   Matched: ${stats.matched_submissions}`)
      console.log(`   Teams: ${stats.total_teams}`)
      
      console.log('\n🔍 Verification:')
      
      // Check if pending matches actual unmatched
      if (stats.pending_submissions === actualUnmatched) {
        console.log('✅ Pending count matches actual unmatched submissions')
      } else {
        console.log(`❌ Mismatch: Stats shows ${stats.pending_submissions} pending, but ${actualUnmatched} are actually unmatched`)
      }
      
      // Check if total = matched + pending
      const calculatedTotal = stats.matched_submissions + actualUnmatched
      if (stats.total_submissions === calculatedTotal) {
        console.log('✅ Total submissions = matched + unmatched')
      } else {
        console.log(`❌ Math error: ${stats.total_submissions} total ≠ ${stats.matched_submissions} matched + ${actualUnmatched} unmatched = ${calculatedTotal}`)
      }
      
      console.log('\n📝 Recent Submissions (Unmatched):')
      if (actualUnmatched > 0) {
        unmatchedData.data.slice(0, 5).forEach((sub, i) => {
          console.log(`   ${i + 1}. ${sub.full_name} - ${sub.email} (${sub.college_name})`)
        })
        if (actualUnmatched > 5) {
          console.log(`   ... and ${actualUnmatched - 5} more`)
        }
      } else {
        console.log('   No unmatched submissions found')
      }
      
    } else {
      console.log('❌ Failed to fetch data')
      if (!statsData.success) console.log('Stats error:', statsData.error)
      if (!unmatchedData.success) console.log('Unmatched error:', unmatchedData.error)
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

// Run verification
verifyDashboardStats()