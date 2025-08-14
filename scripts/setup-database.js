const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQLFile(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`)
    const sql = fs.readFileSync(filePath, 'utf8')
    
    console.log(`🔄 Executing SQL script...`)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error(`❌ Error executing ${filePath}:`, error)
      return false
    }
    
    console.log(`✅ Successfully executed ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Error reading/executing ${filePath}:`, error.message)
    return false
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Beyond Career database...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Failed to connect to Supabase:', error.message)
      process.exit(1)
    }
    console.log('✅ Connected to Supabase successfully')
    
    // Run SQL scripts in order
    const scriptsToRun = [
      'scripts/create-tables-fixed.sql',
      'scripts/create-resource-views-table.sql',
      'scripts/create-team-matching-tables.sql'
    ]
    
    for (const scriptPath of scriptsToRun) {
      const fullPath = path.join(process.cwd(), scriptPath)
      
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Skipping ${scriptPath} (file not found)`)
        continue
      }
      
      const success = await runSQLFile(fullPath)
      if (!success) {
        console.error(`❌ Failed to execute ${scriptPath}`)
        process.exit(1)
      }
      
      // Add a small delay between scripts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('📊 You can now:')
    console.log('  • Submit team matching forms at /team')
    console.log('  • View admin dashboard at /admin/dashboard')
    console.log('  • Use CSV team matching at /admin/case-match')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution if RPC doesn't work
async function setupDatabaseDirect() {
  console.log('🚀 Setting up Beyond Career database (Direct SQL)...')
  
  try {
    // Read and execute team matching tables SQL
    const sqlPath = path.join(process.cwd(), 'scripts/create-team-matching-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`)
          
          // Use the query method for direct SQL execution
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            console.log(`Statement: ${statement.substring(0, 100)}...`)
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error)
}

module.exports = { setupDatabase }