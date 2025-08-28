require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugProfilesData() {
  console.log('=== DEBUGGING PROFILES DATA ===')
  
  try {
    // Check profiles table structure and data
    console.log('\n1. Checking profiles table:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('Profiles error:', profilesError)
    } else {
      console.log('Profiles data:', JSON.stringify(profiles, null, 2))
      console.log('Number of profiles:', profiles?.length || 0)
    }
    
    // Check team_change_requests table
    console.log('\n2. Checking team_change_requests table:')
    const { data: requests, error: requestsError } = await supabase
      .from('team_change_requests')
      .select('*')
      .limit(5)
    
    if (requestsError) {
      console.error('Requests error:', requestsError)
    } else {
      console.log('Requests data:', JSON.stringify(requests, null, 2))
      console.log('Number of requests:', requests?.length || 0)
    }
    
    // Check if user_ids in requests exist in profiles
    if (requests && requests.length > 0) {
      console.log('\n3. Checking user_id matches:')
      const userIds = requests.map(r => r.user_id).filter(Boolean)
      console.log('User IDs from requests:', userIds)
      
      if (userIds.length > 0) {
        const { data: matchingProfiles, error: matchError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        
        if (matchError) {
          console.error('Match error:', matchError)
        } else {
          console.log('Matching profiles:', JSON.stringify(matchingProfiles, null, 2))
        }
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugProfilesData()