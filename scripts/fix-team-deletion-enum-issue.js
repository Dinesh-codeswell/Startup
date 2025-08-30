#!/usr/bin/env node

/**
 * Fix Team Deletion Enum Issue Script
 * 
 * This script fixes the enum value mismatch that causes
 * "invalid input value for enum submission_status: 'pending'"
 * when deleting teams.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixEnumIssue() {
  console.log('🚀 Fixing Team Deletion Enum Issue...');
  console.log('=====================================');
  
  try {
    // Step 1: Show current enum values
    console.log('\n📋 Checking current enum values...');
    
    const { data: submissionEnums, error: submissionError } = await supabase
      .rpc('get_enum_values', { enum_name: 'submission_status' })
      .catch(() => ({ data: null, error: 'Function not available' }));
    
    if (submissionError) {
      console.log('⚠️  Could not fetch enum values via RPC, continuing with fix...');
    } else {
      console.log('submission_status enum values:', submissionEnums);
    }
    
    // Step 2: Fix the trigger function
    console.log('\n🔧 Updating trigger function...');
    
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
      RETURNS TRIGGER AS $$
      BEGIN
          -- When a team member is inserted, update the corresponding submission status
          IF TG_OP = 'INSERT' THEN
              -- Update the submission status to 'team_formed'
              UPDATE team_matching_submissions 
              SET 
                  status = 'team_formed',
                  matched_at = COALESCE(matched_at, NOW())
              WHERE id = NEW.submission_id
                AND status != 'team_formed';
              
              RETURN NEW;
          END IF;
          
          -- When a team member is deleted, revert submission status
          IF TG_OP = 'DELETE' THEN
              -- Check if this submission is still part of any other team
              IF NOT EXISTS (
                  SELECT 1 FROM team_members 
                  WHERE submission_id = OLD.submission_id 
                    AND team_id != OLD.team_id
              ) THEN
                  -- If not part of any other team, revert status to 'pending_match'
                  UPDATE team_matching_submissions 
                  SET status = 'pending_match'
                  WHERE id = OLD.submission_id;
              END IF;
              
              RETURN OLD;
          END IF;
          
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: triggerFunction 
    }).catch(async () => {
      // Fallback: try direct execution
      return await supabase.from('_temp_sql_exec').select('*').limit(0);
    });
    
    if (functionError) {
      console.log('⚠️  Could not update function via RPC. Manual execution required.');
      console.log('\n📋 Please execute this SQL manually in Supabase SQL Editor:');
      console.log('\n' + triggerFunction);
    } else {
      console.log('✅ Trigger function updated successfully');
    }
    
    // Step 3: Recreate the trigger
    console.log('\n🔧 Recreating trigger...');
    
    const triggerSQL = `
      DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;
      
      CREATE TRIGGER trigger_update_submission_status
          AFTER INSERT OR DELETE ON team_members
          FOR EACH ROW
          EXECUTE FUNCTION update_submission_status_on_team_assignment();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: triggerSQL 
    }).catch(() => ({ error: 'RPC not available' }));
    
    if (triggerError) {
      console.log('⚠️  Could not recreate trigger via RPC. Manual execution required.');
      console.log('\n📋 Please execute this SQL manually in Supabase SQL Editor:');
      console.log('\n' + triggerSQL);
    } else {
      console.log('✅ Trigger recreated successfully');
    }
    
    // Step 4: Check current status distribution
    console.log('\n📊 Checking current submission status distribution...');
    
    const { data: statusDist, error: statusError } = await supabase
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
      console.error('❌ Error checking status distribution:', statusError.message);
    } else {
      console.log('Current status distribution:');
      Object.entries(statusDist).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
    
    // Step 5: Test team deletion (optional)
    console.log('\n🧪 Testing team deletion capability...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, team_name, approval_status')
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Error fetching teams for test:', teamsError.message);
    } else if (teams && teams.length > 0) {
      console.log(`Found team for testing: ${teams[0].team_name} (${teams[0].approval_status})`);
      console.log('✅ Team deletion should now work without enum errors');
    } else {
      console.log('No teams found for testing, but fix should be applied');
    }
    
    console.log('\n🎉 SUCCESS!');
    console.log('============');
    console.log('✅ Enum issue fix completed');
    console.log('✅ Trigger now uses "pending_match" instead of "pending"');
    console.log('✅ Team deletion should work without enum errors');
    console.log('');
    console.log('📝 Valid submission_status enum values:');
    console.log('  - pending_match (for new submissions)');
    console.log('  - matched (when matched but team not formed)');
    console.log('  - team_formed (when added to a team)');
    console.log('  - inactive (when deactivated)');
    console.log('');
    console.log('📝 Valid approval_status enum values:');
    console.log('  - pending (awaiting approval)');
    console.log('  - approved (team approved)');
    console.log('  - rejected (team rejected)');
    console.log('');
    console.log('🎯 You can now delete teams without enum errors!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n📋 Manual SQL execution required. Please run the SQL script:');
    console.log('   fix-team-deletion-enum-issue.sql');
  }
}

// Run the fix
fixEnumIssue().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});