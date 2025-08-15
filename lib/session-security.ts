/**
 * Enhanced session security module
 * Handles session timeouts, concurrent sessions, and security monitoring
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase-admin'

interface SessionInfo {
  userId: string
  email: string
  lastActivity: number
  createdAt: number
  ipAddress: string
  userAgent: string
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'timeout' | 'suspicious' | 'concurrent'
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  timestamp: number
  details?: any
}

// Session configuration
const SESSION_CONFIG = {
  // Session timeout in milliseconds (30 minutes)
  TIMEOUT_MS: 30 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 3,
  
  // Suspicious activity detection
  MAX_IP_CHANGES: 5, // Max IP changes per session
  MAX_FAILED_ATTEMPTS: 5, // Max failed auth attempts
  
  // Session refresh threshold (refresh if session is older than this)
  REFRESH_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes
}

// In-memory stores (use Redis in production)
const activeSessions = new Map<string, SessionInfo>()
const securityEvents = new Map<string, SecurityEvent[]>()
const failedAttempts = new Map<string, number>()

/**
 * Extract client information from request
 */
function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const ipAddress = forwarded?.split(',')[0].trim() || realIP || cfConnectingIP || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}

/**
 * Check if session has timed out
 */
export function isSessionExpired(sessionInfo: SessionInfo): boolean {
  const now = Date.now()
  return (now - sessionInfo.lastActivity) > SESSION_CONFIG.TIMEOUT_MS
}

/**
 * Check if session needs refresh
 */
export function shouldRefreshSession(sessionInfo: SessionInfo): boolean {
  const now = Date.now()
  return (now - sessionInfo.lastActivity) > SESSION_CONFIG.REFRESH_THRESHOLD_MS
}

/**
 * Record security event
 */
function recordSecurityEvent(event: SecurityEvent): void {
  const userEvents = securityEvents.get(event.userId) || []
  userEvents.push(event)
  
  // Keep only last 100 events per user
  if (userEvents.length > 100) {
    userEvents.splice(0, userEvents.length - 100)
  }
  
  securityEvents.set(event.userId, userEvents)
  
  // Log security events
  console.log('Security Event:', {
    type: event.type,
    userId: event.userId,
    email: event.email,
    ipAddress: event.ipAddress,
    timestamp: new Date(event.timestamp).toISOString(),
    details: event.details
  })
}

/**
 * Create or update session
 */
export function createSession(
  userId: string,
  email: string,
  request: NextRequest
): SessionInfo {
  const { ipAddress, userAgent } = getClientInfo(request)
  const now = Date.now()
  
  const sessionInfo: SessionInfo = {
    userId,
    email,
    lastActivity: now,
    createdAt: now,
    ipAddress,
    userAgent
  }
  
  // Check for concurrent sessions
  const existingSessions = Array.from(activeSessions.values())
    .filter(session => session.userId === userId)
  
  if (existingSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const oldestSession = existingSessions
      .sort((a, b) => a.lastActivity - b.lastActivity)[0]
    
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session === oldestSession) {
        activeSessions.delete(sessionId)
        recordSecurityEvent({
          type: 'concurrent',
          userId,
          email,
          ipAddress,
          userAgent,
          timestamp: now,
          details: { reason: 'max_concurrent_sessions_exceeded' }
        })
        break
      }
    }
  }
  
  // Generate session ID
  const sessionId = `session_${userId}_${now}_${Math.random().toString(36).substr(2, 9)}`
  activeSessions.set(sessionId, sessionInfo)
  
  recordSecurityEvent({
    type: 'login',
    userId,
    email,
    ipAddress,
    userAgent,
    timestamp: now
  })
  
  return sessionInfo
}

/**
 * Update session activity
 */
export function updateSessionActivity(
  sessionId: string,
  request: NextRequest
): SessionInfo | null {
  const session = activeSessions.get(sessionId)
  if (!session) {
    return null
  }
  
  const { ipAddress, userAgent } = getClientInfo(request)
  const now = Date.now()
  
  // Check for suspicious IP changes
  if (session.ipAddress !== ipAddress) {
    recordSecurityEvent({
      type: 'suspicious',
      userId: session.userId,
      email: session.email,
      ipAddress,
      userAgent,
      timestamp: now,
      details: {
        reason: 'ip_address_change',
        oldIP: session.ipAddress,
        newIP: ipAddress
      }
    })
    
    // Update session with new IP
    session.ipAddress = ipAddress
  }
  
  // Check for user agent changes
  if (session.userAgent !== userAgent) {
    recordSecurityEvent({
      type: 'suspicious',
      userId: session.userId,
      email: session.email,
      ipAddress,
      userAgent,
      timestamp: now,
      details: {
        reason: 'user_agent_change',
        oldUA: session.userAgent,
        newUA: userAgent
      }
    })
  }
  
  // Update last activity
  session.lastActivity = now
  session.userAgent = userAgent
  
  activeSessions.set(sessionId, session)
  return session
}

/**
 * Validate session security
 */
export function validateSessionSecurity(
  sessionId: string,
  request: NextRequest
): { valid: boolean; reason?: string; shouldRefresh?: boolean } {
  const session = activeSessions.get(sessionId)
  
  if (!session) {
    return { valid: false, reason: 'session_not_found' }
  }
  
  // Check if session has expired
  if (isSessionExpired(session)) {
    removeSession(sessionId)
    recordSecurityEvent({
      type: 'timeout',
      userId: session.userId,
      email: session.email,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      timestamp: Date.now()
    })
    return { valid: false, reason: 'session_expired' }
  }
  
  // Check if session should be refreshed
  const shouldRefresh = shouldRefreshSession(session)
  
  return { valid: true, shouldRefresh }
}

/**
 * Remove session
 */
export function removeSession(sessionId: string): boolean {
  const session = activeSessions.get(sessionId)
  if (session) {
    recordSecurityEvent({
      type: 'logout',
      userId: session.userId,
      email: session.email,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      timestamp: Date.now()
    })
  }
  
  return activeSessions.delete(sessionId)
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (isSessionExpired(session)) {
      removeSession(sessionId)
      cleanedCount++
    }
  }
  
  return cleanedCount
}

/**
 * Record failed authentication attempt
 */
export function recordFailedAttempt(identifier: string): number {
  const current = failedAttempts.get(identifier) || 0
  const newCount = current + 1
  failedAttempts.set(identifier, newCount)
  
  // Clean up old entries after 1 hour
  setTimeout(() => {
    failedAttempts.delete(identifier)
  }, 60 * 60 * 1000)
  
  return newCount
}

/**
 * Check if identifier is blocked due to failed attempts
 */
export function isBlocked(identifier: string): boolean {
  const attempts = failedAttempts.get(identifier) || 0
  return attempts >= SESSION_CONFIG.MAX_FAILED_ATTEMPTS
}

/**
 * Clear failed attempts for identifier
 */
export function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier)
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  activeSessions: number
  totalSecurityEvents: number
  failedAttempts: number
} {
  return {
    activeSessions: activeSessions.size,
    totalSecurityEvents: Array.from(securityEvents.values())
      .reduce((total, events) => total + events.length, 0),
    failedAttempts: failedAttempts.size
  }
}

/**
 * Get security events for a user
 */
export function getUserSecurityEvents(userId: string): SecurityEvent[] {
  return securityEvents.get(userId) || []
}

/**
 * Enhanced session validation with Supabase
 */
export async function validateSupabaseSession(
  token: string,
  request: NextRequest
): Promise<{
  valid: boolean
  user?: any
  sessionInfo?: SessionInfo
  shouldRefresh?: boolean
  error?: string
}> {
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return {
        valid: false,
        error: error?.message || 'Invalid token'
      }
    }
    
    // Generate session ID from user and token
    const sessionId = `supabase_${user.id}_${token.slice(-10)}`
    
    // Validate session security
    const securityCheck = validateSessionSecurity(sessionId, request)
    
    if (!securityCheck.valid) {
      return {
        valid: false,
        error: securityCheck.reason
      }
    }
    
    // Update or create session
    let sessionInfo = updateSessionActivity(sessionId, request)
    if (!sessionInfo) {
      sessionInfo = createSession(user.id, user.email!, request)
    }
    
    return {
      valid: true,
      user,
      sessionInfo,
      shouldRefresh: securityCheck.shouldRefresh
    }
    
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      valid: false,
      error: 'Session validation failed'
    }
  }
}

// Periodic cleanup of expired sessions (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredSessions()
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired sessions`)
    }
  }, 5 * 60 * 1000)
}