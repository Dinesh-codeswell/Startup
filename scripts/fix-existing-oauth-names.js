const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract and parse full name into first and last name
 */
function parseFullName(fullName) {
  if (!fullName || fullName.trim() === '') {
    return { firstName: '', lastName: '' };
  }
  
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return { firstName, lastName };
}

/**
 * Fix OAuth user names by extracting full names from auth.users metadata
 */
async function fixOAuthUserNames() {
  try {
    console.log('🔍 Fetching users with OAuth metadata...');
    
    // Get all users who have OAuth metadata with full names but incomplete profile names
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    console.log(`📊 Found ${users.users.length} total users`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users.users) {
      try {
        // Check if user has OAuth metadata with full name
        const fullNameFromOAuth = user.user_metadata?.full_name || 
                                 user.user_metadata?.name || 
                                 user.user_metadata?.display_name;
        
        if (!fullNameFromOAuth) {
          skippedCount++;
          continue;
        }
        
        // Get current profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.log(`⚠️  No profile found for user ${user.email}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Parse the full name
        const { firstName, lastName } = parseFullName(fullNameFromOAuth);
        
        // Check if we need to update (if current names are incomplete or different)
        const needsUpdate = 
          !profile.first_name || 
          profile.first_name.trim() === '' ||
          profile.first_name === user.email?.split('@')[0] ||
          (firstName && firstName !== profile.first_name) ||
          (lastName && lastName !== profile.last_name);
        
        if (!needsUpdate) {
          console.log(`✅ User ${user.email} already has correct names`);
          skippedCount++;
          continue;
        }
        
        // Update the profile with parsed names
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName || profile.first_name,
            last_name: lastName || profile.last_name || ''
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`❌ Error updating profile for ${user.email}:`, updateError);
          continue;
        }
        
        console.log(`✅ Updated ${user.email}: "${fullNameFromOAuth}" -> "${firstName}" + "${lastName}"`);
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users`);
    console.log(`📊 Total processed: ${users.users.length} users`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 OAuth user names have been successfully updated!');
      console.log('\n📋 Next steps:');
      console.log('1. Test Google OAuth signup with a new account');
      console.log('2. Verify that full names are properly split into first_name and last_name');
      console.log('3. Check existing user profiles to confirm updates');
    } else {
      console.log('\n✨ All OAuth users already have correct names!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing OAuth user names:', error);
    process.exit(1);
  }
}

// Run the fix
fixOAuthUserNames();