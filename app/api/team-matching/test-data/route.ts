import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import { v4 as uuidv4 } from 'uuid'

// Test data for team matching submissions
const TEST_SUBMISSIONS = [
  {
    id: uuidv4(),
    fullName: 'Alice Johnson',
    email: 'alice.johnson@university.edu',
    whatsappNumber: '+1234567890',
    collegeName: 'Stanford University',
    currentYear: '3rd Year',
    coreStrengths: ['Strategic Thinking', 'Data Analysis', 'Leadership'],
    preferredRoles: ['Team Lead', 'Analyst'],
    teamPreference: 'Mixed experience levels',
    availability: 'Available immediately',
    experience: 'Intermediate (1-2 case competitions)',
    casePreferences: ['Business Strategy', 'Market Analysis'],
    preferredTeamSize: '3'
  },
  {
    id: uuidv4(),
    fullName: 'Bob Smith',
    email: 'bob.smith@college.edu',
    whatsappNumber: '+1234567891',
    collegeName: 'MIT',
    currentYear: '2nd Year',
    coreStrengths: ['Financial Modeling', 'Problem Solving', 'Communication'],
    preferredRoles: ['Financial Analyst', 'Presenter'],
    teamPreference: 'Similar experience levels',
    availability: 'Available immediately',
    experience: 'Beginner (0-1 case competitions)',
    casePreferences: ['Finance & Investment', 'Operations'],
    preferredTeamSize: '4'
  },
  {
    id: uuidv4(),
    fullName: 'Carol Davis',
    email: 'carol.davis@university.edu',
    whatsappNumber: '+1234567892',
    collegeName: 'Harvard University',
    currentYear: '4th Year',
    coreStrengths: ['Market Research', 'Presentation', 'Team Collaboration'],
    preferredRoles: ['Market Researcher', 'Presenter'],
    teamPreference: 'Mixed experience levels',
    availability: 'Available immediately',
    experience: 'Advanced (3+ case competitions)',
    casePreferences: ['Marketing & Sales', 'Business Strategy'],
    preferredTeamSize: '3'
  },
  {
    id: uuidv4(),
    fullName: 'David Wilson',
    email: 'david.wilson@tech.edu',
    whatsappNumber: '+1234567893',
    collegeName: 'UC Berkeley',
    currentYear: '1st Year',
    coreStrengths: ['Technology Analysis', 'Innovation', 'Research'],
    preferredRoles: ['Tech Analyst', 'Researcher'],
    teamPreference: 'Similar experience levels',
    availability: 'Available immediately',
    experience: 'Beginner (0-1 case competitions)',
    casePreferences: ['Technology & Innovation', 'Operations'],
    preferredTeamSize: '4'
  },
  {
    id: uuidv4(),
    fullName: 'Emma Brown',
    email: 'emma.brown@business.edu',
    whatsappNumber: '+1234567894',
    collegeName: 'Wharton School',
    currentYear: '3rd Year',
    coreStrengths: ['Strategic Planning', 'Financial Analysis', 'Leadership'],
    preferredRoles: ['Strategy Lead', 'Financial Analyst'],
    teamPreference: 'Mixed experience levels',
    availability: 'Available immediately',
    experience: 'Intermediate (1-2 case competitions)',
    casePreferences: ['Business Strategy', 'Finance & Investment'],
    preferredTeamSize: '3'
  },
  {
    id: uuidv4(),
    fullName: 'Frank Miller',
    email: 'frank.miller@college.edu',
    whatsappNumber: '+1234567895',
    collegeName: 'Northwestern University',
    currentYear: '2nd Year',
    coreStrengths: ['Operations Management', 'Process Improvement', 'Analytics'],
    preferredRoles: ['Operations Analyst', 'Process Lead'],
    teamPreference: 'Similar experience levels',
    availability: 'Available immediately',
    experience: 'Beginner (0-1 case competitions)',
    casePreferences: ['Operations', 'Supply Chain'],
    preferredTeamSize: '4'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'create') {
      // Create test submissions
      const createdSubmissions = []
      
      for (const testData of TEST_SUBMISSIONS) {
        try {
          const submission = await TeamMatchingService.submitTeamMatchingForm(testData)
          createdSubmissions.push(submission)
        } catch (error) {
          console.error(`Error creating test submission for ${testData.fullName}:`, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdSubmissions.length} test submissions`,
        data: {
          created: createdSubmissions.length,
          submissions: createdSubmissions
        }
      })
    }

    if (action === 'clear') {
      // This would require a more complex implementation to safely clear test data
      // For now, just return a message
      return NextResponse.json({
        success: true,
        message: 'Clear action not implemented - manually delete from database if needed',
        data: {}
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "create" or "clear"'
    }, { status: 400 })

  } catch (error) {
    console.error('Error in test data API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to manage test data: ${errorMessage}`
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return information about available test data
    return NextResponse.json({
      success: true,
      data: {
        available_test_submissions: TEST_SUBMISSIONS.length,
        test_submissions: TEST_SUBMISSIONS.map(sub => ({
          name: sub.fullName,
          college: sub.collegeName,
          year: sub.currentYear,
          experience: sub.experience,
          preferred_team_size: sub.preferredTeamSize
        }))
      }
    })

  } catch (error) {
    console.error('Error getting test data info:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get test data information'
    }, { status: 500 })
  }
}