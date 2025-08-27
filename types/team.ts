// TypeScript interfaces for team data based on database schema

export interface TeamData {
  id: string
  team_name: string
  team_size: number
  compatibility_score: number
  status: string
  approval_status: string
  approved_by?: string
  approved_at?: string
  chat_group_id?: string
  chat_group_invite_link?: string
  created_at: string
}

export interface TeamMemberDetails {
  team_id: string
  id: string
  name: string
  role: string
  college: string
  classYear: string
  experience: string
  strengths: string
  isLeader: boolean
  displayName: string
  email: string
  bio: string
  teamBenefit: string
}

export interface TeamMatchingSubmission {
  id: string
  user_id: string
  full_name: string
  email: string
  whatsapp_number: string
  college_name: string
  course: string
  current_year: string
  core_strengths: string
  preferred_roles: string
  availability: string
  experience: string
  case_preferences: string
  preferred_team_size: number
  status: string
  submitted_at: string
  matched_at?: string
  team_preference: string
}

export interface TeamMember {
  id: string
  team_id: string
  submission_id: string
  role_in_team: string
  joined_at: string
  updated_at: string
  created_at: string
}

// Combined interface for team member display
export interface TeamMemberDisplay {
  id: string
  name: string
  role: string
  college: string
  classYear: string
  experience: string
  strengths: string[]
  isLeader: boolean
  email: string
  bio: string
  teamBenefit: string
  preferredRoles: string[]
  availability: string
}

// Complete team information interface
export interface CompleteTeamData {
  team: TeamData
  members: TeamMemberDisplay[]
  memberCount: number
  formationDate: string
}

// API response interfaces
export interface TeamApiResponse {
  success: boolean
  data?: CompleteTeamData
  error?: string
}

export interface TeamMembersApiResponse {
  success: boolean
  data?: TeamMemberDisplay[]
  error?: string
}