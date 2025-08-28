require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableInfo() {
  try {
    // Try different request_type values to see which ones work
    const testValues = ['leave_team', 'switch_team', 'dissolve_team', 'join_team', 'create_team'];
    
    for (const requestType of testValues) {
      console.log(`\nTesting request_type: '${requestType}'`);
      
      const { data, error } = await supabase
        .from('team_change_requests')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          team_id: '550e8400-e29b-41d4-a716-446655440001',
          request_type: requestType,
          reason: 'Test reason',
          details: 'Test details'
        })
        .select();
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ Success: ${requestType} works`);
        
        // Clean up - delete the test record
        await supabase
          .from('team_change_requests')
          .delete()
          .eq('id', data[0].id);
      }
    }
    
    // Also try to see what's in the table currently
    console.log('\n--- Checking existing records ---');
    const { data: existing, error: existingError } = await supabase
      .from('team_change_requests')
      .select('*')
      .limit(5);
    
    if (existingError) {
      console.log('Error fetching existing records:', existingError.message);
    } else {
      console.log('Existing records:', existing.length);
      if (existing.length > 0) {
        console.log('Sample record:', existing[0]);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTableInfo();