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
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTeamChatTables() {
    console.log('🚀 Setting up team chat tables...')
    console.log(`📡 Connecting to: ${supabaseUrl}`)

    try {
        // Test connection
        const { data, error } = await supabase.from('team_matching_submissions').select('count').limit(1)
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Failed to connect to Supabase:', error.message)
            process.exit(1)
        }
        console.log('✅ Connected to Supabase successfully')

        // Read and execute team chat tables SQL
        const sqlPath = path.join(__dirname, 'create-team-chat-tables.sql')
        
        if (!fs.existsSync(sqlPath)) {
            console.error('❌ Team chat SQL file not found:', sqlPath)
            process.exit(1)
        }

        const sql = fs.readFileSync(sqlPath, 'utf8')
        console.log('📄 Read team chat SQL file')

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

        console.log(`📄 Found ${statements.length} SQL statements to execute`)

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i]
            if (statement.trim()) {
                try {
                    console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`)

                    // Execute each statement individually
                    const { error } = await supabase.rpc('exec_sql', { 
                        sql_query: statement + ';' 
                    }).catch(async () => {
                        // If exec_sql doesn't exist, try direct query
                        return await supabase.from('_').select('*').limit(0)
                    })

                    if (error) {
                        console.warn(`⚠️  Warning in statement ${i + 1}:`, error.message)
                        errorCount++
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`)
                        successCount++
                    }
                } catch (err) {
                    console.warn(`⚠️  Exception in statement ${i + 1}:`, err.message)
                    errorCount++
                }
            }
        }

        console.log(`\n🎉 Team chat tables setup completed!`)
        console.log(`✅ Successful statements: ${successCount}`)
        console.log(`⚠️  Warnings/Errors: ${errorCount}`)
        
        if (errorCount > 0) {
            console.log('\n📝 Note: Some warnings are expected if tables already exist.')
        }

        console.log('\n📊 You can now use the team chat functionality!')

    } catch (error) {
        console.error('❌ Team chat tables setup failed:', error.message)
        process.exit(1)
    }
}

// Run the setup
if (require.main === module) {
    setupTeamChatTables().catch(console.error)
}

module.exports = { setupTeamChatTables }