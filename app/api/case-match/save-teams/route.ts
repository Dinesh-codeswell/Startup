import { NextRequest, NextResponse } from 'next/server';
import { TeamMatchingService } from '@/lib/services/team-matching-db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdminOrRespond } from '@/lib/admin-api-protection';

// Force dynamic rendering for admin routes
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Verify admin access
  const adminError = await verifyAdminOrRespond(request);
  if (adminError) return adminError;
  try {
    const { teams, participants } = await request.json();
    
    if (!teams || !Array.isArray(teams)) {
      return NextResponse.json(
        { error: 'Invalid teams data' },
        { status: 400 }
      );
    }

    console.log(`Saving ${teams.length} teams to database...`);

    const savedTeams: any[] = [];
    const savedSubmissions: Array<{participantId: string, submissionId: string}> = [];

    // First, save all participants as submissions
    for (const participant of participants) {
      try {
        // Check if submission already exists
        const { data: existingSubmission } = await supabaseAdmin
          .from('team_matching_submissions')
          .select('id')
          .eq('email', participant.email)
          .single();

        let submissionId;
        
        if (existingSubmission) {
          submissionId = existingSubmission.id;
        } else {
          // Create new submission
          const submissionData = {
            id: uuidv4(),
            full_name: participant.fullName,
            email: participant.email,
            whatsapp_number: participant.whatsappNumber || '',
            college_name: participant.collegeName || '',
            current_year: participant.currentYear,
            core_strengths: participant.coreStrengths || [],
            preferred_roles: participant.preferredRoles || [],
            team_preference: participant.teamPreference || 'Either UG or PG',
            availability: participant.availability,
            experience: participant.experience,
            case_preferences: participant.casePreferences || [],
            preferred_team_size: participant.preferredTeamSize || 4,
            status: 'matched',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newSubmission, error: submissionError } = await supabaseAdmin
            .from('team_matching_submissions')
            .insert(submissionData)
            .select('id')
            .single();

          if (submissionError) {
            console.error('Error creating submission:', submissionError);
            continue;
          }

          submissionId = newSubmission.id;
        }

        savedSubmissions.push({
          participantId: participant.id,
          submissionId: submissionId
        });
      } catch (error) {
        console.error(`Error processing participant ${participant.fullName}:`, error);
      }
    }

    // Now save teams
    for (const team of teams) {
      try {
        // Get submission IDs for team members
        const memberSubmissionIds = team.members
          .map((member: any) => {
            const saved = savedSubmissions.find(s => s.participantId === member.id);
            return saved?.submissionId;
          })
          .filter(Boolean);

        if (memberSubmissionIds.length === 0) {
          console.warn(`No valid submissions found for team ${team.id}`);
          continue;
        }

        // Create team in database
        const teamData = {
          team_name: `Team ${team.id}`,
          team_size: team.teamSize,
          compatibility_score: team.compatibilityScore,
          member_submission_ids: memberSubmissionIds
        };

        const savedTeam = await TeamMatchingService.createTeam(teamData);
        savedTeams.push(savedTeam);

        console.log(`✅ Saved team: ${savedTeam.team_name} with ${memberSubmissionIds.length} members`);
      } catch (error) {
        console.error(`Error saving team ${team.id}:`, error);
      }
    }

    // Update submission statuses to 'matched'
    if (savedSubmissions.length > 0) {
      const submissionIds = savedSubmissions.map(s => s.submissionId);
      await supabaseAdmin
        .from('team_matching_submissions')
        .update({ 
          status: 'matched',
          matched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', submissionIds);
    }

    // Send notifications to team members (optional - can be enabled later)
    try {
      // Import notification service dynamically to avoid build issues
      const { NotificationService } = await import('@/lib/services/notification-service');
      
      for (const team of savedTeams) {
        // Note: Using createTeamFormationNotifications for teams array
        await NotificationService.createTeamFormationNotifications([team]);
      }
      console.log(`📧 Sent notifications for ${savedTeams.length} teams`);
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notifications:', notificationError);
      // Don't fail the entire operation if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedTeams.length} teams and ${savedSubmissions.length} participants`,
      savedTeams: savedTeams.length,
      savedParticipants: savedSubmissions.length,
      notificationsSent: savedTeams.length
    });

  } catch (error) {
    console.error('Error saving teams to database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save teams to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
