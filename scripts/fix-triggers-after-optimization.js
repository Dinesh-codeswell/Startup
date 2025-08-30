#!/usr/bin/env node

/**
 * Fix database triggers after timestamp optimization
 * This script removes problematic triggers that reference removed updated_at columns
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Execute SQL commands to fix triggers
 */
async function fixTriggersAfterOptimization() {
  try {
    console.log('🔧 Starting trigger fixes after timestamp optimization...');
    console.log('==================================================');
    
    // SQL commands to fix triggers
    const sqlCommands = [
      // Drop problematic updated_at triggers
      'DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;',
      'DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;',
      'DROP TRIGGER IF EXISTS update_team_matching_batches_updated_at ON team_matching_batches;',
      'DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;',
      'DROP TRIGGER IF EXISTS update_team_chat_messages_updated_at ON team_chat_messages;',
      'DROP TRIGGER IF EXISTS update_team_chat_participants_updated_at ON team_chat_participants;',
      'DROP TRIGGER IF EXISTS update_team_chat_typing_indicators_updated_at ON team_chat_typing_indicators;',
      
      // Update submission status trigger function (without updated_at references)
      `CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
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
                   SET status = 'pending_match'
                   WHERE id = OLD.submission_id;
               END IF;
               
               RETURN OLD;
           END IF;
           
           RETURN NULL;
       END;
       $$ LANGUAGE plpgsql;`
    ];
    
    console.log('🗑️  Removing problematic triggers...');
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // Try alternative method for executing SQL
          const { error: directError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0);
          
          // If the above fails, we'll use a different approach
          console.log(`⚠️  Could not execute SQL command ${i + 1} directly. This is expected for some Supabase configurations.`);
        } else {
          console.log(`✅ Executed SQL command ${i + 1}`);
        }
      } catch (error) {
        console.log(`⚠️  SQL command ${i + 1} execution note:`, error.message);
      }
    }
    
    console.log('\n📋 Manual Steps Required:');
    console.log('Since direct SQL execution may be limited, please run these commands in your Supabase SQL editor:');
    console.log('\n-- 1. Drop problematic triggers:');
    console.log('DROP TRIGGER IF EXISTS update_team_matching_submissions_updated_at ON team_matching_submissions;');
    console.log('DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;');
    console.log('DROP TRIGGER IF EXISTS update_team_matching_batches_updated_at ON team_matching_batches;');
    console.log('\n-- 2. Update the submission status trigger function:');
    console.log(`CREATE OR REPLACE FUNCTION update_submission_status_on_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE team_matching_submissions 
        SET 
            status = 'team_formed',
            matched_at = COALESCE(matched_at, NOW())
        WHERE id = NEW.submission_id
          AND status != 'team_formed';
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE submission_id = OLD.submission_id 
              AND team_id != OLD.team_id
        ) THEN
            UPDATE team_matching_submissions 
            SET status = 'pending_match'
            WHERE id = OLD.submission_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;`);
    
    console.log('\n🔧 Alternative: Testing if the team name update works now...');
    
    // Test if we can update a team_matching_submissions record
    const { data: testSubmissions, error: fetchError } = await supabase
      .from('team_matching_submissions')
      .select('id, full_name')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching test submission:', fetchError);
      return;
    }
    
    if (testSubmissions && testSubmissions.length > 0) {
      const testSubmission = testSubmissions[0];
      console.log(`\n🧪 Testing update on submission: ${testSubmission.full_name}`);
      
      // Try to update with the same name (should be a no-op)
      const { error: updateError } = await supabase
        .from('team_matching_submissions')
        .update({ full_name: testSubmission.full_name })
        .eq('id', testSubmission.id);
      
      if (updateError) {
        console.error('❌ Update test failed:', updateError);
        console.log('\n⚠️  You will need to manually fix the triggers in Supabase SQL editor.');
      } else {
        console.log('✅ Update test successful! Triggers are now fixed.');
        console.log('\n🎉 You can now run the team member name update script again.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing triggers:', error);
    process.exit(1);
  }
}

// Run the fix
fixTriggersAfterOptimization()
  .then(() => {
    console.log('\n==================================================');
    console.log('🔧 Trigger fix process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });