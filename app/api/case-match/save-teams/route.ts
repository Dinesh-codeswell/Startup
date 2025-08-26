import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TeamMatchingService } from "@/lib/services/team-matching-db";
import { v4 as uuidv4 } from "uuid";

// Force dynamic rendering for admin routes
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Admin protection removed - endpoint is now publicly accessible
  try {
    const { teams, participants, unmatched } = await request.json();

    if (!teams || !Array.isArray(teams)) {
      return NextResponse.json(
        { error: "Invalid teams data" },
        { status: 400 }
      );
    }

    if (!participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: "Invalid participants data" },
        { status: 400 }
      );
    }

    console.log(
      `Saving ${teams.length} teams and ${participants.length} participants to database...`
    );

    const savedTeams: any[] = [];
    const savedSubmissions: Array<{
      participantEmail: string;
      submissionId: string;
    }> = [];
    const errors: string[] = [];

    // First, save all participants as submissions (both matched and unmatched)
    const allParticipants = [...participants, ...(unmatched || [])];

    for (const participant of allParticipants) {
      try {
        // Check if submission already exists by email
        const { data: existingSubmission } = await supabaseAdmin
          .from("team_matching_submissions")
          .select("id, status")
          .eq("email", participant.email)
          .single();

        let submissionId;

        if (existingSubmission) {
          submissionId = existingSubmission.id;
          console.log(
            `Found existing submission for ${participant.email}: ${submissionId}`
          );
        } else {
          // Create new submission with proper field mapping
          const submissionData = {
            id: uuidv4(),
            user_id: null, // CSV participants don't have user accounts
            full_name: participant.fullName || participant.name || "Unknown",
            email: participant.email,
            whatsapp_number:
              participant.whatsappNumber || participant.whatsapp || "",
            college_name: participant.collegeName || participant.college || "",
            current_year:
              participant.currentYear || participant.year || "Unknown",
            core_strengths: participant.coreStrengths || [],
            preferred_roles: participant.preferredRoles || [],
            team_preference: participant.teamPreference || "Either UG or PG",
            availability: participant.availability || "Available",
            experience: participant.experience || "Beginner",
            case_preferences: participant.casePreferences || [],
            preferred_team_size: parseInt(participant.preferredTeamSize) || 4,
            status: "pending_match", // Will be updated later for matched participants
          };

          console.log(
            `Creating new submission for ${participant.email}:`,
            submissionData
          );

          const { data: newSubmission, error: submissionError } =
            await supabaseAdmin
              .from("team_matching_submissions")
              .insert(submissionData)
              .select("id")
              .single();

          if (submissionError) {
            console.error("Error creating submission:", submissionError);
            errors.push(
              `Failed to create submission for ${participant.email}: ${submissionError.message}`
            );
            continue;
          }

          submissionId = newSubmission.id;
          console.log(
            `✅ Created new submission: ${submissionId} for ${participant.email}`
          );
        }

        savedSubmissions.push({
          participantEmail: participant.email,
          submissionId: submissionId,
        });
      } catch (error) {
        console.error(
          `Error processing participant ${
            participant.fullName || participant.email
          }:`,
          error
        );
        errors.push(
          `Error processing ${participant.email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log(`Processed ${savedSubmissions.length} submissions`);

    // Now save teams
    console.log(`Starting to save ${teams.length} teams...`);

    for (const team of teams) {
      try {
        console.log(
          `Processing team ${team.id} with ${team.members?.length || 0} members`
        );

        // Get submission IDs for team members using email as the key
        const memberSubmissionIds = team.members
          .map((member: any) => {
            const saved = savedSubmissions.find(
              (s) => s.participantEmail === member.email
            );
            if (!saved) {
              console.warn(
                `No submission found for team member ${member.email} (${member.fullName})`
              );
              console.warn(
                `Available emails in savedSubmissions:`,
                savedSubmissions.map((s) => s.participantEmail)
              );
            } else {
              console.log(
                `Found submission ${saved.submissionId} for ${member.email}`
              );
            }
            return saved?.submissionId;
          })
          .filter(Boolean);

        console.log(
          `Team ${team.id}: Found ${
            memberSubmissionIds.length
          } valid submission IDs out of ${team.members?.length || 0} members`
        );

        if (memberSubmissionIds.length === 0) {
          console.warn(`No valid submissions found for team ${team.id}`);
          errors.push(`No valid submissions found for team ${team.id}`);
          continue;
        }

        // Create team in database
        const teamData = {
          team_name: `Team ${team.id}`,
          team_size: team.teamSize || memberSubmissionIds.length,
          compatibility_score: team.compatibilityScore || 0,
          member_submission_ids: memberSubmissionIds,
        };

        console.log(`Creating team with data:`, teamData);

        const savedTeam = await TeamMatchingService.createTeam(teamData);
        savedTeams.push(savedTeam);

        console.log(
          `✅ Saved team: ${savedTeam.team_name} with ${memberSubmissionIds.length} members`
        );
      } catch (error) {
        console.error(`Error saving team ${team.id}:`, error);
        errors.push(
          `Error saving team ${team.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log(
      `Completed team saving. Total teams saved: ${savedTeams.length}`
    );

    // Update submission statuses for matched participants
    const matchedSubmissionIds = teams
      .flatMap((team) =>
        team.members.map((member: any) => member.submissionId || member.id)
      )
      .filter(Boolean);

    console.log(
      `Found ${matchedSubmissionIds.length} matched submission IDs to update:`,
      matchedSubmissionIds
    );

    if (matchedSubmissionIds.length > 0) {
      console.log(
        `Updating ${matchedSubmissionIds.length} submissions to 'team_formed' status`
      );

      // First, verify these submissions exist
      const { data: existingSubmissions, error: checkError } =
        await supabaseAdmin
          .from("team_matching_submissions")
          .select("id, email, status")
          .in("id", matchedSubmissionIds);

      if (checkError) {
        console.error("Error checking existing submissions:", checkError);
        errors.push(`Error checking submissions: ${checkError.message}`);
      } else {
        console.log(
          `Found ${
            existingSubmissions?.length || 0
          } existing submissions to update`
        );
        existingSubmissions?.forEach((sub) => {
          console.log(`  - ${sub.email}: current status = ${sub.status}`);
        });
      }

      // Now update the statuses (no updated_at column exists)
      const { data: updatedSubmissions, error: updateError } =
        await supabaseAdmin
          .from("team_matching_submissions")
          .update({
            status: "team_formed",
          })
          .in("id", matchedSubmissionIds)
          .select("id, email, status");

      if (updateError) {
        console.error("Error updating submission statuses:", updateError);
        errors.push(
          `Error updating submission statuses: ${updateError.message}`
        );
      } else {
        console.log(
          `✅ Successfully updated ${
            updatedSubmissions?.length || 0
          } submissions to team_formed status`
        );
        updatedSubmissions?.forEach((sub) => {
          console.log(`  - ${sub.email}: new status = ${sub.status}`);
        });
      }
    } else {
      console.warn(
        "⚠️ No matched submission IDs found - status update skipped"
      );
      errors.push("No matched submission IDs found for status update");
    }

    // Send notifications to team members (optional - can be enabled later)
    let notificationsSent = 0;
    try {
      // Import notification service dynamically to avoid build issues
      const { NotificationService } = await import(
        "@/lib/services/notification-service"
      );

      for (const team of savedTeams) {
        try {
          await NotificationService.createTeamFormationNotifications([team]);
          notificationsSent++;
        } catch (notifError) {
          console.warn(
            `Failed to send notification for team ${team.team_name}:`,
            notifError
          );
        }
      }
      console.log(`📧 Sent notifications for ${notificationsSent} teams`);
    } catch (notificationError) {
      console.warn("⚠️ Failed to send notifications:", notificationError);
      // Don't fail the entire operation if notifications fail
    }

    const response = {
      success: true,
      message: `Successfully saved ${savedTeams.length} teams and ${savedSubmissions.length} participants`,
      data: {
        savedTeams: savedTeams.length,
        savedParticipants: savedSubmissions.length,
        matchedParticipants: matchedSubmissionIds.length,
        unmatchedParticipants: (unmatched || []).length,
        notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      },
    };

    console.log("Save operation completed:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving teams to database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save teams to database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
