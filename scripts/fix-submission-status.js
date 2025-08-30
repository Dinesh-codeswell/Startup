#!/usr/bin/env node

/**
 * Fix Submission Status Script
 * 
 * This script fixes the issue where team formation through the admin dashboard
 * results in team_matching_submissions status remaining "pending_match" instead
 * of updating to "team_formed".
 * 
 * The script:
 * 1. Checks current submission status issues
 * 2. Fixes existing submission statuses
 * 3. Verifies the fix
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentStatus() {
  console.log('\n📊 Checking current submission status issues...');
  
  try {
    // Check submissions that should be 'team_formed' but aren't
    const { data: issues, error } = await supabase
      .from('team_matching_submissions')
      .select(`
        id,
        status,
        full_name,
        email
      `)
      .neq('status', 'team_formed');
    
    if (error) {
      console.error('❌ Error checking status:', error.message);
      return { totalIssues: 0, issues: [] };
    }
    
    // Now check which of these actually have team members
    const submissionIds = issues.map(issue => issue.id);
    
    if (submissionIds.length === 0) {
      console.log('✅ All submissions have team_formed status');
      return { totalIssues: 0, issues: [] };
    }
    
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select(`
        submission_id,
        team_id,
        teams!inner(
          team_name,
          created_at
        )
      `)
      .in('submission_id', submissionIds);
    
    if (teamError) {
      console.error('❌ Error checking team members:', teamError.message);
      return { totalIssues: 0, issues: [] };
    }
    
    // Filter issues to only those that actually have team members
    const actualIssues = issues.filter(issue => 
      teamMembers.some(member => member.submission_id === issue.id)
    );
    
    console.log(`Found ${actualIssues.length} submissions that need status fix`);
    
    if (actualIssues.length > 0) {
      console.log('\nSubmissions needing fix:');
      actualIssues.forEach(issue => {
        const teamMember = teamMembers.find(member => member.submission_id === issue.id);
        console.log(`  - ${issue.full_name} (${issue.status}) in team ${teamMember?.teams?.team_name || 'Unknown'}`);
      });
    }
    
    return { totalIssues: actualIssues.length, issues: actualIssues };
    
  } catch (err) {
    console.error('❌ Error checking current status:', err.message);
    return { totalIssues: 0, issues: [] };
  }
}

async function fixSubmissionStatuses() {
  console.log('\n🔧 Fixing submission statuses...');
  
  try {
    // Get all submission IDs that have team members but wrong status
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('submission_id');
    
    if (teamError) {
      console.error('❌ Error getting team members:', teamError.message);
      return false;
    }
    
    const submissionIds = teamMembers.map(member => member.submission_id);
    
    if (submissionIds.length === 0) {
      console.log('✅ No team members found, nothing to fix');
      return true;
    }
    
    // Update all submissions that have team members to 'team_formed'
      const { data, error } = await supabase
        .from('team_matching_submissions')
        .update({ status: 'team_formed' })
        .in('id', submissionIds)
        .neq('status', 'team_formed')
        .select('id, full_name, status');
        
    if (error) {
      console.error('❌ Failed to fix submission statuses:', error.message);
      return false;
    }
    
    console.log(`✅ Fixed ${data?.length || 0} submission statuses`);
    if (data && data.length > 0) {
      console.log('Updated submissions:');
      data.forEach(item => {
        console.log(`  - ${item.full_name}: ${item.status}`);
      });
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Error fixing submission statuses:', err.message);
    return false;
  }
}

async function verifyFix() {
  console.log('\n✅ Verifying the fix...');
  
  try {
    // Check status distribution
    const { data: allSubmissions, error } = await supabase
      .from('team_matching_submissions')
      .select('status');
    
    if (error) {
      console.error('❌ Error verifying fix:', error.message);
      return false;
    }
    
    const distribution = {};
    allSubmissions.forEach(item => {
      distribution[item.status] = (distribution[item.status] || 0) + 1;
    });
    
    console.log('\n📊 Current submission status distribution:');
    Object.entries(distribution).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check if any issues remain
    const { totalIssues } = await checkCurrentStatus();
    
    if (totalIssues === 0) {
      console.log('\n🎉 All submission statuses are now correct!');
      console.log('✅ Team analysis recalculation should now work properly.');
      return true;
    } else {
      console.log(`\n⚠️  ${totalIssues} issues still remain.`);
      return false;
    }
    
  } catch (err) {
    console.error('❌ Error verifying fix:', err.message);
    return false;
  }
}

async function installTriggers() {
  console.log('\n🔧 Installing database triggers...');
  
  const triggerSQL = `
    -- Create or replace the trigger function
    CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
    RETURNS TRIGGER AS $$
    BEGIN
        -- When a team member is inserted, update the corresponding submission status
        IF TG_OP = 'INSERT' THEN
            -- Update the submission status to 'team_formed'
            UPDATE team_matching_submissions 
            SET 
                status = 'team_formed',
                updated_at = NOW(),
                matched_at = COALESCE(matched_at, NOW())
            WHERE id = NEW.submission_id
              AND status != 'team_formed';
            
            RETURN NEW;
        END IF;
        
        -- When a team member is deleted, optionally revert submission status
        IF TG_OP = 'DELETE' THEN
            -- Check if this submission is still part of any other team
            IF NOT EXISTS (
                SELECT 1 FROM team_members 
                WHERE submission_id = OLD.submission_id 
                  AND team_id != OLD.team_id
            ) THEN
                -- If not part of any other team, revert status to 'pending_match'
                UPDATE team_matching_submissions 
                SET 
                    status = 'pending_match',
                    updated_at = NOW()
                WHERE id = OLD.submission_id;
            END IF;
            
            RETURN OLD;
        END IF;
        
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_update_submission_status ON team_members;
    
    -- Create trigger on team_members table for both INSERT and DELETE
    CREATE TRIGGER trigger_update_submission_status
        AFTER INSERT OR DELETE ON team_members
        FOR EACH ROW
        EXECUTE FUNCTION update_submission_status_on_team_assignment();
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    
    if (error) {
      console.warn('⚠️  Could not install triggers via RPC:', error.message);
      console.log('ℹ️  Triggers should be installed manually in Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ Database triggers installed successfully');
    return true;
    
  } catch (err) {
    console.warn('⚠️  Could not install triggers:', err.message);
    console.log('ℹ️  Triggers should be installed manually in Supabase SQL Editor');
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Submission Status Fix...');
  console.log('=====================================');
  
  // Check current status
  const { totalIssues } = await checkCurrentStatus();
  
  if (totalIssues === 0) {
    console.log('\n✅ No submission status issues found!');
    console.log('All submissions with team members already have "team_formed" status.');
    
    // Still try to install triggers for future team formations
    await installTriggers();
    return;
  }
  
  console.log(`\n🔧 Found ${totalIssues} submission(s) that need status fix.`);
  console.log('Proceeding with the fix...');
  
  // Fix the submission statuses
  const fixSuccess = await fixSubmissionStatuses();
  
  if (!fixSuccess) {
    console.error('\n❌ Failed to fix submission statuses.');
    console.error('Please check the database connection and permissions.');
    process.exit(1);
  }
  
  // Install triggers for future team formations
  await installTriggers();
  
  // Verify the fix
  const verifySuccess = await verifyFix();
  
  if (verifySuccess) {
    console.log('\n🎉 SUCCESS!');
    console.log('============');
    console.log('✅ Submission status issue has been resolved.');
    console.log('✅ Team formation through admin dashboard will now work correctly.');
    console.log('✅ Team analysis recalculation should now work properly.');
    console.log('');
    console.log('You can now:');
    console.log('1. Form teams through the admin dashboard');
    console.log('2. Run team strength analysis recalculation');
    console.log('3. View updated team analysis results');
  } else {
    console.log('\n⚠️  Fix completed but some issues may remain.');
    console.log('Please check the database manually or contact support.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('\n💥 Script failed:', err.message);
    process.exit(1);
  });
}

module.exports = { main, checkCurrentStatus, fixSubmissionStatuses, verifyFix };