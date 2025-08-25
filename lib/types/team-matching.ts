// =====================================================
// TEAM MATCHING SYSTEM TYPES
// =====================================================

export interface TeamMatchingSubmission {
  id: string
  user_id?: string
  full_name: string
  email: string
  whatsapp_number: string
  college_name: string
  current_year: string
  core_strengths: string[]
  preferred_roles: string[]
  team_preference: 'Undergrads only' | 'Postgrads only' | 'Either UG or PG'
  availability: string
  experience: string
  case_preferences: string[]
  preferred_team_size: number
  status: 'pending_match' | 'matched' | 'team_formed' | 'inactive'
  submitted_at: string
  matched_at?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  team_name?: string
  team_size: number
  compatibility_score?: number
  status: 'active' | 'inactive' | 'completed'
  chat_group_id?: string
  chat_group_invite_link?: string
  formed_at: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  submission_id: string
  role_in_team?: string
  joined_at: string
  created_at: string
}

export interface TeamMatchingBatch {
  id: string
  batch_name: string
  total_submissions: number
  teams_formed: number
  unmatched_count: number
  matching_algorithm_version?: string
  processing_started_at?: string
  processing_completed_at?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface TeamNotification {
  id: string
  submission_id: string
  team_id?: string
  notification_type: 'team_formed' | 'team_updated' | 'chat_created' | 'reminder'
  title: string
  message: string
  sent_at?: string
  delivery_status: 'pending' | 'sent' | 'failed'
  delivery_method: ('email' | 'sms' | 'whatsapp')[]
  created_at: string
}

// Extended types with relations
export interface TeamWithMembers extends Team {
  members: (TeamMember & {
    submission: TeamMatchingSubmission
  })[]
}

export interface SubmissionWithTeam extends TeamMatchingSubmission {
  team?: TeamWithMembers
  notifications?: TeamNotification[]
}

// Statistics and analytics types
export interface TeamMatchingStats {
  total_submissions: number
  pending_submissions: number
  matched_submissions: number
  total_teams: number
  active_teams: number
  avg_team_size: number
  avg_compatibility_score: number
}

// Form submission types (for API)
export interface TeamMatchingFormData {
  id: string
  userId?: string // Optional user ID for authenticated submissions
  fullName: string
  email: string
  whatsappNumber: string
  collegeName: string
  currentYear: string
  coreStrengths: string[]
  preferredRoles: string[]
  teamPreference: 'Undergrads only' | 'Postgrads only' | 'Either UG or PG'
  availability: string
  experience: string
  casePreferences: string[]
  preferredTeamSize: string
}

// API response types
export interface TeamMatchingSubmissionResponse {
  success: boolean
  message: string
  data?: TeamMatchingSubmission
  error?: string
}

export interface TeamFormationResponse {
  success: boolean
  message: string
  data?: {
    batch_id: string
    teams_formed: number
    total_matched: number
    unmatched_count: number
    teams: TeamWithMembers[]
  }
  error?: string
}

// Matching algorithm types
export interface MatchingCriteria {
  preferred_team_size: number
  availability_compatibility: boolean
  experience_level_balance: boolean
  skills_diversity: boolean
  case_preference_overlap: boolean
  college_diversity?: boolean
}

export interface CompatibilityScore {
  overall_score: number
  skill_compatibility: number
  availability_match: number
  experience_balance: number
  preference_alignment: number
  diversity_bonus: number
}

// Chat integration types
export interface ChatGroupConfig {
  platform: 'whatsapp' | 'discord' | 'telegram'
  group_name: string
  description: string
  members: {
    name: string
    phone?: string
    email: string
  }[]
}

export interface ChatGroupResponse {
  success: boolean
  group_id?: string
  invite_link?: string
  error?: string
}

// Notification types
export interface NotificationTemplate {
  type: TeamNotification['notification_type']
  title: string
  message: string
  delivery_methods: ('email' | 'sms' | 'whatsapp')[]
}

export interface NotificationContext {
  user_name: string
  team_name?: string
  team_members?: string[]
  chat_invite_link?: string
  team_size: number
  compatibility_score?: number
}

// Database query types
export interface TeamMatchingQuery {
  status?: TeamMatchingSubmission['status']
  submitted_after?: string
  submitted_before?: string
  preferred_team_size?: number
  availability?: string
  experience?: string
  college_name?: string
  limit?: number
  offset?: number
}

export interface TeamQuery {
  status?: Team['status']
  formed_after?: string
  formed_before?: string
  min_compatibility_score?: number
  team_size?: number
  limit?: number
  offset?: number
}

// Error types
export interface TeamMatchingError {
  code: string
  message: string
  details?: any
}

// Constants
export const TEAM_MATCHING_STATUS = {
  PENDING_MATCH: 'pending_match',
  MATCHED: 'matched',
  TEAM_FORMED: 'team_formed',
  INACTIVE: 'inactive'
} as const

export const TEAM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed'
} as const

export const NOTIFICATION_TYPES = {
  TEAM_FORMED: 'team_formed',
  TEAM_UPDATED: 'team_updated',
  CHAT_CREATED: 'chat_created',
  REMINDER: 'reminder'
} as const

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed'
} as const
