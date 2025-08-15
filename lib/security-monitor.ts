/**
 * Security monitoring and audit logging module
 * Provides comprehensive security event tracking and threat detection
 */

import { NextRequest } from 'next/server'

interface SecurityLog {
  id: string
  timestamp: number
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'auth' | 'access' | 'rate_limit' | 'session' | 'admin' | 'suspicious'
  event: string
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  path: string
  method: string
  statusCode?: number
  details?: any
  riskScore: number
}

interface ThreatPattern {
  name: string
  description: string
  indicators: string[]
  riskScore: number
  action: 'log' | 'block' | 'alert'
}

interface SecurityMetrics {
  totalEvents: number
  highRiskEvents: number
  blockedRequests: number
  suspiciousIPs: Set<string>
  failedLogins: number
  adminAccess: number
  rateLimitHits: number
  lastUpdated: number
}

// Security configuration
const SECURITY_CONFIG = {
  // Risk score thresholds
  LOW_RISK: 25,
  MEDIUM_RISK: 50,
  HIGH_RISK: 75,
  CRITICAL_RISK: 90,
  
  // Log retention (in milliseconds)
  LOG_RETENTION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Alert thresholds
  FAILED_LOGIN_THRESHOLD: 5,
  SUSPICIOUS_IP_THRESHOLD: 10,
  ADMIN_ACCESS_THRESHOLD: 20,
  
  // Monitoring intervals
  METRICS_UPDATE_INTERVAL: 60 * 1000, // 1 minute
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
}

// Threat detection patterns
const THREAT_PATTERNS: ThreatPattern[] = [
  {
    name: 'SQL Injection Attempt',
    description: 'Potential SQL injection in request parameters',
    indicators: ['union select', 'drop table', '\'or\'1\'=\'1', 'exec(', 'script>'],
    riskScore: 85,
    action: 'block'
  },
  {
    name: 'XSS Attempt',
    description: 'Cross-site scripting attempt detected',
    indicators: ['<script', 'javascript:', 'onerror=', 'onload=', 'eval('],
    riskScore: 75,
    action: 'block'
  },
  {
    name: 'Path Traversal',
    description: 'Directory traversal attempt',
    indicators: ['../../../', '..\\..\\', '%2e%2e%2f', '%2e%2e%5c'],
    riskScore: 70,
    action: 'block'
  },
  {
    name: 'Admin Brute Force',
    description: 'Multiple failed admin login attempts',
    indicators: ['/admin', '/login', 'admin@', 'administrator'],
    riskScore: 80,
    action: 'alert'
  },
  {
    name: 'Suspicious User Agent',
    description: 'Automated tool or bot detected',
    indicators: ['sqlmap', 'nikto', 'nmap', 'burp', 'curl/7', 'python-requests'],
    riskScore: 60,
    action: 'log'
  },
  {
    name: 'Rate Limit Abuse',
    description: 'Excessive requests from single source',
    indicators: ['rate_limit_exceeded'],
    riskScore: 65,
    action: 'alert'
  }
]

// In-memory stores (use database in production)
const securityLogs: SecurityLog[] = []
const securityMetrics: SecurityMetrics = {
  totalEvents: 0,
  highRiskEvents: 0,
  blockedRequests: 0,
  suspiciousIPs: new Set(),
  failedLogins: 0,
  adminAccess: 0,
  rateLimitHits: 0,
  lastUpdated: Date.now()
}

const ipRiskScores = new Map<string, number>()
const blockedIPs = new Set<string>()

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract request information
 */
function extractRequestInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const ipAddress = forwarded?.split(',')[0].trim() || realIP || cfConnectingIP || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const path = request.nextUrl.pathname
  const method = request.method
  
  return { ipAddress, userAgent, path, method }
}

/**
 * Calculate risk score based on various factors
 */
function calculateRiskScore(
  category: SecurityLog['category'],
  event: string,
  ipAddress: string,
  userAgent: string,
  path: string,
  details?: any
): number {
  let riskScore = 0
  
  // Base risk by category
  const categoryRisk = {
    'auth': 30,
    'access': 20,
    'rate_limit': 40,
    'session': 25,
    'admin': 50,
    'suspicious': 70
  }
  
  riskScore += categoryRisk[category] || 10
  
  // Check threat patterns
  const requestContent = `${path} ${userAgent} ${JSON.stringify(details || {})}`
  for (const pattern of THREAT_PATTERNS) {
    for (const indicator of pattern.indicators) {
      if (requestContent.toLowerCase().includes(indicator.toLowerCase())) {
        riskScore = Math.max(riskScore, pattern.riskScore)
        break
      }
    }
  }
  
  // IP reputation
  const ipRisk = ipRiskScores.get(ipAddress) || 0
  riskScore += ipRisk * 0.3
  
  // Admin path access
  if (path.includes('/admin')) {
    riskScore += 20
  }
  
  // Failed authentication
  if (event.includes('failed') || event.includes('unauthorized')) {
    riskScore += 15
  }
  
  // Rate limiting
  if (event.includes('rate_limit')) {
    riskScore += 25
  }
  
  return Math.min(riskScore, 100)
}

/**
 * Detect threats in request
 */
export function detectThreats(
  request: NextRequest,
  details?: any
): { threats: ThreatPattern[]; maxRiskScore: number } {
  const { userAgent, path } = extractRequestInfo(request)
  const requestContent = `${path} ${userAgent} ${JSON.stringify(details || {})}`
  
  const detectedThreats: ThreatPattern[] = []
  let maxRiskScore = 0
  
  for (const pattern of THREAT_PATTERNS) {
    for (const indicator of pattern.indicators) {
      if (requestContent.toLowerCase().includes(indicator.toLowerCase())) {
        detectedThreats.push(pattern)
        maxRiskScore = Math.max(maxRiskScore, pattern.riskScore)
        break
      }
    }
  }
  
  return { threats: detectedThreats, maxRiskScore }
}

/**
 * Log security event
 */
export function logSecurityEvent(
  request: NextRequest,
  level: SecurityLog['level'],
  category: SecurityLog['category'],
  event: string,
  options: {
    userId?: string
    email?: string
    statusCode?: number
    details?: any
  } = {}
): SecurityLog {
  const { ipAddress, userAgent, path, method } = extractRequestInfo(request)
  const timestamp = Date.now()
  
  const riskScore = calculateRiskScore(
    category,
    event,
    ipAddress,
    userAgent,
    path,
    options.details
  )
  
  const logEntry: SecurityLog = {
    id: generateLogId(),
    timestamp,
    level,
    category,
    event,
    userId: options.userId,
    email: options.email,
    ipAddress,
    userAgent,
    path,
    method,
    statusCode: options.statusCode,
    details: options.details,
    riskScore
  }
  
  // Add to logs
  securityLogs.push(logEntry)
  
  // Update metrics
  updateSecurityMetrics(logEntry)
  
  // Update IP risk score
  updateIPRiskScore(ipAddress, riskScore)
  
  // Handle high-risk events
  if (riskScore >= SECURITY_CONFIG.HIGH_RISK) {
    handleHighRiskEvent(logEntry)
  }
  
  // Console logging with appropriate level
  const logMessage = {
    id: logEntry.id,
    level,
    category,
    event,
    riskScore,
    ipAddress,
    path,
    timestamp: new Date(timestamp).toISOString()
  }
  
  switch (level) {
    case 'critical':
    case 'error':
      console.error('Security Event:', logMessage)
      break
    case 'warning':
      console.warn('Security Event:', logMessage)
      break
    default:
      console.log('Security Event:', logMessage)
  }
  
  return logEntry
}

/**
 * Update security metrics
 */
function updateSecurityMetrics(logEntry: SecurityLog): void {
  securityMetrics.totalEvents++
  securityMetrics.lastUpdated = Date.now()
  
  if (logEntry.riskScore >= SECURITY_CONFIG.HIGH_RISK) {
    securityMetrics.highRiskEvents++
  }
  
  if (logEntry.category === 'auth' && logEntry.event.includes('failed')) {
    securityMetrics.failedLogins++
  }
  
  if (logEntry.category === 'admin') {
    securityMetrics.adminAccess++
  }
  
  if (logEntry.category === 'rate_limit') {
    securityMetrics.rateLimitHits++
  }
  
  if (logEntry.riskScore >= SECURITY_CONFIG.MEDIUM_RISK) {
    securityMetrics.suspiciousIPs.add(logEntry.ipAddress)
  }
  
  if (logEntry.statusCode === 429 || logEntry.event.includes('blocked')) {
    securityMetrics.blockedRequests++
  }
}

/**
 * Update IP risk score
 */
function updateIPRiskScore(ipAddress: string, eventRiskScore: number): void {
  const currentRisk = ipRiskScores.get(ipAddress) || 0
  const newRisk = Math.min(currentRisk + (eventRiskScore * 0.1), 100)
  ipRiskScores.set(ipAddress, newRisk)
  
  // Block IP if risk is too high
  if (newRisk >= SECURITY_CONFIG.CRITICAL_RISK) {
    blockedIPs.add(ipAddress)
    console.error(`IP ${ipAddress} blocked due to high risk score: ${newRisk}`)
  }
}

/**
 * Handle high-risk security events
 */
function handleHighRiskEvent(logEntry: SecurityLog): void {
  // Log critical events
  if (logEntry.riskScore >= SECURITY_CONFIG.CRITICAL_RISK) {
    console.error('CRITICAL SECURITY EVENT:', {
      id: logEntry.id,
      event: logEntry.event,
      riskScore: logEntry.riskScore,
      ipAddress: logEntry.ipAddress,
      path: logEntry.path,
      details: logEntry.details
    })
  }
  
  // In production, you would:
  // - Send alerts to security team
  // - Update WAF rules
  // - Trigger incident response
  // - Send to SIEM system
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ipAddress: string): boolean {
  return blockedIPs.has(ipAddress)
}

/**
 * Get IP risk score
 */
export function getIPRiskScore(ipAddress: string): number {
  return ipRiskScores.get(ipAddress) || 0
}

/**
 * Get security logs with filtering
 */
export function getSecurityLogs(filters: {
  level?: SecurityLog['level']
  category?: SecurityLog['category']
  ipAddress?: string
  userId?: string
  minRiskScore?: number
  limit?: number
  offset?: number
} = {}): SecurityLog[] {
  let filteredLogs = [...securityLogs]
  
  if (filters.level) {
    filteredLogs = filteredLogs.filter(log => log.level === filters.level)
  }
  
  if (filters.category) {
    filteredLogs = filteredLogs.filter(log => log.category === filters.category)
  }
  
  if (filters.ipAddress) {
    filteredLogs = filteredLogs.filter(log => log.ipAddress === filters.ipAddress)
  }
  
  if (filters.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
  }
  
  if (filters.minRiskScore) {
    filteredLogs = filteredLogs.filter(log => log.riskScore >= filters.minRiskScore!)
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => b.timestamp - a.timestamp)
  
  // Apply pagination
  const offset = filters.offset || 0
  const limit = filters.limit || 100
  
  return filteredLogs.slice(offset, offset + limit)
}

/**
 * Get security metrics
 */
export function getSecurityMetrics(): SecurityMetrics {
  return {
    ...securityMetrics,
    suspiciousIPs: new Set(securityMetrics.suspiciousIPs)
  }
}

/**
 * Get threat intelligence summary
 */
export function getThreatIntelligence(): {
  topThreats: { pattern: string; count: number }[]
  riskiestIPs: { ip: string; riskScore: number; eventCount: number }[]
  recentHighRiskEvents: SecurityLog[]
} {
  // Count threat patterns
  const threatCounts = new Map<string, number>()
  const ipEventCounts = new Map<string, number>()
  
  for (const log of securityLogs) {
    // Count IP events
    ipEventCounts.set(log.ipAddress, (ipEventCounts.get(log.ipAddress) || 0) + 1)
    
    // Count threat patterns in details
    if (log.details?.threats) {
      for (const threat of log.details.threats) {
        threatCounts.set(threat.name, (threatCounts.get(threat.name) || 0) + 1)
      }
    }
  }
  
  // Top threats
  const topThreats = Array.from(threatCounts.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Riskiest IPs
  const riskiestIPs = Array.from(ipRiskScores.entries())
    .map(([ip, riskScore]) => ({
      ip,
      riskScore,
      eventCount: ipEventCounts.get(ip) || 0
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
  
  // Recent high-risk events
  const recentHighRiskEvents = getSecurityLogs({
    minRiskScore: SECURITY_CONFIG.HIGH_RISK,
    limit: 20
  })
  
  return {
    topThreats,
    riskiestIPs,
    recentHighRiskEvents
  }
}

/**
 * Clean up old logs
 */
export function cleanupOldLogs(): number {
  const cutoffTime = Date.now() - SECURITY_CONFIG.LOG_RETENTION_MS
  const initialCount = securityLogs.length
  
  // Remove old logs
  for (let i = securityLogs.length - 1; i >= 0; i--) {
    if (securityLogs[i].timestamp < cutoffTime) {
      securityLogs.splice(i, 1)
    }
  }
  
  const removedCount = initialCount - securityLogs.length
  
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} old security logs`)
  }
  
  return removedCount
}

/**
 * Reset IP risk scores (for maintenance)
 */
export function resetIPRiskScores(): void {
  ipRiskScores.clear()
  blockedIPs.clear()
  console.log('IP risk scores reset')
}

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupOldLogs()
  }, SECURITY_CONFIG.CLEANUP_INTERVAL)
}