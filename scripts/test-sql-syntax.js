const fs = require('fs')
const path = require('path')

function testSqlSyntax() {
    console.log('🔍 Testing SQL Syntax...')
    
    const sqlPath = path.join(__dirname, 'create-all-tables-safe.sql')
    
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ SQL file not found')
        return false
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Basic syntax checks
    const checks = [
        {
            name: 'Balanced parentheses',
            test: () => {
                const open = (sql.match(/\(/g) || []).length
                const close = (sql.match(/\)/g) || []).length
                return open === close
            }
        },
        {
            name: 'No DROP FUNCTION update_updated_at_column',
            test: () => !sql.includes('DROP FUNCTION IF EXISTS update_updated_at_column()')
        },
        {
            name: 'Has CREATE OR REPLACE for update_updated_at_column',
            test: () => sql.includes('CREATE OR REPLACE FUNCTION update_updated_at_column()')
        },
        {
            name: 'Has team approval columns',
            test: () => sql.includes('approval_status') && sql.includes('approved_by')
        },
        {
            name: 'Has audit table',
            test: () => sql.includes('team_formation_audit')
        }
    ]
    
    let allPassed = true
    
    checks.forEach(check => {
        const passed = check.test()
        console.log(`   ${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) allPassed = false
    })
    
    console.log(`\n${allPassed ? '✅' : '❌'} SQL Syntax Check: ${allPassed ? 'PASSED' : 'FAILED'}`)
    
    if (allPassed) {
        console.log('\n🚀 The SQL script should now work without the function conflict error!')
        console.log('\n📋 To deploy:')
        console.log('   1. Copy the contents of scripts/create-all-tables-safe.sql')
        console.log('   2. Paste into Supabase SQL Editor')
        console.log('   3. Click "Run" to execute')
        console.log('\n💡 The script now safely handles existing functions')
    }
    
    return allPassed
}

if (require.main === module) {
    testSqlSyntax()
}

module.exports = { testSqlSyntax }