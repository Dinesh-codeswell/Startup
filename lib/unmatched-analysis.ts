/**
 * Unmatched Participant Analysis System
 * 
 * This system analyzes why participants couldn't be matched and provides
 * detailed, structured explanations for each unmatched candidate.
 */

import { Participant, Team } from './case-match-types';

export interface UnmatchedReason {
  category: 'TEAM_SIZE' | 'TEAM_PREFERENCE' | 'COMPATIBILITY' | 'AVAILABILITY' | 'INSUFFICIENT_CANDIDATES' | 'QUALITY_THRESHOLD';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  details: string[];
  suggestions: string[];
}

export interface UnmatchedAnalysis {
  participant: Participant;
  reasons: UnmatchedReason[];
  potentialMatches: {
    participant: Participant;
    compatibilityScore: number;
    blockingIssues: string[];
  }[];
  statistics: {
    totalCandidates: number;
    sameTeamSizePreference: number;
    compatibleTeamPreference: number;
    availabilityCompatible: number;
    highCompatibility: number;
  };
  recommendations: string[];
}

export interface UnmatchedReport {
  totalUnmatched: number;
  analyses: UnmatchedAnalysis[];
  summary: {
    reasonBreakdown: { [key: string]: number };
    commonIssues: string[];
    recommendations: string[];
  };
}

/**
 * Analyze why participants couldn't be matched
 */
export function analyzeUnmatchedParticipants(
  unmatched: Participant[],
  allParticipants: Participant[],
  formedTeams: Team[]
): UnmatchedReport {
  console.log(`🔍 Analyzing ${unmatched.length} unmatched participants...`);
  
  const analyses: UnmatchedAnalysis[] = [];
  const reasonCounts: { [key: string]: number } = {};
  
  for (const participant of unmatched) {
    const analysis = analyzeIndividualParticipant(participant, allParticipants, formedTeams, unmatched);
    analyses.push(analysis);
    
    // Count reasons for summary
    analysis.reasons.forEach(reason => {
      reasonCounts[reason.category] = (reasonCounts[reason.category] || 0) + 1;
    });
  }
  
  const summary = generateUnmatchedSummary(analyses, reasonCounts);
  
  return {
    totalUnmatched: unmatched.length,
    analyses,
    summary
  };
}

/**
 * Analyze individual participant's matching issues
 */
function analyzeIndividualParticipant(
  participant: Participant,
  allParticipants: Participant[],
  formedTeams: Team[],
  unmatched: Participant[]
): UnmatchedAnalysis {
  const reasons: UnmatchedReason[] = [];
  const potentialMatches: UnmatchedAnalysis['potentialMatches'] = [];
  
  // Get other participants (excluding self)
  const otherParticipants = allParticipants.filter(p => p.id !== participant.id);
  const otherUnmatched = unmatched.filter(p => p.id !== participant.id);
  
  // Calculate statistics
  const statistics = calculateParticipantStatistics(participant, otherParticipants);
  
  // Analyze potential matches with other unmatched participants
  for (const other of otherUnmatched) {
    const compatibilityScore = calculateCompatibilityScore(participant, other);
    const blockingIssues = identifyBlockingIssues(participant, other);
    
    potentialMatches.push({
      participant: other,
      compatibilityScore,
      blockingIssues
    });
  }
  
  // Sort potential matches by compatibility
  potentialMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  
  // Identify primary reasons for not being matched
  reasons.push(...identifyUnmatchedReasons(participant, statistics, potentialMatches, formedTeams));
  
  // Generate recommendations
  const recommendations = generateRecommendations(participant, reasons, potentialMatches);
  
  return {
    participant,
    reasons,
    potentialMatches: potentialMatches.slice(0, 5), // Top 5 potential matches
    statistics,
    recommendations
  };
}

/**
 * Identify specific reasons why a participant couldn't be matched
 */
function identifyUnmatchedReasons(
  participant: Participant,
  statistics: UnmatchedAnalysis['statistics'],
  potentialMatches: UnmatchedAnalysis['potentialMatches'],
  formedTeams: Team[]
): UnmatchedReason[] {
  const reasons: UnmatchedReason[] = [];
  
  // Check team size preference issues
  if (statistics.sameTeamSizePreference < participant.preferredTeamSize - 1) {
    reasons.push({
      category: 'TEAM_SIZE',
      severity: 'CRITICAL',
      title: 'Insufficient Team Size Preference Match',
      description: `Only ${statistics.sameTeamSizePreference} other participants prefer team size ${participant.preferredTeamSize}`,
      details: [
        `Participant prefers team size: ${participant.preferredTeamSize}`,
        `Needs ${participant.preferredTeamSize - 1} compatible teammates`,
        `Found only ${statistics.sameTeamSizePreference} participants with same preference`,
        `Shortfall: ${(participant.preferredTeamSize - 1) - statistics.sameTeamSizePreference} participants`
      ],
      suggestions: [
        `Consider changing team size preference to ${findMostPopularTeamSize(formedTeams)}`,
        'Be flexible with team size preferences',
        'Wait for more participants with same team size preference'
      ]
    });
  }
  
  // Check team composition preference issues
  if (statistics.compatibleTeamPreference === 0) {
    reasons.push({
      category: 'TEAM_PREFERENCE',
      severity: 'CRITICAL',
      title: 'Team Composition Preference Conflict',
      description: `No participants compatible with "${participant.teamPreference}" preference`,
      details: [
        `Participant wants: ${participant.teamPreference}`,
        `Education level: ${getEducationLevel(participant)}`,
        `Compatible participants found: ${statistics.compatibleTeamPreference}`,
        'Team composition preferences are strictly enforced'
      ],
      suggestions: [
        'Consider changing team preference to "Either UG or PG" for more flexibility',
        'Wait for more participants with compatible preferences',
        'Review team composition requirements'
      ]
    });
  }
  
  // Check compatibility threshold issues
  if (statistics.highCompatibility === 0 && potentialMatches.length > 0) {
    const bestMatch = potentialMatches[0];
    reasons.push({
      category: 'QUALITY_THRESHOLD',
      severity: 'HIGH',
      title: 'Below 70% Compatibility Threshold',
      description: `Best potential match only achieved ${bestMatch.compatibilityScore.toFixed(1)}% compatibility`,
      details: [
        `Quality threshold: 70% minimum compatibility required`,
        `Best potential match: ${bestMatch.participant.fullName}`,
        `Achieved compatibility: ${bestMatch.compatibilityScore.toFixed(1)}%`,
        `Blocking issues: ${bestMatch.blockingIssues.join(', ')}`,
        'High-quality teams are prioritized over matching efficiency'
      ],
      suggestions: [
        'Consider adjusting preferences to improve compatibility',
        'Review case type preferences for more overlap',
        'Consider different skill combinations',
        'Wait for more compatible participants'
      ]
    });
  }
  
  // Check insufficient candidates
  if (statistics.totalCandidates < participant.preferredTeamSize - 1) {
    reasons.push({
      category: 'INSUFFICIENT_CANDIDATES',
      severity: 'CRITICAL',
      title: 'Insufficient Total Candidates',
      description: `Only ${statistics.totalCandidates} total candidates available for matching`,
      details: [
        `Needs ${participant.preferredTeamSize - 1} teammates`,
        `Total available candidates: ${statistics.totalCandidates}`,
        `Shortfall: ${(participant.preferredTeamSize - 1) - statistics.totalCandidates} participants`,
        'Not enough participants in the matching pool'
      ],
      suggestions: [
        'Wait for more participants to join',
        'Consider smaller team size preference',
        'Join the next matching session with more participants'
      ]
    });
  }
  
  return reasons;
}

/**
 * Calculate statistics about potential matches for a participant
 */
function calculateParticipantStatistics(
  participant: Participant,
  otherParticipants: Participant[]
): UnmatchedAnalysis['statistics'] {
  let sameTeamSizePreference = 0;
  let compatibleTeamPreference = 0;
  let availabilityCompatible = 0;
  let highCompatibility = 0;
  
  for (const other of otherParticipants) {
    // Team size preference
    if (other.preferredTeamSize === participant.preferredTeamSize) {
      sameTeamSizePreference++;
    }
    
    // Team composition preference
    if (isTeamPreferenceCompatible(participant, other)) {
      compatibleTeamPreference++;
    }
    
    // Availability compatibility
    if (isAvailabilityCompatible(participant.availability, other.availability)) {
      availabilityCompatible++;
    }
    
    // High compatibility (70%+)
    const compatibility = calculateCompatibilityScore(participant, other);
    if (compatibility >= 70) {
      highCompatibility++;
    }
  }
  
  return {
    totalCandidates: otherParticipants.length,
    sameTeamSizePreference,
    compatibleTeamPreference,
    availabilityCompatible,
    highCompatibility
  };
}

