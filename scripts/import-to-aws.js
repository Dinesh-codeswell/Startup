const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.aws' })

const pool = new Pool({
  host: process.env.AWS_RDS_ENDPOINT,
  port: 5432,
  database: process.env.AWS_RDS_DATABASE || 'postgres',
  user: process.env.AWS_RDS_USERNAME || 'postgres',
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function testConnection() {
  try {
    console.log('🔌 Testing AWS RDS connection...')
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ AWS RDS connection successful')
    return true
  } catch (error) {
    console.error('❌ AWS RDS connection failed:', error.message)
    return false
  }
}

async function createTables() {
  console.log('🗃️ Creating database tables...')
  
  const sqlFiles = [
    'migration-exports/schema/create-tables-fixed.sql',
    'migration-exports/schema/create-resource-views-table.sql',
    'migration-exports/schema/create-team-matching-tables.sql',
    'migration-exports/schema/create-team-chat-tables.sql'
  ]

  for (const sqlFile of sqlFiles) {
    if (!fs.existsSync(sqlFile)) {
      console.log(`⚠️  Skipping ${sqlFile} (file not found)`)
      continue
    }

    try {
      console.log(`📄 Executing ${path.basename(sqlFile)}...`)
      const sql = fs.readFileSync(sqlFile, 'utf8')
      
      // Split SQL into statements and execute
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement)
          } catch (error) {
            // Some statements might fail if tables already exist - that's okay
            if (!error.message.includes('already exists')) {
              console.error(`⚠️  Statement failed: ${error.message}`)
            }
          }
        }
      }
      
      console.log(`✅ Executed ${path.basename(sqlFile)}`)
    } catch (error) {
      console.error(`❌ Error executing ${sqlFile}:`, error.message)
    }
  }
}

async function importData() {
  console.log('📊 Starting data import...')
  
  const exportPath = path.join(process.cwd(), 'migration-exports', 'supabase-export.json')
  
  if (!fs.existsSync(exportPath)) {
    console.error('❌ Export file not found. Run export-supabase-data.js first.')
    return false
  }

  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
  
  // Import order matters due to foreign key constraints
  const importOrder = [
    'profiles',
    'resource_views',
    'team_matching_submissions',
    'teams',
    'team_members',
    'team_matching_batches',
    'team_notifications',
    'team_chat_participants',
    'team_chat_messages',
    'team_chat_reactions',
    'team_chat_typing_indicators'
  ]

  let totalImported = 0

  for (const table of importOrder) {
    const records = exportData[table]
    
    if (!records || records.length === 0) {
      console.log(`⚠️  No data to import for ${table}`)
      continue
    }

    console.log(`📥 Importing ${records.length} records to ${table}...`)

    let imported = 0
    let failed = 0

    for (const record of records) {
      try {
        const columns = Object.keys(record)
        const values = Object.values(record)
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
        
        const query = `
          INSERT INTO ${table} (${columns.join(', ')}) 
          VALUES (${placeholders}) 
          ON CONFLICT DO NOTHING
        `
        
        await pool.query(query, values)
        imported++
      } catch (error) {
        failed++
        if (failed <= 5) { // Only log first 5 errors to avoid spam
          console.error(`⚠️  Failed to import record to ${table}: ${error.message}`)
        }
      }
    }
    
    console.log(`✅ ${table}: ${imported} imported, ${failed} failed`)
    totalImported += imported
  }

  console.log(`\n🎉 Data import completed: ${totalImported} total records imported`)
  return true
}

async function validateImport() {
  console.log('\n🔍 Validating data import...')
  
  const exportPath = path.join(process.cwd(), 'migration-exports', 'supabase-export.json')
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
  
  const validationResults = []

  for (const [table, originalData] of Object.entries(exportData)) {
    if (!Array.isArray(originalData) || originalData.length === 0) continue

    try {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`)
      const awsCount = parseInt(result.rows[0].count)
      const originalCount = originalData.length

      const status = awsCount >= originalCount ? '✅' : '❌'
      console.log(`${status} ${table}: Original=${originalCount}, AWS=${awsCount}`)
      
      validationResults.push({
        table,
        originalCount,
        awsCount,
        success: awsCount >= originalCount
      })
    } catch (error) {
      console.error(`❌ Error validating ${table}:`, error.message)
      validationResults.push({
        table,
        originalCount: originalData.length,
        awsCount: 0,
        success: false
      })
    }
  }

  const successfulTables = validationResults.filter(r => r.success).length
  const totalTables = validationResults.length

  console.log(`\n📊 Validation Summary: ${successfulTables}/${totalTables} tables migrated successfully`)
  
  if (successfulTables === totalTables) {
    console.log('🎉 All data migrated successfully!')
  } else {
    console.log('⚠️  Some tables have missing data. Review the logs above.')
  }

  // Save validation report
  const reportPath = path.join(process.cwd(), 'migration-exports', 'validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    validationDate: new Date().toISOString(),
    results: validationResults,
    summary: {
      totalTables,
      successfulTables,
      successRate: Math.round((successfulTables / totalTables) * 100)
    }
  }, null, 2))

  console.log(`📋 Validation report saved: ${reportPath}`)
  
  return successfulTables === totalTables
}

async function main() {
  try {
    // Test connection first
    const connected = await testConnection()
    if (!connected) {
      console.error('❌ Cannot connect to AWS RDS. Check your configuration.')
      process.exit(1)
    }

    // Create tables
    await createTables()

    // Import data
    const importSuccess = await importData()
    if (!importSuccess) {
      console.error('❌ Data import failed')
      process.exit(1)
    }

    // Validate import
    const validationSuccess = await validateImport()
    if (!validationSuccess) {
      console.log('⚠️  Validation found issues, but migration may still be usable')
    }

    console.log('\n🚀 AWS migration import completed!')
    console.log('\nNext steps:')
    console.log('1. Update your application to use AWS configuration')
    console.log('2. Test the application with AWS backend')
    console.log('3. Run end-to-end tests')
    console.log('4. Gradually shift traffic from Supabase to AWS')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

module.exports = { testConnection, createTables, importData, validateImport }