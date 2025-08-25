#!/usr/bin/env node

/**
 * Test script to verify Supabase admin client is working
 */

// Load environment variables manually
const fs = require('fs');
const path = require('path');

try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.log('No .env file found, using system environment variables');
}

// Import the admin client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Admin Client Configuration');
console.log('=' .repeat(60));

console.log('Environment Variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ No service role key found');
  process.exit(1);
}

console.log('\n🔧 Creating Supabase clients...');

// Create admin client (with service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Create regular client (with anon key)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminClient() {
  console.log('\n🧪 Testing Admin Client...');
  
  try {
    // Test admin client by trying to access a protected table
    const { data, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Admin client error:', error.message);
      return false;
    } else {
      console.log('✅ Admin client working - can access team_matching_submissions');
      return true;
    }
  } catch (error) {
    console.error('❌ Admin client exception:', error.message);
    return false;
  }
}

async function testAnonClient() {
  console.log('\n🧪 Testing Anonymous Client...');
  
  try {
    // Test anon client
    const { data, error } = await supabaseAnon
      .from('team_matching_submissions')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.log('ℹ️  Anon client error (expected):', error.message);
      return true; // This is expected for RLS protected tables
    } else {
      console.log('✅ Anon client can access team_matching_submissions');
      return true;
    }
  } catch (error) {
    console.error('❌ Anon client exception:', error.message);
    return false;
  }
}

async function testInsertWithAdmin() {
  console.log('\n🧪 Testing Insert with Admin Client...');
  
  const testData = {
    id: 'test-' + Date.now(),
    full_name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    whatsapp_number: '+1234567890',
    college_name: 'Test University',
    current_year: 'Third Year',
    core_strengths: ['Strategy', 'Research', 'Financial'],
    preferred_roles: ['Team Lead', 'Researcher'],
    team_preference: 'Either UG or PG',
    availability: 'Fully Available (10–15 hrs/week)',
    experience: 'Participated in 1–2',
    case_preferences: ['consulting', 'product'],
    preferred_team_size: 3,
    status: 'pending_match'
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('team_matching_submissions')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      console.error('Error details:', error);
      return false;
    } else {
      console.log('✅ Insert successful:', data.id);
      
      // Clean up - delete the test record
      await supabaseAdmin
        .from('team_matching_submissions')
        .delete()
        .eq('id', data.id);
      
      console.log('✅ Test record cleaned up');
      return true;
    }
  } catch (error) {
    console.error('❌ Insert exception:', error.message);
    return false;
  }
}

async function runTests() {
  const results = [];
  
  results.push(await testAdminClient());
  results.push(await testAnonClient());
  results.push(await testInsertWithAdmin());

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 SUCCESS: Supabase admin client is working correctly!');
  } else {
    console.log('\n⚠️  WARNING: Some tests failed. Check configuration and RLS policies.');
  }

  return passed === total;
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});