/**
 * Identify specific blocking issues between two participants
 */
function identifyBlockingIssues(participant1: Participant, participant2: Participant): string[] {
  const issues: string[] = [];
  
  // Team size mismatch
  if (participant1.preferredTeamSize !== participant2.preferredTeamSize) {
    issues.push(`Team size mismatch (${participant1.preferredTeamSize} vs ${participant2.preferredTeamSize})`);
  }
  
  // Team preference incompatibility
  if (!isTeamPreferenceCompatible(participant1, participant2)) {
    issues.push(`Team composition incompatible (${participant1.teamPreference} vs ${participant2.teamPreference})`);
  }
  
  // Availability incompatibility
  if (!isAvailabilityCompatible(participant1.availability, participant2.availability)) {
    issues.push(`Availability mismatch (${participant1.availability} vs ${participant2.availability})`);
  }
  
  // Case type overlap
  const caseOverlap = getCaseTypeOverlap(participant1, participant2);
  if (caseOverlap === 0) {
    issues.push('No overlapping case type interests');
  }
  
  return issues;
}

/**
 * Generate personalized recommendations for unmatched participants
 */
function generateRecommendations(
  participant: Participant,
  reasons: UnmatchedReason[],
  potentialMatches: UnmatchedAnalysis['potentialMatches']
): string[] {
  const recommendations: string[] = [];
  
  // Team size recommendations
  if (reasons.some(r => r.category === 'TEAM_SIZE')) {
    recommendations.push(`Consider changing team size preference from ${participant.preferredTeamSize} to a more popular size`);
  }
  
  // Team preference recommendations
  if (reasons.some(r => r.category === 'TEAM_PREFERENCE')) {
    if (participant.teamPreference !== 'Either UG or PG') {
      recommendations.push('Consider changing team preference to "Either UG or PG" for maximum flexibility');
    }
  }
  
  // Potential match recommendations
  if (potentialMatches.length > 0) {
    const bestMatch = potentialMatches[0];
    recommendations.push(`Consider reaching out to ${bestMatch.participant.fullName} (${bestMatch.compatibilityScore.toFixed(1)}% compatibility) for future matching`);
  }
  
  // General recommendations
  recommendations.push('Wait for the next matching session with more participants');
  
  return recommendations;
}

/**
 * Generate summary of unmatched participants
 */
function generateUnmatchedSummary(
  analyses: UnmatchedAnalysis[],
  reasonCounts: { [key: string]: number }
): UnmatchedReport['summary'] {
  const commonIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Identify most common issues
  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  
  for (const [reason, count] of sortedReasons) {
    if (count > 1) {
      commonIssues.push(`${reason.replace('_', ' ').toLowerCase()}: ${count} participants affected`);
    }
  }
  
  // Generate system-level recommendations
  if (reasonCounts.TEAM_SIZE > 2) {
    recommendations.push('Consider promoting more flexible team size preferences');
  }
  
  if (reasonCounts.TEAM_PREFERENCE > 2) {
    recommendations.push('Encourage "Either UG or PG" preference for better matching');
  }
  
  return {
    reasonBreakdown: reasonCounts,
    commonIssues,
    recommendations
  };
}

// Helper functions
function calculateCompatibilityScore(p1: Participant, p2: Participant): number {
  let score = 0;
  
  // Case type overlap (0-35 points)
  const caseOverlap = getCaseTypeOverlap(p1, p2);
  score += caseOverlap * 35;
  
  // Skill complementarity (0-25 points)
  const skillComp = getSkillComplementarity(p1, p2);
  score += skillComp * 25;
  
  // Experience compatibility (0-20 points)
  const expComp = getExperienceCompatibility(p1, p2);
  score += expComp * 20;
  
  // Availability compatibility (0-15 points)
  const availComp = isAvailabilityCompatible(p1.availability, p2.availability) ? 15 : 0;
  score += availComp;
  
  // Team size match (0-5 points)
  const sizeMatch = p1.preferredTeamSize === p2.preferredTeamSize ? 5 : 0;
  score += sizeMatch;
  
  return Math.min(100, score);
}

