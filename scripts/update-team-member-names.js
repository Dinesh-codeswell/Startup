const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update team member names in team_matching_submissions based on updated profile names
 */
async function updateTeamMemberNames() {
  try {
    console.log('🔍 Finding team members with outdated names...');
    
    // Step 1: Get all team_formed submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('team_matching_submissions')
      .select('id, user_id, full_name, email')
      .eq('status', 'team_formed');
    
    if (submissionsError) {
      throw submissionsError;
    }
    
    if (!submissions || submissions.length === 0) {
      console.log('ℹ️  No team members found with team_formed status');
      return;
    }
    
    console.log(`📊 Found ${submissions.length} team members to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const submission of submissions) {
      try {
        // Step 2: Get profile for this user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', submission.user_id)
          .single();
        
        if (profileError || !profile) {
          console.log(`⚠️  ${submission.email}: No profile found, skipping`);
          skippedCount++;
          continue;
        }
        
        // Step 3: Get team information for this submission
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select(`
            team_id,
            teams(
              team_name
            )
          `)
          .eq('submission_id', submission.id)
          .single();
        
        const teamName = teamMember?.teams?.team_name || 'Unknown Team';
        
        const currentFullName = submission.full_name;
        
        // Construct the updated full name from profile
        const updatedFullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        // Skip if names are already the same
        if (currentFullName === updatedFullName) {
          console.log(`✅ ${submission.email}: Name already up to date ("${currentFullName}")`);
          skippedCount++;
          continue;
        }
        
        // Skip if the updated name would be empty or just a space
        if (!updatedFullName || updatedFullName.trim() === '') {
          console.log(`⚠️  ${submission.email}: Skipping - no valid name in profile`);
          skippedCount++;
          continue;
        }
        
        // Update the team_matching_submissions record
        const { error: updateError } = await supabase
          .from('team_matching_submissions')
          .update({
            full_name: updatedFullName
          })
          .eq('id', submission.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${submission.email}:`, updateError);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Updated ${submission.email} in "${teamName}": "${currentFullName}" → "${updatedFullName}"`);
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing member ${submission.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Updated: ${updatedCount} team members`);
    console.log(`⏭️  Skipped: ${skippedCount} team members`);
    console.log(`❌ Errors: ${errorCount} team members`);
    console.log(`📊 Total checked: ${submissions.length} team members`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Team member names have been successfully updated!');
      console.log('\n📋 Next steps:');
      console.log('1. Check team dashboards to verify updated names are displayed');
      console.log('2. Verify team chat displays show correct member names');
      console.log('3. Test team formation process with new users to ensure names sync properly');
    } else {
      console.log('\n✨ All team member names are already up to date!');
    }
    
  } catch (error) {
    console.error('❌ Error updating team member names:', error);
    process.exit(1);
  }
}

/**
 * Update team chat participant names based on updated profiles
 */
async function updateTeamChatParticipantNames() {
  try {
    console.log('\n🔍 Finding team chat participants with outdated names...');
    
    // Check if team_chat_participants table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('team_chat_participants')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.log('ℹ️  Team chat participants table not found, skipping chat name updates');
      return;
    }
    
    // Get all chat participants
    const { data: participants, error: fetchError } = await supabase
      .from('team_chat_participants')
      .select('id, user_id, team_id, display_name');
    
    if (fetchError) {
      console.log('ℹ️  Could not fetch team chat participants, skipping chat name updates');
      return;
    }
    
    if (!participants || participants.length === 0) {
      console.log('ℹ️  No team chat participants found');
      return;
    }
    
    console.log(`📊 Found ${participants.length} chat participants to check`);
    
    let chatUpdatedCount = 0;
    let chatSkippedCount = 0;
    let chatErrorCount = 0;
    
    for (const participant of participants) {
      try {
        // Get profile for this user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', participant.user_id)
          .single();
        
        if (profileError || !profile) {
          console.log(`⚠️  Chat participant ${participant.user_id}: No profile found, skipping`);
          chatSkippedCount++;
          continue;
        }
        
        const currentDisplayName = participant.display_name;
        
        // Construct the updated display name from profile
        const updatedDisplayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        // Skip if names are already the same
        if (currentDisplayName === updatedDisplayName) {
          chatSkippedCount++;
          continue;
        }
        
        // Skip if the updated name would be empty
        if (!updatedDisplayName || updatedDisplayName.trim() === '') {
          console.log(`⚠️  ${profile.email}: Skipping chat participant - no valid name in profile`);
          chatSkippedCount++;
          continue;
        }
        
        // Update the team_chat_participants record
        const { error: updateError } = await supabase
          .from('team_chat_participants')
          .update({
            display_name: updatedDisplayName
          })
          .eq('id', participant.id);
        
        if (updateError) {
          console.error(`❌ Error updating chat participant ${profile.email}:`, updateError);
          chatErrorCount++;
          continue;
        }
        
        console.log(`✅ Updated chat participant ${profile.email}: "${currentDisplayName}" → "${updatedDisplayName}"`);
        chatUpdatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing chat participant:`, error);
        chatErrorCount++;
      }
    }
    
    console.log('\n📈 Chat Participants Summary:');
    console.log(`✅ Updated: ${chatUpdatedCount} chat participants`);
    console.log(`⏭️  Skipped: ${chatSkippedCount} chat participants`);
    console.log(`❌ Errors: ${chatErrorCount} chat participants`);
    
  } catch (error) {
    console.error('❌ Error updating team chat participant names:', error);
  }
}

// Run both updates
async function runAllUpdates() {
  console.log('🚀 Starting team member name updates...');
  console.log('==================================================');
  
  await updateTeamMemberNames();
  await updateTeamChatParticipantNames();
  
  console.log('\n==================================================');
  console.log('🎉 All team member name updates completed!');
}

// Execute the updates
runAllUpdates();