const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserTeamData() {
  try {
    console.log('=== Checking Profiles Table ===')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('Profiles error:', profilesError)
    } else {
      console.log('Profiles data:', profiles)
      console.log('Profiles columns:', profiles.length > 0 ? Object.keys(profiles[0]) : 'No data')
    }

    console.log('\n=== Checking Teams Table ===')
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .limit(5)
    
    if (teamsError) {
      console.error('Teams error:', teamsError)
    } else {
      console.log('Teams data:', teams)
      console.log('Teams columns:', teams.length > 0 ? Object.keys(teams[0]) : 'No data')
    }

    console.log('\n=== Checking Team Change Requests ===')
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('team_change_requests')
      .select('*')
      .limit(3)
    
    if (requestsError) {
      console.error('Requests error:', requestsError)
    } else {
      console.log('Requests data:', requests)
      if (requests.length > 0) {
        console.log('Sample request user_id:', requests[0].user_id)
        console.log('Sample request team_id:', requests[0].team_id)
      }
    }

    console.log('\n=== Checking Issue Reports ===')
    const { data: issues, error: issuesError } = await supabaseAdmin
      .from('issue_reports')
      .select('*')
      .limit(3)
    
    if (issuesError) {
      console.error('Issues error:', issuesError)
    } else {
      console.log('Issues data:', issues)
      if (issues.length > 0) {
        console.log('Sample issue user_id:', issues[0].user_id)
        console.log('Sample issue team_id:', issues[0].team_id)
      }
    }

  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugUserTeamData()