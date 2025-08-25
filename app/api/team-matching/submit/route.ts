import { NextRequest, NextResponse } from 'next/server'
import { TeamMatchingService } from '@/lib/services/team-matching-db'
import type { TeamMatchingFormData, TeamMatchingSubmissionResponse } from '@/lib/types/team-matching'

export async function POST(request: NextRequest) {
  try {
    const formData: TeamMatchingFormData = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'fullName', 'email', 'whatsappNumber', 'collegeName', 
      'currentYear', 'availability', 'experience', 'preferredTeamSize'
    ]
    
    for (const field of requiredFields) {
      if (!formData[field as keyof TeamMatchingFormData]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        } as TeamMatchingSubmissionResponse, { status: 400 })
      }
    }

    // Validate arrays
    if (!formData.coreStrengths || formData.coreStrengths.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one core strength is required'
      } as TeamMatchingSubmissionResponse, { status: 400 })
    }

    if (!formData.preferredRoles || formData.preferredRoles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one preferred role is required'
      } as TeamMatchingSubmissionResponse, { status: 400 })
    }

    if (!formData.casePreferences || formData.casePreferences.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one case preference is required'
      } as TeamMatchingSubmissionResponse, { status: 400 })
    }

    // Validate team size
    const teamSize = parseInt(formData.preferredTeamSize)
    if (isNaN(teamSize) || teamSize < 2 || teamSize > 4) {
      return NextResponse.json({
        success: false,
        error: 'Team size must be between 2 and 4'
      } as TeamMatchingSubmissionResponse, { status: 400 })
    }

    // Check for duplicate submissions
    const existingSubmissions = await TeamMatchingService.getSubmissions({
      status: 'pending_match'
    })
    
    // If user is authenticated, check by user ID first
    if (formData.userId) {
      const duplicateUser = existingSubmissions.find(
        submission => submission.user_id === formData.userId
      )
      
      if (duplicateUser) {
        return NextResponse.json({
          success: false,
          error: 'You already have an active submission. Please wait for team matching or contact support to update your submission.'
        } as TeamMatchingSubmissionResponse, { status: 409 })
      }
    }
    
    // Also check by email to prevent duplicate emails
    const duplicateEmail = existingSubmissions.find(
      submission => submission.email.toLowerCase() === formData.email.toLowerCase()
    )
    
    if (duplicateEmail) {
      return NextResponse.json({
        success: false,
        error: 'An active submission already exists for this email address'
      } as TeamMatchingSubmissionResponse, { status: 409 })
    }

    // Save to database with user ID
    const savedSubmission = await TeamMatchingService.submitTeamMatchingForm(formData, formData.userId)
    
    // TODO: In future iterations, add:
    // 1. Send confirmation email
    // 2. Trigger team matching algorithm if enough submissions
    // 3. Create notification for user
    
    console.log('Team matching form submitted successfully:', {
      id: savedSubmission.id,
      email: savedSubmission.email,
      status: savedSubmission.status
    })
    
    return NextResponse.json({
      success: true,
      message: 'Team matching questionnaire submitted successfully! We\'ll notify you when a perfect match is found.',
      data: savedSubmission
    } as TeamMatchingSubmissionResponse)
    
  } catch (error) {
    console.error('Error processing team matching submission:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to process team matching submission: ${errorMessage}`
    } as TeamMatchingSubmissionResponse, { status: 500 })
  }
}