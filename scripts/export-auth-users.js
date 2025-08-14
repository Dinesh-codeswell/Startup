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
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to convert JSON to CSV
function jsonToCsv(jsonData) {
    if (!jsonData || jsonData.length === 0) {
        return ''
    }

    const headers = Object.keys(jsonData[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = jsonData.map(row => {
        return headers.map(header => {
            let value = row[header]
            
            // Handle null/undefined values
            if (value === null || value === undefined) {
                value = ''
            }
            
            // Handle objects/arrays (convert to JSON string)
            if (typeof value === 'object') {
                value = JSON.stringify(value)
            }
            
            // Escape quotes and wrap in quotes if contains comma or quote
            value = String(value)
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = '"' + value.replace(/"/g, '""') + '"'
            }
            
            return value
        }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
}

// Helper function to save data to file
function saveToFile(data, filename, format = 'csv') {
    const outputDir = path.join(__dirname, '..', 'exports')
    
    // Create exports directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const filePath = path.join(outputDir, filename)
    
    if (format === 'csv') {
        const csvData = jsonToCsv(data)
        fs.writeFileSync(filePath, csvData, 'utf8')
    } else if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    } else if (format === 'sql') {
        // Generate INSERT statements
        if (data.length > 0) {
            const tableName = 'auth_users_export'
            const columns = Object.keys(data[0])
            let sqlContent = `-- Auth Users Export\n-- Generated on ${new Date().toISOString()}\n\n`
            
            sqlContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`
            sqlContent += columns.map(col => `  ${col} TEXT`).join(',\n')
            sqlContent += '\n);\n\n'
            
            data.forEach(row => {
                const values = columns.map(col => {
                    let value = row[col]
                    if (value === null || value === undefined) {
                        return 'NULL'
                    }
                    if (typeof value === 'object') {
                        value = JSON.stringify(value)
                    }
                    return `'${String(value).replace(/'/g, "''")}'`
                }).join(', ')
                
                sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`
            })
            
            fs.writeFileSync(filePath, sqlContent, 'utf8')
        }
    }
    
    console.log(`✅ Data exported to: ${filePath}`)
    return filePath
}

// Export functions
async function exportBasicAuthUsers() {
    console.log('📊 Exporting basic auth users...')
    
    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            email,
            created_at,
            updated_at,
            last_sign_in_at,
            email_confirmed_at,
            phone,
            phone_confirmed_at,
            raw_user_meta_data,
            role,
            aud
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('❌ Error fetching auth users:', error.message)
        return null
    }

    console.log(`📈 Found ${data.length} users`)
    return data
}

async function exportAuthUsersWithMetadata() {
    console.log('📊 Exporting auth users with extracted metadata...')
    
    // Use raw SQL query for better metadata extraction
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT 
                id,
                email,
                created_at,
                updated_at,
                last_sign_in_at,
                email_confirmed_at,
                phone,
                raw_user_meta_data->>'first_name' as first_name,
                raw_user_meta_data->>'last_name' as last_name,
                raw_user_meta_data->>'college_name' as college_name,
                raw_user_meta_data->>'full_name' as full_name,
                raw_user_meta_data->>'avatar_url' as avatar_url,
                raw_user_meta_data,
                role,
                aud,
                CASE 
                    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
                    ELSE 'Unconfirmed'
                END as email_status,
                EXTRACT(DAY FROM (NOW() - created_at)) as days_since_registration,
                CASE 
                    WHEN last_sign_in_at IS NOT NULL 
                    THEN EXTRACT(DAY FROM (NOW() - last_sign_in_at))
                    ELSE NULL 
                END as days_since_last_login
            FROM auth.users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC;
        `
    })

    if (error) {
        console.error('❌ Error fetching auth users with metadata:', error.message)
        // Fallback to basic export
        return await exportBasicAuthUsers()
    }

    console.log(`📈 Found ${data.length} users with metadata`)
    return data
}

