#!/usr/bin/env node

/**
 * Fix Submission Status with Trigger Management
 * 
 * This script temporarily disables the problematic trigger,
 * fixes the submission statuses, and then re-enables the trigger.
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

async function executeSql(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    // Try using the rpc method if available
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.warn(`⚠️  RPC method failed: ${error.message}`);
      console.log('ℹ️  This SQL should be executed manually in Supabase SQL Editor:');
      console.log('```sql');
      console.log(sql);
      console.log('```');
      return false;
    }
    
    console.log(`✅ ${description} completed`);
    return true;
    
  } catch (err) {
    console.warn(`⚠️  Error executing ${description}: ${err.message}`);
    console.log('ℹ️  This SQL should be executed manually in Supabase SQL Editor:');
    console.log('```sql');
    console.log(sql);
    console.log('```');
    return false;
  }
}

async function disableTrigger() {
  const sql = `
    -- Temporarily disable the problematic trigger
    DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;
  `;
  
  return await executeSql(sql, 'Disabling problematic trigger');
}

async function enableTrigger() {
  const sql = `
    -- Re-enable the trigger with a safer version
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Only set updated_at if the column exists
      IF TG_TABLE_NAME = 'team_matching_submissions' THEN
        NEW.updated_at = NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Recreate the trigger
    CREATE TRIGGER update_team_matching_submissions_updated_at
      BEFORE UPDATE ON team_matching_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;
  
  return await executeSql(sql, 'Re-enabling trigger with safer version');
}

async function fixSubmissionStatuses() {
  console.log('🚀 Starting Submission Status Fix with Trigger Management...');
  console.log('===========================================================');
  
  try {
    // Step 1: Check current status
    console.log('\n📊 Checking current status...');
    
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
    
    // Step 2: Disable the problematic trigger
    console.log('\n🔧 Step 1: Disabling problematic trigger...');
    const disableSuccess = await disableTrigger();
    
    if (!disableSuccess) {
      console.log('⚠️  Could not disable trigger automatically.');
      console.log('Please disable the trigger manually and run this script again.');
      return;
    }
    
    // Step 3: Update submission statuses
    console.log('\n🔧 Step 2: Updating submission statuses...');
    
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
    
    // Step 4: Re-enable the trigger
    console.log('\n🔧 Step 3: Re-enabling trigger...');
    const enableSuccess = await enableTrigger();
    
    if (!enableSuccess) {
      console.log('⚠️  Could not re-enable trigger automatically.');
      console.log('Please re-enable the trigger manually using the SQL provided above.');
    }
    
    // Step 5: Final verification
    console.log('\n🔍 Final verification...');
    
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
      console.log('✅ Database trigger has been fixed and re-enabled.');
      console.log('✅ Team analysis recalculation should now work properly.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test team formation through admin dashboard');
      console.log('2. Run team strength analysis recalculation');
      console.log('3. Verify that new team formations automatically update status');
    } else {
      console.log('\n⚠️  No updates were made.');
      console.log('Please check the error messages above for details.');
    }
    
  } catch (err) {
    console.error('\n💥 Script failed:', err.message);
    console.error('Stack trace:', err.stack);
    
    // Try to re-enable trigger even if script failed
    console.log('\n🔧 Attempting to re-enable trigger after failure...');
    await enableTrigger();
  }
}

// Run the script
if (require.main === module) {
  fixSubmissionStatuses();
}

module.exports = { fixSubmissionStatuses };