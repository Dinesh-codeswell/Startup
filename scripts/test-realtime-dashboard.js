const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRealTimeDashboard() {
  console.log('🧪 Testing Real-Time Dashboard Updates...')
  
  try {
    // Create a test submission to trigger real-time updates
    const testSubmission = {
      full_name: 'Test User Real-time',
      email: 'test-realtime@example.com',
      whatsapp_number: '+1234567890',
      college_name: 'Test University',
      current_year: 'Third Year',
      core_strengths: ['Leadership'],
      preferred_roles: ['Team Lead'],
      availability: 'Fully Available (10–15 hrs/week)',
      experience: 'Participated in 1–2',
      case_preferences: ['Technology'],
      preferred_team_size: 4
    }
    
    console.log('📝 Creating test submission...')
    const { data: submission, error: submitError } = await supabase
      .from('team_matching_submissions')
      .insert([testSubmission])
      .select()
      .single()
    
    if (submitError) {
      console.error('❌ Error creating test submission:', submitError)
      return
    }
    
    console.log('✅ Test submission created:', submission.id)
    console.log('📊 Check your admin dashboard - it should update automatically!')
    console.log('🌐 Dashboard URL: https://defaultstartup.netlify.app/admin/dashboard')
    
    // Wait a moment, then clean up
    console.log('⏳ Waiting 10 seconds before cleanup...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('🧹 Cleaning up test submission...')
    const { error: deleteError } = await supabase
      .from('team_matching_submissions')
      .delete()
      .eq('id', submission.id)
    
    if (deleteError) {
      console.error('❌ Error deleting test submission:', deleteError)
    } else {
      console.log('✅ Test submission cleaned up')
      console.log('📊 Dashboard should update again to remove the test entry')
    }
    
    console.log('\n🎉 Real-time test completed!')
    console.log('If the dashboard updated automatically, real-time is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testRealTimeDashboard()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })