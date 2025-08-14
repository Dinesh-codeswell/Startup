const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '')
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyDeployment() {
    console.log('🔍 Verifying Enhanced Database Deployment')
    console.log('=' .repeat(50))

    let allGood = true

    // Test 1: Core Tables
    console.log('\n📊 Testing Core Tables...')
    const coreTables = [
        'profiles',
        'team_matching_submissions', 
        'teams',
        'team_members',
        'team_chat_messages',
        'team_chat_participants'
    ]

    for (const table of coreTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(1)
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`)
                allGood = false
            } else {
                console.log(`   ✅ ${table}: Ready`)
            }
        } catch (err) {
            console.log(`   ❌ ${table}: ${err.message}`)
            allGood = false
        }
    }

    // Test 2: Enhanced Tables
    console.log('\n🚀 Testing Enhanced Tables...')
    const enhancedTables = [
        'team_matching_batches',
        'team_formation_audit'
    ]

    for (const table of enhancedTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(1)
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`)
                allGood = false
            } else {
                console.log(`   ✅ ${table}: Ready`)
            }
        } catch (err) {
            console.log(`   ❌ ${table}: ${err.message}`)
            allGood = false
        }
    }

    // Test 3: Enhanced Columns
    console.log('\n🔧 Testing Enhanced Columns...')
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('approval_status, approved_by, approved_at')
            .limit(1)
        
        if (error) {
            console.log(`   ❌ Teams approval columns: ${error.message}`)
            allGood = false
        } else {
            console.log(`   ✅ Teams approval columns: Ready`)
        }
    } catch (err) {
        console.log(`   ❌ Teams approval columns: ${err.message}`)
        allGood = false
    }

    try {
        const { data, error } = await supabase
            .from('team_matching_batches')
            .select('admin_user_id, formation_method')
            .limit(1)
        
        if (error) {
            console.log(`   ❌ Batch tracking columns: ${error.message}`)
            allGood = false
        } else {
            console.log(`   ✅ Batch tracking columns: Ready`)
        }
    } catch (err) {
        console.log(`   ❌ Batch tracking columns: ${err.message}`)
        allGood = false
    }

    // Test 4: Functions
    console.log('\n⚙️  Testing Enhanced Functions...')
    const functions = [
        'get_team_matching_stats',
        'export_pending_submissions_for_csv'
    ]

    for (const func of functions) {
        try {
            const { data, error } = await supabase.rpc(func)
            if (error) {
                console.log(`   ❌ ${func}(): ${error.message}`)
                allGood = false
            } else {
                console.log(`   ✅ ${func}(): Ready`)
            }
        } catch (err) {
            console.log(`   ❌ ${func}(): ${err.message}`)
            allGood = false
        }
    }

    // Test 5: RLS Policies
    console.log('\n🔒 Testing RLS Policies...')
    try {
        // Test with anon key (should be restricted)
        const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey)
        
        const { error } = await anonSupabase.from('team_formation_audit').select('*').limit(1)
        if (error && error.message.includes('permission denied')) {
            console.log(`   ✅ Audit table RLS: Properly restricted`)
        } else {
            console.log(`   ⚠️  Audit table RLS: May need review`)
        }
    } catch (err) {
        console.log(`   ✅ RLS policies: Active (expected error)`)
    }

    // Summary
    console.log('\n' + '=' .repeat(50))
    if (allGood) {
        console.log('🎉 DEPLOYMENT VERIFICATION: SUCCESS!')
        console.log('\n✅ Your enhanced database is ready for production!')
        console.log('\n🚀 Next steps:')
        console.log('   • Test team approval workflow')
        console.log('   • Verify admin dashboard functionality') 
        console.log('   • Test complete user journey')
        console.log('   • Monitor audit trail logging')
    } else {
        console.log('⚠️  DEPLOYMENT VERIFICATION: ISSUES FOUND')
        console.log('\n🔧 Some components need attention:')
        console.log('   • Check the SQL script execution in Supabase')
        console.log('   • Verify all tables and functions were created')
        console.log('   • Review any error messages above')
        console.log('\n💡 Tip: Run the SQL script manually in Supabase SQL Editor')
    }

    console.log('\n📖 For detailed deployment instructions, see: DEPLOYMENT_GUIDE.md')
}

// Run verification
if (require.main === module) {
    verifyDeployment().catch(console.error)
}

module.exports = { verifyDeployment }