async function exportAuthUsersWithTeamData() {
    console.log('📊 Exporting auth users with team matching data...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT 
                u.id,
                u.email,
                u.created_at as user_created_at,
                u.last_sign_in_at,
                u.email_confirmed_at,
                u.raw_user_meta_data->>'first_name' as first_name,
                u.raw_user_meta_data->>'last_name' as last_name,
                u.raw_user_meta_data->>'college_name' as college_name,
                u.role,
                tms.id as submission_id,
                tms.status as team_status,
                tms.submitted_at,
                tms.matched_at,
                tms.full_name as submission_name,
                tms.whatsapp_number,
                tms.current_year,
                tms.experience,
                tms.preferred_team_size,
                CASE 
                    WHEN tms.id IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END as has_team_submission
            FROM auth.users u
            LEFT JOIN team_matching_submissions tms ON u.id = tms.user_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC;
        `
    })

    if (error) {
        console.error('❌ Error fetching auth users with team data:', error.message)
        // Fallback to metadata export
        return await exportAuthUsersWithMetadata()
    }

    console.log(`📈 Found ${data.length} users with team data`)
    return data
}

async function exportAuthUserStats() {
    console.log('📊 Generating auth user statistics...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
                COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_who_logged_in,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7_days,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_last_30_days,
                MIN(created_at) as first_user_registered,
                MAX(created_at) as last_user_registered,
                ROUND(AVG(EXTRACT(DAY FROM (NOW() - created_at))), 2) as avg_days_since_registration
            FROM auth.users
            WHERE deleted_at IS NULL;
        `
    })

    if (error) {
        console.error('❌ Error fetching auth user stats:', error.message)
        return null
    }

    console.log('📈 User Statistics:')
    const stats = data[0]
    console.log(`   Total Users: ${stats.total_users}`)
    console.log(`   Confirmed Users: ${stats.confirmed_users}`)
    console.log(`   Users Who Logged In: ${stats.users_who_logged_in}`)
    console.log(`   New Users (7 days): ${stats.users_last_7_days}`)
    console.log(`   New Users (30 days): ${stats.users_last_30_days}`)
    console.log(`   First User: ${stats.first_user_registered}`)
    console.log(`   Latest User: ${stats.last_user_registered}`)
    
    return data
}

// Main export function
async function exportAuthUsers(options = {}) {
    const {
        format = 'csv', // csv, json, sql
        type = 'metadata', // basic, metadata, team, stats
        filename = null
    } = options

    console.log('🚀 Starting auth users export...')
    console.log(`📡 Connecting to: ${supabaseUrl}`)

    try {
        let data = null
        let defaultFilename = ''

        // Export based on type
        switch (type) {
            case 'basic':
                data = await exportBasicAuthUsers()
                defaultFilename = `auth_users_basic_${new Date().toISOString().split('T')[0]}`
                break
            case 'metadata':
                data = await exportAuthUsersWithMetadata()
                defaultFilename = `auth_users_metadata_${new Date().toISOString().split('T')[0]}`
                break
            case 'team':
                data = await exportAuthUsersWithTeamData()
                defaultFilename = `auth_users_team_data_${new Date().toISOString().split('T')[0]}`
                break
            case 'stats':
                data = await exportAuthUserStats()
                defaultFilename = `auth_users_stats_${new Date().toISOString().split('T')[0]}`
                break
            default:
                console.error('❌ Invalid export type. Use: basic, metadata, team, or stats')
                return
        }

        if (!data || data.length === 0) {
            console.log('⚠️  No data to export')
            return
        }

        // Save to file
        const finalFilename = filename || `${defaultFilename}.${format}`
        const filePath = saveToFile(data, finalFilename, format)

        console.log('\n🎉 Export completed successfully!')
        console.log(`📁 File saved: ${filePath}`)
        console.log(`📊 Records exported: ${data.length}`)

        return filePath

    } catch (error) {
        console.error('❌ Export failed:', error.message)
        throw error
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2)
    const options = {}

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '')
        const value = args[i + 1]
        options[key] = value
    }

    // Set defaults
    options.format = options.format || 'csv'
    options.type = options.type || 'metadata'

    console.log('🔧 Export options:', options)

    exportAuthUsers(options).catch(console.error)
}

module.exports = { exportAuthUsers, exportBasicAuthUsers, exportAuthUsersWithMetadata, exportAuthUsersWithTeamData, exportAuthUserStats }