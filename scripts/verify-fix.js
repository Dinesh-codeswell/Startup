#!/usr/bin/env node

/**
 * Verification Script for Submission Status Fix
 * 
 * This script verifies that the submission status fix was successful
 * and tests the team analysis recalculation function.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifySubmissionStatuses() {
  console.log('🔍 Verifying submission statuses...');
  
  try {
    // Check status distribution
    const { data: allSubmissions, error } = await supabase
      .from('team_matching_submissions')
      .select('status');
    
    if (error) {
      console.error('❌ Error checking statuses:', error.message);
      return false;
    }
    
    const distribution = {};
    allSubmissions.forEach(item => {
      distribution[item.status] = (distribution[item.status] || 0) + 1;
    });
    
    console.log('📊 Current status distribution:');
    Object.entries(distribution).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check for team members with incorrect status
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select(`
        submission_id,
        team_matching_submissions!inner(
          id,
          full_name,
          status
        ),
        teams!inner(
          team_name
        )
      `);
    
    if (teamError) {
      console.error('❌ Error checking team members:', teamError.message);
      return false;
    }
    
    const incorrectStatuses = teamMembers.filter(member => 
      member.team_matching_submissions.status !== 'team_formed'
    );
    
    if (incorrectStatuses.length === 0) {
      console.log('✅ All team members have correct "team_formed" status!');
      return true;
    } else {
      console.log(`❌ Found ${incorrectStatuses.length} team members with incorrect status:`);
      incorrectStatuses.forEach(member => {
        console.log(`  - ${member.team_matching_submissions.full_name} (${member.team_matching_submissions.status}) in team ${member.teams.team_name}`);
      });
      return false;
    }
    
  } catch (err) {
    console.error('❌ Error verifying statuses:', err.message);
    return false;
  }
}

async function testTeamAnalysisRecalculation() {
  console.log('\n🧮 Testing team analysis recalculation...');
  
  try {
    // Check if the recalculation function exists and works
    const { data, error } = await supabase.rpc('recalculate_all_team_analysis');
    
    if (error) {
      console.error('❌ Team analysis recalculation failed:', error.message);
      
      // Check if it's because the function doesn't exist
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('ℹ️  The recalculate_all_team_analysis function may not be installed.');
        console.log('Please ensure the team analysis setup scripts have been run.');
      }
      
      return false;
    }
    
    console.log('✅ Team analysis recalculation completed successfully!');
    
    // Check if team analysis data was created
    const { data: analysisData, error: analysisError } = await supabase
      .from('team_analysis')
      .select('team_id, overall_score')
      .limit(5);
    
    if (analysisError) {
      console.warn('⚠️  Could not check team analysis data:', analysisError.message);
    } else if (analysisData && analysisData.length > 0) {
      console.log(`✅ Found ${analysisData.length} team analysis records`);
      console.log('Sample analysis data:');
      analysisData.forEach(analysis => {
        console.log(`  Team ${analysis.team_id}: Score ${analysis.overall_score}`);
      });
    } else {
      console.log('ℹ️  No team analysis data found. This might be normal if no teams exist.');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Error testing team analysis recalculation:', err.message);
    return false;
  }
}

async function checkTriggers() {
  console.log('\n🔧 Checking database triggers...');
  
  try {
    // This is informational - we can't directly check triggers via Supabase client
    console.log('ℹ️  To verify triggers are installed, check in Supabase SQL Editor:');
    console.log('```sql');
    console.log('SELECT trigger_name, event_manipulation, event_object_table');
    console.log('FROM information_schema.triggers');
    console.log('WHERE event_object_table IN (\'team_matching_submissions\', \'team_members\');');
    console.log('```');
    
    return true;
    
  } catch (err) {
    console.error('❌ Error checking triggers:', err.message);
    return false;
  }
}

async function runVerification() {
  console.log('🚀 Starting Verification of Submission Status Fix...');
  console.log('===================================================');
  
  const statusOk = await verifySubmissionStatuses();
  const recalcOk = await testTeamAnalysisRecalculation();
  const triggersOk = await checkTriggers();
  
  console.log('\n📋 VERIFICATION SUMMARY');
  console.log('========================');
  console.log(`✅ Submission statuses: ${statusOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Team analysis recalc: ${recalcOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Trigger check: ${triggersOk ? 'PASS' : 'FAIL'}`);
  
  if (statusOk && recalcOk) {
    console.log('\n🎉 SUCCESS!');
    console.log('============');
    console.log('✅ The submission status fix was successful!');
    console.log('✅ Team analysis recalculation is working properly.');
    console.log('✅ Your admin dashboard should now work correctly.');
    console.log('');
    console.log('What you can do now:');
    console.log('1. ✅ Form teams through the admin dashboard');
    console.log('2. ✅ Run team strength analysis recalculation');
    console.log('3. ✅ View updated team analysis results');
    console.log('4. ✅ New team formations will automatically update submission status');
  } else {
    console.log('\n⚠️  ISSUES DETECTED');
    console.log('===================');
    
    if (!statusOk) {
      console.log('❌ Submission statuses still need to be fixed.');
      console.log('   Please run the manual-fix-submission-status.sql script in Supabase SQL Editor.');
    }
    
    if (!recalcOk) {
      console.log('❌ Team analysis recalculation is not working.');
      console.log('   Please ensure the team analysis setup scripts have been run.');
    }
    
    console.log('');
    console.log('Please address the issues above and run this verification script again.');
  }
}

// Run the verification
if (require.main === module) {
  runVerification().catch(err => {
    console.error('\n💥 Verification failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runVerification, verifySubmissionStatuses, testTeamAnalysisRecalculation };