function getCaseTypeOverlap(p1: Participant, p2: Participant): number {
  const set1 = new Set(p1.casePreferences);
  const set2 = new Set(p2.casePreferences);
  const overlap = [...set1].filter(x => set2.has(x)).length;
  const maxSize = Math.max(set1.size, set2.size);
  return maxSize > 0 ? overlap / maxSize : 0;
}

function getSkillComplementarity(p1: Participant, p2: Participant): number {
  const set1 = new Set(p1.coreStrengths);
  const set2 = new Set(p2.coreStrengths);
  const union = new Set([...set1, ...set2]);
  const overlap = [...set1].filter(x => set2.has(x)).length;
  return union.size > 0 ? (union.size - overlap) / union.size : 0;
}

function getExperienceCompatibility(p1: Participant, p2: Participant): number {
  const expValues = { 'None': 0, 'Participated in 1–2': 1, 'Participated in 3+': 2, 'Finalist/Winner in at least one': 3 };
  const exp1 = expValues[p1.experience as keyof typeof expValues] || 0;
  const exp2 = expValues[p2.experience as keyof typeof expValues] || 0;
  const gap = Math.abs(exp1 - exp2);
  
  if (gap === 0) return 0.8; // Same level is good
  if (gap === 1) return 1.0; // Perfect diversity
  if (gap === 2) return 0.6; // Acceptable
  return 0.2; // Large gap
}

function isTeamPreferenceCompatible(p1: Participant, p2: Participant): boolean {
  const p1IsUG = !p1.currentYear.includes('PG') && !p1.currentYear.includes('MBA');
  const p2IsUG = !p2.currentYear.includes('PG') && !p2.currentYear.includes('MBA');
  
  // Both want UG only
  if (p1.teamPreference === 'Undergrads only' && p2.teamPreference === 'Undergrads only') {
    return p1IsUG && p2IsUG;
  }
  
  // Both want PG only
  if (p1.teamPreference === 'Postgrads only' && p2.teamPreference === 'Postgrads only') {
    return !p1IsUG && !p2IsUG;
  }
  
  // Both want either
  if (p1.teamPreference === 'Either UG or PG' && p2.teamPreference === 'Either UG or PG') {
    return true;
  }
  
  // Mixed preferences - allow Either to work with specific preferences
  if (p1.teamPreference === 'Either UG or PG' || p2.teamPreference === 'Either UG or PG') {
    if (p1.teamPreference === 'Undergrads only' || p2.teamPreference === 'Undergrads only') {
      return p1IsUG && p2IsUG;
    }
    if (p1.teamPreference === 'Postgrads only' || p2.teamPreference === 'Postgrads only') {
      return !p1IsUG && !p2IsUG;
    }
  }
  
  return false;
}

function isAvailabilityCompatible(avail1: string, avail2: string): boolean {
  const levels = {
    'Fully Available (10–15 hrs/week)': 3,
    'Moderately Available (5–10 hrs/week)': 2,
    'Lightly Available (1–4 hrs/week)': 1,
    'Not available now, but interested later': 0
  };
  
  const level1 = levels[avail1 as keyof typeof levels] || 2;
  const level2 = levels[avail2 as keyof typeof levels] || 2;
  
  // High can work with High and Medium
  // Medium can work with all
  // Low can work with Medium and Low
  if (level1 === 3) return level2 >= 2;
  if (level1 === 2) return true;
  if (level1 === 1) return level2 <= 2 && level2 >= 1;
  return level2 === 0;
}

function getEducationLevel(participant: Participant): string {
  return (!participant.currentYear.includes('PG') && !participant.currentYear.includes('MBA')) ? 'Undergraduate' : 'Postgraduate';
}

function findMostPopularTeamSize(teams: Team[]): number {
  const sizeCounts = teams.reduce((acc, team) => {
    acc[team.teamSize] = (acc[team.teamSize] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const mostPopular = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0];
  return mostPopular ? parseInt(mostPopular[0]) : 4;
}

// Ensure this file is treated as a module
export {};
