const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function exportAllData() {
  console.log('🚀 Starting Supabase data export...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)

  const tables = [
    'profiles',
    'resource_views',
    'team_matching_submissions',
    'teams',
    'team_members',
    'team_matching_batches',
    'team_notifications',
    'team_chat_messages',
    'team_chat_participants',
    'team_chat_reactions',
    'team_chat_typing_indicators'
  ]

  const exportData = {}
  let totalRecords = 0

  for (const table of tables) {
    try {
      console.log(`📄 Exporting ${table}...`)

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist or is empty
          console.log(`⚠️  Table ${table} is empty or doesn't exist`)
          exportData[table] = []
        } else {
          console.error(`❌ Error exporting ${table}:`, error.message)
          exportData[table] = []
        }
      } else {
        exportData[table] = data || []
        totalRecords += data?.length || 0
        console.log(`✅ Exported ${data?.length || 0} records from ${table}`)
      }
    } catch (error) {
      console.error(`❌ Exception exporting ${table}:`, error.message)
      exportData[table] = []
    }
  }

  // Create export directory
  const exportDir = path.join(process.cwd(), 'migration-exports')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir)
  }

  // Save main export file
  const exportPath = path.join(exportDir, 'supabase-export.json')
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))

  // Save individual table files for easier debugging
  for (const [table, data] of Object.entries(exportData)) {
    const tablePath = path.join(exportDir, `${table}.json`)
    fs.writeFileSync(tablePath, JSON.stringify(data, null, 2))
  }

  // Create export summary
  const summary = {
    exportDate: new Date().toISOString(),
    totalTables: tables.length,
    totalRecords,
    tablesSummary: Object.entries(exportData).map(([table, data]) => ({
      table,
      recordCount: Array.isArray(data) ? data.length : 0
    }))
  }

  const summaryPath = path.join(exportDir, 'export-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

  console.log('\n🎉 Export completed successfully!')
  console.log(`📊 Total records exported: ${totalRecords}`)
  console.log(`📁 Export location: ${exportDir}`)
  console.log(`📋 Summary file: ${summaryPath}`)

  return summary
}

// Export schema information
async function exportSchema() {
  console.log('\n🗃️ Exporting database schema information...')

  try {
    // Get table information
    const { data: tables, error } = await supabase
      .rpc('get_table_info') // This would need to be a custom function
      .catch(() => ({ data: null, error: 'Schema export not available' }))

    if (error) {
      console.log('⚠️  Schema export not available - using SQL files instead')

      // Copy existing SQL files to migration directory
      const sqlFiles = [
        'scripts/create-tables-fixed.sql',
        'scripts/create-resource-views-table.sql',
        'scripts/create-team-matching-tables.sql',
        'scripts/create-team-chat-tables.sql'
      ]

      const exportDir = path.join(process.cwd(), 'migration-exports')
      const schemaDir = path.join(exportDir, 'schema')

      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, { recursive: true })
      }

      sqlFiles.forEach(sqlFile => {
        if (fs.existsSync(sqlFile)) {
          const fileName = path.basename(sqlFile)
          const destPath = path.join(schemaDir, fileName)
          fs.copyFileSync(sqlFile, destPath)
          console.log(`✅ Copied ${fileName} to migration exports`)
        }
      })
    }
  } catch (error) {
    console.error('❌ Error exporting schema:', error.message)
  }
}

// Main execution
async function main() {
  try {
    const summary = await exportAllData()
    await exportSchema()

    console.log('\n📋 Migration Export Summary:')
    console.log('='.repeat(50))
    summary.tablesSummary.forEach(({ table, recordCount }) => {
      console.log(`${table.padEnd(30)} ${recordCount.toString().padStart(8)} records`)
    })
    console.log('='.repeat(50))
    console.log(`Total Records: ${summary.totalRecords}`)

    console.log('\n🚀 Ready for AWS migration!')
    console.log('Next steps:')
    console.log('1. Set up AWS infrastructure (RDS, Cognito, Lambda)')
    console.log('2. Run import-to-aws.js to migrate data')
    console.log('3. Update application configuration')
    console.log('4. Test and validate migration')

  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { exportAllData, exportSchema }