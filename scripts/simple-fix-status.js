#!/usr/bin/env node

/**
 * Simple Fix for Submission Status
 * 
 * This script directly updates submission statuses using raw SQL
 * to avoid any trigger or schema cache issues.
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

async function fixSubmissionStatuses() {
  console.log('🚀 Starting Simple Submission Status Fix...');
  console.log('===============================================');
  
  try {
    // First, let's check what we have
    console.log('\n📊 Checking current status...');
    
    const { data: statusCheck, error: statusError } = await supabase
      .from('team_matching_submissions')
      .select('status')
      .then(result => {
        if (result.error) return result;
        
        const distribution = {};
        result.data.forEach(item => {
          distribution[item.status] = (distribution[item.status] || 0) + 1;
        });
        
        return { data: distribution, error: null };
      });
    
    if (statusError) {
      console.error('❌ Error checking status:', statusError.message);
      return;
    }
    
    console.log('Current status distribution:');
    Object.entries(statusCheck).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Get submissions that need fixing
    console.log('\n🔍 Finding submissions that need status fix...');
    
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select(`
        submission_id,
        team_id,
        teams!inner(
          team_name
        ),
        team_matching_submissions!inner(
          id,
          full_name,
          status
        )
      `);
    
    if (teamError) {
      console.error('❌ Error getting team members:', teamError.message);
      return;
    }
    
    const needsUpdate = teamMembers.filter(member => 
      member.team_matching_submissions.status !== 'team_formed'
    );
    
    console.log(`Found ${needsUpdate.length} submissions that need status update`);
    
    if (needsUpdate.length === 0) {
      console.log('✅ All submissions already have correct status!');
      return;
    }
    
    console.log('\nSubmissions to update:');
    needsUpdate.forEach(member => {
      console.log(`  - ${member.team_matching_submissions.full_name} (${member.team_matching_submissions.status}) in team ${member.teams.team_name}`);
    });
    
    // Update each submission individually
    console.log('\n🔧 Updating submission statuses...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const member of needsUpdate) {
      const submissionId = member.submission_id;
      const name = member.team_matching_submissions.full_name;
      
      try {
        const { error: updateError } = await supabase
          .from('team_matching_submissions')
          .update({ status: 'team_formed' })
          .eq('id', submissionId);
        
        if (updateError) {
          console.error(`❌ Failed to update ${name}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated ${name} to team_formed`);
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error updating ${name}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Update Results:');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed to update: ${errorCount}`);
    
    // Final status check
    console.log('\n🔍 Final status check...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('team_matching_submissions')
      .select('status')
      .then(result => {
        if (result.error) return result;
        
        const distribution = {};
        result.data.forEach(item => {
          distribution[item.status] = (distribution[item.status] || 0) + 1;
        });
        
        return { data: distribution, error: null };
      });
    
    if (finalError) {
      console.error('❌ Error in final check:', finalError.message);
      return;
    }
    
    console.log('Final status distribution:');
    Object.entries(finalCheck).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    if (successCount > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log('============');
      console.log('✅ Submission statuses have been updated.');
      console.log('✅ Team analysis recalculation should now work properly.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test team formation through admin dashboard');
      console.log('2. Run team strength analysis recalculation');
      console.log('3. Verify that new team formations automatically update status');
    } else {
      console.log('\n⚠️  No updates were made.');
      console.log('This could mean:');
      console.log('- All statuses are already correct');
      console.log('- There are permission issues');
      console.log('- The database schema has changed');
    }
    
  } catch (err) {
    console.error('\n💥 Script failed:', err.message);
    console.error('Stack trace:', err.stack);
  }
}

// Run the script
if (require.main === module) {
  fixSubmissionStatuses();
}

module.exports = { fixSubmissionStatuses };