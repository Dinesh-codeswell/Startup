require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  try {
    // Check the actual constraint definition
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'team_change_requests'::regclass
          AND contype = 'c'
      `
    });
    
    if (error) {
      console.error('Error checking constraints:', error);
      return;
    }
    
    console.log('Constraints on team_change_requests:');
    console.log(JSON.stringify(data, null, 2));
    
    // Also check column order
    const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          ordinal_position,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'team_change_requests'
        ORDER BY ordinal_position
      `
    });
    
    if (colError) {
      console.error('Error checking columns:', colError);
      return;
    }
    
    console.log('\nColumn structure:');
    console.log(JSON.stringify(columns, null, 2));
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkConstraints();