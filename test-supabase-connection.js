require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Environment variables not loaded properly');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test connection and check table structure
async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('team_chat_participants').select('*').limit(1);
    
    if (error) {
      console.error('Connection error:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    
    console.log('\n2. Checking team_chat_participants table structure...');
    const { data: participantsData, error: participantsError } = await supabase
      .from('team_chat_participants')
      .select('*')
      .limit(1);
    
    if (participantsError) {
      console.error('team_chat_participants error:', participantsError.message);
    } else {
      console.log('team_chat_participants columns:', participantsData.length > 0 ? Object.keys(participantsData[0]) : 'No data found');
    }
    
    console.log('\n3. Checking team_chat_messages table structure...');
    const { data: messagesData, error: messagesError } = await supabase
      .from('team_chat_messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('team_chat_messages error:', messagesError.message);
    } else {
      console.log('team_chat_messages columns:', messagesData.length > 0 ? Object.keys(messagesData[0]) : 'No data found');
    }
    
    console.log('\n4. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('Auth status: No active session (expected for server-side test)');
    } else {
      console.log('Auth status: Active session found', user ? user.email : 'No user');
    }
    
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testConnection();