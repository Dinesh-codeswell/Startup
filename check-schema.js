require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    // Check table structure
    const { data, error } = await supabase
      .from('team_change_requests')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('Error querying table:', error.message);
      return;
    }
    
    console.log('Table exists and is accessible');
    
    // Try a simple insert to see what fails
    const { data: insertData, error: insertError } = await supabase
      .from('team_change_requests')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        team_id: '550e8400-e29b-41d4-a716-446655440001',
        request_type: 'leave_team',
        reason: 'Test reason',
        details: 'Test details'
      })
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError.message);
      console.error('Error details:', insertError);
    } else {
      console.log('Insert successful:', insertData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSchema();