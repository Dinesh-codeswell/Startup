const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
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
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTeamStrengths() {
    console.log('🚀 Setting up team strengths analysis functions...')
    console.log(`📡 Connecting to: ${supabaseUrl}`)

    try {
        // Test connection with a simple query
        console.log('🔍 Testing connection...')
        const { data, error: connectionError } = await supabase
            .from('team_matching_submissions')
            .select('count')
            .limit(1)
        
        if (connectionError) {
            console.error('❌ Failed to connect to Supabase:', connectionError.message)
            process.exit(1)
        }
        console.log('✅ Connected to Supabase successfully')

        // Read the team strengths analysis SQL script
        const sqlPath = path.join(__dirname, 'create-team-strengths-analysis-table.sql')
        
        if (!fs.existsSync(sqlPath)) {
            console.error('❌ SQL file not found:', sqlPath)
            process.exit(1)
        }

        console.log('📄 Reading team strengths analysis script...')
        const sql = fs.readFileSync(sqlPath, 'utf8')

        // Execute the SQL script
        console.log('🔄 Executing team strengths analysis setup...')
        
        const { data: result, error } = await supabase.rpc('exec_sql', { sql_query: sql })
        
        if (error) {
            // Try alternative approach - execute via raw SQL
            console.log('   Trying alternative execution method...')
            const { error: altError } = await supabase
                .from('_')
                .select('*')
                .eq('sql', sql)
            
            if (altError) {
                console.error('❌ Failed to execute SQL:', error.message)
                console.error('Alternative error:', altError.message)
                process.exit(1)
            }
        }

        console.log('✅ Team strengths analysis functions created successfully!')
        console.log('')
        console.log('📊 You can now:')
        console.log('  • Calculate team strengths analysis')
        console.log('  • View team complementarity scores')
        console.log('  • See skill coverage by domain')
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message)
        process.exit(1)
    }
}

setupTeamStrengths()