const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

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
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function checkTeamAnalysisData() {
    console.log('🔍 Checking team analysis data...')

    try {
        // Get the team ID
        const { data: teams, error: teamsError } = await supabaseAdmin
            .from('teams')
            .select('id, team_name')
            .limit(1)
        
        if (teamsError || !teams || teams.length === 0) {
            console.error('❌ No teams found:', teamsError?.message)
            return
        }
        
        const teamId = teams[0].id
        console.log(`📊 Checking analysis for team: ${teams[0].team_name} (${teamId})`)
        
        // Check current analysis data
        const { data: analysisData, error: analysisError } = await supabaseAdmin
            .from('team_strengths_analysis')
            .select('*')
            .eq('team_id', teamId)
        
        if (analysisError) {
            console.error('❌ Error fetching analysis:', analysisError.message)
            return
        }
        
        if (!analysisData || analysisData.length === 0) {
            console.log('⚠️  No analysis data found for this team')
            
            // Insert sample data
            console.log('📝 Inserting sample analysis data...')
            const { data: insertData, error: insertError } = await supabaseAdmin
                .from('team_strengths_analysis')
                .insert({
                    team_id: teamId,
                    complementarity_score: 86, // INTEGER value
                    complementarity_description: 'Strong team complementarity with diverse skill sets and balanced experience levels',
                    key_observations: [
                        'Excellent technical coverage across multiple domains',
                        'Strong leadership and strategic thinking capabilities', 
                        'Good balance of creative and analytical skills',
                        'Diverse experience levels promote knowledge sharing'
                    ],
                    consulting_coverage: 78.50,
                    technology_coverage: 92.00,
                    finance_coverage: 65.25,
                    marketing_coverage: 71.75,
                    design_coverage: 58.50,
                    breadth_coverage_score: 82.00,
                    domain_distribution_score: 76.50,
                    essential_skills_score: 88.25,
                    redundancy_optimization_score: 73.75,
                    team_member_count: 4,
                    core_strengths_analyzed: [
                        'Technical', 'Leadership', 'Strategy', 'Communication', 
                        'Creative', 'Research', 'Problem Solving', 'UI/UX'
                    ]
                })
                .select()
            
            if (insertError) {
                console.error('❌ Failed to insert sample data:', insertError.message)
            } else {
                console.log('✅ Sample analysis data inserted successfully!')
                console.log('📊 New analysis data:')
                console.log(JSON.stringify(insertData[0], null, 2))
            }
        } else {
            console.log('✅ Found existing analysis data:')
            analysisData.forEach((analysis, index) => {
                console.log(`\n📊 Analysis ${index + 1}:`)
                console.log(`  Complementarity Score: ${analysis.complementarity_score}`)
                console.log(`  Consulting Coverage: ${analysis.consulting_coverage}%`)
                console.log(`  Technology Coverage: ${analysis.technology_coverage}%`)
                console.log(`  Finance Coverage: ${analysis.finance_coverage}%`)
                console.log(`  Marketing Coverage: ${analysis.marketing_coverage}%`)
                console.log(`  Design Coverage: ${analysis.design_coverage}%`)
                console.log(`  Team Member Count: ${analysis.team_member_count}`)
                console.log(`  Calculated At: ${analysis.calculated_at}`)
            })
        }
        
        console.log('\n🎉 Analysis check completed!')
        
    } catch (error) {
        console.error('❌ Check failed:', error.message)
        process.exit(1)
    }
}

checkTeamAnalysisData()