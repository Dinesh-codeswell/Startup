import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserSubmissionId, createAuthErrorResponse, checkTeamAccess } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return createAuthErrorResponse('Authentication required')
    }

    // Get user's submission ID
    const submissionId = await getUserSubmissionId(user.id)
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'User submission not found' },
        { status: 404 }
      )
    }

    // Get team ID from query params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Check team access
    const hasAccess = await checkTeamAccess(submissionId, teamId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this team' },
        { status: 403 }
      )
    }

    // Get team members with their skills and experience
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_matching_submissions (
          core_strengths,
          availability,
          experience,
          full_name
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)

    if (membersError) {
      console.error('Error fetching team members for insights:', membersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team insights' },
        { status: 500 }
      )
    }

    // Calculate insights from team data
    const insights = calculateTeamInsights(teamMembers || [])

    return NextResponse.json({
      success: true,
      data: insights
    })

  } catch (error) {
    console.error('Error fetching team insights:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateTeamInsights(teamMembers: any[]) {
  if (!teamMembers || teamMembers.length === 0) {
    return getDefaultInsights()
  }

  const submissions = teamMembers.map(m => m.team_matching_submissions).filter(Boolean)
  
  // Analyze skills distribution
  const allStrengths = submissions.flatMap(s => s.core_strengths || [])
  const skillCategories = categorizeSkills(allStrengths)
  
  // Analyze experience levels
  const experienceLevels = submissions.map(s => categorizeExperience(s.experience))
  
  // Analyze availability
  const availabilityLevels = submissions.map(s => categorizeAvailability(s.availability))
  
  return {
    skillsDistribution: calculateDistribution(skillCategories),
    experienceMix: calculateDistribution(experienceLevels),
    availabilityMix: calculateDistribution(availabilityLevels),
    caseTypes: ["Consulting", "Product/Tech", "Marketing", "Finance"],
    topStrengths: getTopStrengths(allStrengths),
    strengthsAnalysis: {
      coreStrengths: analyzeCoreStrengths(submissions),
      teamComplementarity: {
        score: calculateComplementarityScore(submissions),
        description: "Team analysis based on member skills and experience",
        strengths: ["Diverse skill set", "Good collaboration potential"],
        opportunities: ["Continue developing complementary skills"]
      },
      uniqueStrengths: analyzeUniqueStrengths(submissions),
      skillCoverage: {
        consulting: calculateSkillCoverage(allStrengths, ['Strategic Thinking', 'Leadership', 'Problem Solving']),
        technology: calculateSkillCoverage(allStrengths, ['Technical', 'Programming', 'Data Analysis']),
        finance: calculateSkillCoverage(allStrengths, ['Financial', 'Analytics', 'Modeling']),
        marketing: calculateSkillCoverage(allStrengths, ['Marketing', 'Creative', 'Communication']),
        design: calculateSkillCoverage(allStrengths, ['Design', 'UI/UX', 'Creative'])
      }
    }
  }
}

function categorizeSkills(strengths: string[]) {
  const categories = {
    'Technical': ['Technical', 'Programming', 'Data Analysis', 'Analytics'],
    'Business': ['Strategic Thinking', 'Leadership', 'Financial', 'Business'],
    'Creative': ['Creative', 'Design', 'UI/UX', 'Marketing'],
    'Leadership': ['Leadership', 'Management', 'Team Lead']
  }
  
  return strengths.map(strength => {
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => strength.toLowerCase().includes(keyword.toLowerCase()))) {
        return category
      }
    }
    return 'Other'
  })
}

function categorizeExperience(experience: string) {
  if (!experience) return 'Beginner'
  const exp = experience.toLowerCase()
  if (exp.includes('none') || exp.includes('0') || exp.includes('beginner')) return 'Beginner'
  if (exp.includes('1-2') || exp.includes('intermediate')) return 'Intermediate'
  if (exp.includes('3+') || exp.includes('experienced') || exp.includes('expert')) return 'Experienced'
  return 'Intermediate'
}

function categorizeAvailability(availability: string) {
  if (!availability) return 'Moderately Available'
  const avail = availability.toLowerCase()
  if (avail.includes('fully') || avail.includes('10-15') || avail.includes('15+')) return 'Fully Available'
  if (avail.includes('moderately') || avail.includes('5-10')) return 'Moderately Available'
  if (avail.includes('lightly') || avail.includes('0-5')) return 'Lightly Available'
  return 'Moderately Available'
}

function calculateDistribution(items: string[]) {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const total = items.length
  return Object.entries(counts).map(([label, count]) => ({
    label,
    value: Math.round((count / total) * 100)
  }))
}

function getTopStrengths(strengths: string[]) {
  const counts = strengths.reduce((acc, strength) => {
    acc[strength] = (acc[strength] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([strength]) => strength)
}

function analyzeCoreStrengths(submissions: any[]) {
  return [
    {
      category: "Strategic Leadership",
      skills: ["Strategic Thinking", "Leadership", "Problem Solving"],
      teamMembers: submissions.filter(s => 
        s.core_strengths?.some((strength: string) => 
          ['Strategic', 'Leadership', 'Problem'].some(keyword => 
            strength.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      ).map(s => s.full_name),
      strength: "Good",
      description: "Strategic thinking and leadership capabilities",
      impact: "Important for project direction and team coordination"
    }
  ]
}

function calculateComplementarityScore(submissions: any[]) {
  // Simple scoring based on diversity of skills
  const allStrengths = submissions.flatMap(s => s.core_strengths || [])
  const uniqueStrengths = new Set(allStrengths)
  return Math.min(95, Math.max(60, uniqueStrengths.size * 10))
}

function analyzeUniqueStrengths(submissions: any[]) {
  return submissions.map(submission => ({
    member: submission.full_name,
    strength: submission.core_strengths?.[0] || 'General Skills',
    rarity: 'Medium',
    value: 'Contributes to team capabilities'
  }))
}

function calculateSkillCoverage(strengths: string[], keywords: string[]) {
  const relevantStrengths = strengths.filter(strength => 
    keywords.some(keyword => 
      strength.toLowerCase().includes(keyword.toLowerCase())
    )
  )
  return Math.min(100, Math.max(30, relevantStrengths.length * 25))
}

function getDefaultInsights() {
  return {
    skillsDistribution: [
      { label: "Technical", value: 25 },
      { label: "Business", value: 25 },
      { label: "Creative", value: 25 },
      { label: "Leadership", value: 25 }
    ],
    experienceMix: [
      { label: "Beginner", value: 40 },
      { label: "Intermediate", value: 40 },
      { label: "Experienced", value: 20 }
    ],
    availabilityMix: [
      { label: "Fully Available", value: 50 },
      { label: "Moderately Available", value: 40 },
      { label: "Lightly Available", value: 10 }
    ],
    caseTypes: ["Consulting", "Product/Tech", "Marketing", "Finance"],
    topStrengths: ["Problem Solving", "Communication", "Analysis"],
    strengthsAnalysis: {
      coreStrengths: [],
      teamComplementarity: {
        score: 75,
        description: "Team is forming - insights will improve as members join",
        strengths: ["Potential for good collaboration"],
        opportunities: ["Recruit diverse skill sets"]
      },
      uniqueStrengths: [],
      skillCoverage: {
        consulting: 60,
        technology: 50,
        finance: 50,
        marketing: 50,
        design: 50
      }
    }
  }
}