// =====================================================
// TEAM CHAT SYSTEM TYPES
// =====================================================

export interface TeamChatMessage {
  id: string
  team_id: string
  sender_submission_id: string | null // null for system messages
  message_text: string
  message_type: 'text' | 'system' | 'file' | 'image'
  reply_to_message_id?: string
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface TeamChatParticipant {
  id: string
  team_id: string
  submission_id: string
  joined_at: string
  last_seen_at: string
  last_message_seen_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeamChatReaction {
  id: string
  message_id: string
  sender_submission_id: string
  reaction_emoji: string
  created_at: string
}

export interface TeamChatTypingIndicator {
  id: string
  team_id: string
  submission_id: string
  is_typing: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface TeamChatMessageWithSender extends TeamChatMessage {
  sender?: {
    id: string
    full_name: string
    college_name: string
  }
  reactions?: TeamChatReaction[]
  reply_to?: TeamChatMessage
}

export interface TeamChatParticipantWithDetails extends TeamChatParticipant {
  submission: {
    id: string
    full_name: string
    college_name: string
    current_year: string
  }
  unread_count?: number
}

// API request/response types
export interface SendMessageRequest {
  team_id: string
  message_text: string
  message_type?: 'text' | 'file' | 'image'
  reply_to_message_id?: string
}

export interface SendMessageResponse {
  success: boolean
  message?: string
  data?: TeamChatMessageWithSender
  error?: string
}

export interface GetMessagesRequest {
  team_id: string
  limit?: number
  offset?: number
  before_message_id?: string
  after_message_id?: string
}

export interface GetMessagesResponse {
  success: boolean
  data?: {
    messages: TeamChatMessageWithSender[]
    has_more: boolean
    total_count: number
  }
  error?: string
}

export interface UpdateTypingRequest {
  team_id: string
  is_typing: boolean
}

export interface UpdateTypingResponse {
  success: boolean
  message?: string
  error?: string
}

export interface AddReactionRequest {
  message_id: string
  reaction_emoji: string
}

export interface AddReactionResponse {
  success: boolean
  data?: TeamChatReaction
  error?: string
}

export interface MarkMessagesReadRequest {
  team_id: string
  last_message_id: string
}

export interface MarkMessagesReadResponse {
  success: boolean
  message?: string
  error?: string
}

// Chat statistics and analytics
export interface TeamChatStats {
  total_messages: number
  messages_today: number
  active_participants: number
  most_active_member: {
    name: string
    message_count: number
  }
  recent_activity: {
    date: string
    message_count: number
  }[]
}

// Real-time event types
export interface ChatEvent {
  type: 'message' | 'typing' | 'reaction' | 'user_joined' | 'user_left'
  team_id: string
  data: any
  timestamp: string
}

export interface NewMessageEvent extends ChatEvent {
  type: 'message'
  data: TeamChatMessageWithSender
}

export interface TypingEvent extends ChatEvent {
  type: 'typing'
  data: {
    user_name: string
    submission_id: string
    is_typing: boolean
  }
}

export interface ReactionEvent extends ChatEvent {
  type: 'reaction'
  data: {
    message_id: string
    reaction: TeamChatReaction
    action: 'added' | 'removed'
  }
}

// Chat configuration
export interface TeamChatConfig {
  max_message_length: number
  allowed_file_types: string[]
  max_file_size: number // in bytes
  enable_reactions: boolean
  enable_replies: boolean
  enable_typing_indicators: boolean
  message_retention_days: number
}

// Error types
export interface TeamChatError {
  code: string
  message: string
  details?: any
}

// Constants
export const CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  SYSTEM: 'system',
  FILE: 'file',
  IMAGE: 'image'
} as const

export const CHAT_EVENTS = {
  MESSAGE: 'message',
  TYPING: 'typing',
  REACTION: 'reaction',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
} as const

export const DEFAULT_CHAT_CONFIG: TeamChatConfig = {
  max_message_length: 2000,
  allowed_file_types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  max_file_size: 10 * 1024 * 1024, // 10MB
  enable_reactions: true,
  enable_replies: true,
  enable_typing_indicators: true,
  message_retention_days: 365
}

// Popular emoji reactions
export const POPULAR_REACTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '👏'
]