import { TeamMatchingService } from './team-matching-db'
import { enhancedIterativeMatching } from '@/lib/enhanced-iterative-matching'
import type { 
  TeamMatchingSubmission, 
  TeamWithMembers, 
  TeamMatchingBatch,
  NotificationTemplate,
  NotificationContext
} from '@/lib/types/team-matching'

export interface AutomatedFormationConfig {
  minSubmissions: number // Minimum submissions needed to trigger formation
  maxWaitTime: number // Maximum wait time in hours before forcing formation
  batchSize: number // Maximum submissions to process in one batch
  enableNotifications: boolean
  enableChatGroups: boolean
}

export interface FormationResult {
  success: boolean
  batchId: string
  teamsFormed: number
  participantsMatched: number
  participantsUnmatched: number
  teams: TeamWithMembers[]
  errors: string[]
  processingTime: number
}

export class AutomatedTeamFormationService {
  private static defaultConfig: AutomatedFormationConfig = {
    minSubmissions: 4, // Need at least 4 people to form 2 teams of 2
    maxWaitTime: 48, // 48 hours maximum wait
    batchSize: 100, // Process up to 100 submissions at once
    enableNotifications: true,
    enableChatGroups: false // Will be enabled in Phase 2C
  }

  /**
   * Check if team formation should be triggered
   */
  static async shouldTriggerFormation(config: Partial<AutomatedFormationConfig> = {}): Promise<{
    shouldTrigger: boolean
    reason: string
    pendingCount: number
    oldestSubmissionAge: number
  }> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    try {
      // Get pending submissions
      const pendingSubmissions = await TeamMatchingService.getPendingSubmissions()
      
      if (pendingSubmissions.length === 0) {
        return {
          shouldTrigger: false,
          reason: 'No pending submissions',
          pendingCount: 0,
          oldestSubmissionAge: 0
        }
      }

      // Check minimum submissions threshold
      if (pendingSubmissions.length < finalConfig.minSubmissions) {
        return {
          shouldTrigger: false,
          reason: `Not enough submissions (${pendingSubmissions.length}/${finalConfig.minSubmissions})`,
          pendingCount: pendingSubmissions.length,
          oldestSubmissionAge: this.getOldestSubmissionAge(pendingSubmissions)
        }
      }

      // Check maximum wait time
      const oldestAge = this.getOldestSubmissionAge(pendingSubmissions)
      if (oldestAge >= finalConfig.maxWaitTime) {
        return {
          shouldTrigger: true,
          reason: `Maximum wait time exceeded (${oldestAge.toFixed(1)}h >= ${finalConfig.maxWaitTime}h)`,
          pendingCount: pendingSubmissions.length,
          oldestSubmissionAge: oldestAge
        }
      }

      // Check if we have good matching potential
      const matchingPotential = this.assessMatchingPotential(pendingSubmissions)
      if (matchingPotential.score >= 0.7) { // 70% matching potential
        return {
          shouldTrigger: true,
          reason: `Good matching potential detected (${(matchingPotential.score * 100).toFixed(0)}%)`,
          pendingCount: pendingSubmissions.length,
          oldestSubmissionAge: oldestAge
        }
      }

      return {
        shouldTrigger: false,
        reason: `Waiting for better matches (potential: ${(matchingPotential.score * 100).toFixed(0)}%)`,
        pendingCount: pendingSubmissions.length,
        oldestSubmissionAge: oldestAge
      }

    } catch (error) {
      console.error('Error checking formation trigger:', error)
      return {
        shouldTrigger: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        pendingCount: 0,
        oldestSubmissionAge: 0
      }
    }
  }

  /**
   * Run automated team formation
   */
  static async runAutomatedFormation(config: Partial<AutomatedFormationConfig> = {}): Promise<FormationResult> {
    const startTime = Date.now()
    const finalConfig = { ...this.defaultConfig, ...config }
    const batchId = `auto_${Date.now()}`
    
    console.log(`🤖 Starting automated team formation (batch: ${batchId})`)
    
    try {
      // Check if formation should be triggered
      const triggerCheck = await this.shouldTriggerFormation(finalConfig)
      if (!triggerCheck.shouldTrigger) {
        return {
          success: false,
          batchId,
          teamsFormed: 0,
          participantsMatched: 0,
          participantsUnmatched: triggerCheck.pendingCount,
          teams: [],
          errors: [`Formation not triggered: ${triggerCheck.reason}`],
          processingTime: Date.now() - startTime
        }
      }

      console.log(`✅ Formation triggered: ${triggerCheck.reason}`)

      // Get pending submissions (limited by batch size)
      const pendingSubmissions = await TeamMatchingService.getSubmissions({
        status: 'pending_match',
        limit: finalConfig.batchSize
      })

      if (pendingSubmissions.length === 0) {
        return {
          success: false,
          batchId,
          teamsFormed: 0,
          participantsMatched: 0,
          participantsUnmatched: 0,
          teams: [],
          errors: ['No pending submissions found'],
          processingTime: Date.now() - startTime
        }
      }

      console.log(`📊 Processing ${pendingSubmissions.length} submissions`)

      // Transform submissions for matching algorithm
      const participantsForMatching = this.transformSubmissionsForAlgorithm(pendingSubmissions)

      // Run matching algorithm
      console.log('🧠 Running matching algorithm...')
      const matchingResult = enhancedIterativeMatching(participantsForMatching, {
        maxIterations: 30,
        enableProgressiveRelaxation: true,
        enableDetailedLogging: false // Reduce logs for automated runs
      })

      console.log(`🎯 Algorithm results: ${matchingResult.teams.length} teams, ${matchingResult.unmatched.length} unmatched`)

      // Create teams in database
      const createdTeams: TeamWithMembers[] = []
      const errors: string[] = []

      for (let i = 0; i < matchingResult.teams.length; i++) {
        const algorithmTeam = matchingResult.teams[i]
        
        try {
          const teamData = {
            team_name: `Team ${Date.now()}_${i + 1}`,
            team_size: algorithmTeam.teamSize,
            compatibility_score: algorithmTeam.compatibilityScore,
            member_submission_ids: algorithmTeam.members.map(member => member.id)
          }

          const createdTeam = await TeamMatchingService.createTeam(teamData)
          createdTeams.push(createdTeam)
          
          console.log(`✅ Created team ${i + 1} with ${algorithmTeam.members.length} members (score: ${algorithmTeam.compatibilityScore.toFixed(1)})`)
          
        } catch (error) {
          const errorMsg = `Failed to create team ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      // Send notifications if enabled
      if (finalConfig.enableNotifications && createdTeams.length > 0) {
        console.log('📧 Sending notifications...')
        await this.sendTeamFormationNotifications(createdTeams)
      }

      // TODO: Create chat groups if enabled (Phase 2C)
      if (finalConfig.enableChatGroups && createdTeams.length > 0) {
        console.log('💬 Creating chat groups...')
        // Will be implemented in Phase 2C
      }

      const processingTime = Date.now() - startTime
      const participantsMatched = createdTeams.reduce((sum, team) => sum + team.team_size, 0)
      const participantsUnmatched = pendingSubmissions.length - participantsMatched

      console.log(`🎉 Formation completed in ${processingTime}ms`)
      console.log(`📈 Results: ${createdTeams.length} teams, ${participantsMatched} matched, ${participantsUnmatched} unmatched`)

      return {
        success: true,
        batchId,
        teamsFormed: createdTeams.length,
        participantsMatched,
        participantsUnmatched,
        teams: createdTeams,
        errors,
        processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('❌ Automated formation failed:', errorMsg)
      
      return {
        success: false,
        batchId,
        teamsFormed: 0,
        participantsMatched: 0,
        participantsUnmatched: 0,
        teams: [],
        errors: [errorMsg],
        processingTime
      }
    }
  }

  /**
   * Schedule automated team formation (for cron jobs)
   */
  static async scheduleFormation(intervalHours: number = 6): Promise<void> {
    console.log(`⏰ Scheduling automated team formation every ${intervalHours} hours`)
    
    const runFormation = async () => {
      try {
        const result = await this.runAutomatedFormation()
        
        if (result.success && result.teamsFormed > 0) {
          console.log(`✅ Scheduled formation successful: ${result.teamsFormed} teams formed`)
        } else if (!result.success) {
          console.log(`ℹ️  Scheduled formation skipped: ${result.errors[0]}`)
        }
      } catch (error) {
        console.error('❌ Scheduled formation error:', error)
      }
    }

    // Run immediately
    await runFormation()

    // Schedule recurring runs
    setInterval(runFormation, intervalHours * 60 * 60 * 1000)
  }

  /**
   * Get formation statistics
   */
  static async getFormationStats(days: number = 7): Promise<{
    totalBatches: number
    totalTeamsFormed: number
    totalParticipantsMatched: number
    averageTeamSize: number
    averageCompatibilityScore: number
    formationRate: number // teams per day
  }> {
    try {
      const stats = await TeamMatchingService.getTeamMatchingStats()
      
      // Calculate formation rate (simplified - would need batch tracking for accuracy)
      const formationRate = stats.total_teams / days

      return {
        totalBatches: 0, // Would need batch tracking table
        totalTeamsFormed: stats.total_teams,
        totalParticipantsMatched: stats.matched_submissions,
        averageTeamSize: stats.avg_team_size,
        averageCompatibilityScore: stats.avg_compatibility_score,
        formationRate
      }
    } catch (error) {
      console.error('Error getting formation stats:', error)
      return {
        totalBatches: 0,
        totalTeamsFormed: 0,
        totalParticipantsMatched: 0,
        averageTeamSize: 0,
        averageCompatibilityScore: 0,
        formationRate: 0
      }
    }
  }

  // Private helper methods

  private static getOldestSubmissionAge(submissions: TeamMatchingSubmission[]): number {
    if (submissions.length === 0) return 0
    
    const oldest = submissions.reduce((oldest, current) => 
      new Date(current.submitted_at) < new Date(oldest.submitted_at) ? current : oldest
    )
    
    const ageMs = Date.now() - new Date(oldest.submitted_at).getTime()
    return ageMs / (1000 * 60 * 60) // Convert to hours
  }

  private static assessMatchingPotential(submissions: TeamMatchingSubmission[]): {
    score: number
    factors: {
      sizeCompatibility: number
      availabilityMatch: number
      experienceBalance: number
      skillDiversity: number
    }
  } {
    if (submissions.length < 2) {
      return { score: 0, factors: { sizeCompatibility: 0, availabilityMatch: 0, experienceBalance: 0, skillDiversity: 0 } }
    }

    // Analyze team size preferences
    const sizeCounts = submissions.reduce((acc, sub) => {
      acc[sub.preferred_team_size] = (acc[sub.preferred_team_size] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    let sizeCompatibility = 0
    Object.entries(sizeCounts).forEach(([size, count]) => {
      const teamSize = parseInt(size)
      const possibleTeams = Math.floor(count / teamSize)
      sizeCompatibility += possibleTeams * teamSize
    })
    sizeCompatibility = sizeCompatibility / submissions.length

    // Analyze availability compatibility
    const availabilityCounts = submissions.reduce((acc, sub) => {
      acc[sub.availability] = (acc[sub.availability] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const availabilityMatch = Math.max(...Object.values(availabilityCounts)) / submissions.length

    // Analyze experience balance
    const experienceLevels = ['None', 'Participated in 1–2', 'Participated in 3+', 'Finalist/Winner in at least one']
    const experienceDistribution = experienceLevels.map(level => 
      submissions.filter(sub => sub.experience === level).length
    )
    const experienceBalance = 1 - (Math.max(...experienceDistribution) / submissions.length)

    // Analyze skill diversity
    const allSkills = submissions.flatMap(sub => sub.core_strengths)
    const uniqueSkills = new Set(allSkills).size
    const skillDiversity = Math.min(uniqueSkills / 10, 1) // Normalize to max 10 skills

    const factors = {
      sizeCompatibility,
      availabilityMatch,
      experienceBalance,
      skillDiversity
    }

    // Weighted average
    const score = (
      sizeCompatibility * 0.4 +
      availabilityMatch * 0.3 +
      experienceBalance * 0.2 +
      skillDiversity * 0.1
    )

    return { score, factors }
  }

  private static transformSubmissionsForAlgorithm(submissions: TeamMatchingSubmission[]) {
    return submissions.map(submission => ({
      id: submission.id,
      fullName: submission.full_name,
      email: submission.email,
      whatsappNumber: submission.whatsapp_number,
      collegeName: submission.college_name,
      currentYear: submission.current_year,
      coreStrengths: submission.core_strengths,
      preferredRoles: submission.preferred_roles,
      availability: submission.availability,
      experience: submission.experience,
      casePreferences: submission.case_preferences,
      preferredTeamSize: submission.preferred_team_size,
      // Default values for algorithm compatibility
      teamPreference: 'Mixed (UG + PG)',
      workingStyle: [],
      idealTeamStructure: [],
      lookingFor: submission.preferred_teammate_roles,
      workStyle: []
    }))
  }

  private static async sendTeamFormationNotifications(teams: TeamWithMembers[]): Promise<void> {
    const notificationTemplate: NotificationTemplate = {
      type: 'team_formed',
      title: 'Your Team Has Been Formed! 🎉',
      message: `Great news! You've been matched with {team_size} amazing teammates for case competitions. Your team has a compatibility score of {compatibility_score}%. Team members: {team_members}. Get ready to collaborate and win together!`,
      delivery_methods: ['email'] // SMS will be added later
    }

    for (const team of teams) {
      const teamMemberNames = team.members.map(member => member.submission.full_name)
      
      for (const member of team.members) {
        const otherMembers = teamMemberNames.filter(name => name !== member.submission.full_name)
        
        const context: NotificationContext = {
          user_name: member.submission.full_name,
          team_name: team.team_name || `Team ${team.id.slice(0, 8)}`,
          team_members: otherMembers,
          team_size: team.team_size,
          compatibility_score: team.compatibility_score
        }

        try {
          await TeamMatchingService.createNotification(
            member.submission_id,
            team.id,
            notificationTemplate,
            context
          )
        } catch (error) {
          console.error(`Failed to create notification for ${member.submission.full_name}:`, error)
        }
      }
    }

    console.log(`📧 Created ${teams.reduce((sum, team) => sum + team.members.length, 0)} notifications`)
  }
}