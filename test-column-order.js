require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testColumnOrder() {
  try {
    // The failing row from the error was:
    // (cb87dbac-f7eb-4c34-bcf2-c65cc79c75fd, 550e8400-e29b-41d4-a716-446655440001, 550e8400-e29b-41d4-a716-446655440000, leave_team, Test reason, Test details, pending, null, null, 2025-08-28 15:50:11.580576+00, 2025-08-28 15:50:11.580576+00)
    // This suggests the order might be: id, team_id, user_id, request_type, reason, details, status, reviewed_by, reviewed_at, created_at, updated_at
    // But we're inserting: user_id, team_id, request_type, reason, details
    
    console.log('Testing if the issue is column order...');
    
    // Try inserting with explicit column mapping
    const { data, error } = await supabase
      .from('team_change_requests')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        team_id: '550e8400-e29b-41d4-a716-446655440001', 
        request_type: 'leave_team',
        reason: 'Test reason',
        details: 'Test details'
      })
      .select('*');
    
    if (error) {
      console.log('Insert failed:', error.message);
      console.log('Full error:', error);
      
      // Let's try to understand the constraint by testing without request_type
      console.log('\nTrying insert without request_type...');
      const { data: data2, error: error2 } = await supabase
        .from('team_change_requests')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          team_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'Test reason',
          details: 'Test details'
        })
        .select('*');
      
      if (error2) {
        console.log('Still failed:', error2.message);
      } else {
        console.log('Success without request_type! This means the constraint is on request_type');
        console.log('Inserted record:', data2);
        
        // Clean up
        await supabase.from('team_change_requests').delete().eq('id', data2[0].id);
      }
    } else {
      console.log('Success!', data);
      // Clean up
      await supabase.from('team_change_requests').delete().eq('id', data[0].id);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testColumnOrder();