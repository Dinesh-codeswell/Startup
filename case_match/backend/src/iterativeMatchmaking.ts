import { matchParticipantsToTeams } from './matchmaking';
import { MatchingResult, Participant, Team } from './types';

export interface IterativeMatchingResult extends MatchingResult {
  iterations: number;
  iterationHistory: {
    iteration: number;
    participantsProcessed: number;
    teamsFormed: number;
    participantsMatched: number;
    remainingUnmatched: number;
    efficiency: number;
  }[];
}

export interface IterativeMatchingOptions {
  maxIterations?: number;
  minParticipantsPerIteration?: number;
  logLevel?: 'minimal' | 'detailed' | 'verbose';
}

export interface IterativeMatchingStats {
  totalIterations: number;
  totalTeamsFormed: number;
  totalParticipantsMatched: number;
  finalEfficiency: number;
  iterationBreakdown: IterativeMatchingResult['iterationHistory'];
  averageIterationEfficiency: number;
  bestIteration: IterativeMatchingResult['iterationHistory'][0] | null;
  worstIteration: IterativeMatchingResult['iterationHistory'][0] | null;
}

export function runIterativeMatching(
  participants: Participant[], 
  options: IterativeMatchingOptions = {}
): IterativeMatchingResult {
  const { 
    maxIterations = Math.max(10, participants.length), // Minimum 10 iterations for better results
    minParticipantsPerIteration = 2,
    logLevel = 'detailed' 
  } = options;

  if (logLevel !== 'minimal') {
    console.log(`\n=== Starting Iterative Matchmaking ===`);
    console.log(`Total participants: ${participants.length}`);
    console.log(`Max iterations: ${maxIterations}`);
    console.log(`Min participants per iteration: ${minParticipantsPerIteration}`);
  }

  let allTeams: Team[] = [];
  let remainingParticipants = [...participants];
  let iteration = 0;
  const iterationHistory: IterativeMatchingResult['iterationHistory'] = [];
  let totalParticipantsMatched = 0;

  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 5; // Allow more failures before giving up

  while (remainingParticipants.length >= minParticipantsPerIteration && iteration < maxIterations) {
    iteration++;
    const participantsAtStart = remainingParticipants.length;

    if (logLevel === 'verbose') {
      console.log(`\n--- Iteration ${iteration} ---`);
      console.log(`Processing ${participantsAtStart} unmatched participants`);
    }

    // Try different strategies based on iteration number and previous results
    let iterationResult: MatchingResult;
    
    if (iteration <= 2 && consecutiveFailures === 0) {
      // First two iterations: use standard matching
      iterationResult = matchParticipantsToTeams(remainingParticipants);
      
      if (logLevel === 'verbose') {
        console.log(`Standard matching: ${iterationResult.teams.length} teams formed`);
      }
    } else if (consecutiveFailures < 2) {
      // Use strategic regrouping
      if (logLevel === 'verbose') {
        console.log('Using strategic regrouping approach...');
      }
      iterationResult = tryStrategicRegrouping(remainingParticipants, logLevel);
    } else {
      // After multiple failures, try alternative strategies
      if (logLevel === 'verbose') {
        console.log('Using alternative matching strategies after failures...');
      }
      
      if (remainingParticipants.length >= 4) {
        iterationResult = tryAlternativeGrouping(remainingParticipants, logLevel);
      } else {
        iterationResult = tryMinimalGrouping(remainingParticipants, logLevel);
      }
    }
    
    // Add newly formed teams to the overall results
    const newTeams = iterationResult.teams;
    const newlyMatchedCount = newTeams.reduce((sum, team) => sum + team.members.length, 0);
    
    // Update team IDs to be unique across all iterations
    const updatedNewTeams = newTeams.map((team, index) => ({
      ...team,
      id: `team-${allTeams.length + index + 1}-iter${iteration}`
    }));
    
    allTeams = [...allTeams, ...updatedNewTeams];
    
    // Update remaining participants (only those who weren't matched)
    remainingParticipants = iterationResult.unmatched;
    totalParticipantsMatched += newlyMatchedCount;

    // Calculate iteration efficiency
    const iterationEfficiency = participantsAtStart > 0 ? (newlyMatchedCount / participantsAtStart) * 100 : 0;

    // Record iteration history
    iterationHistory.push({
      iteration,
      participantsProcessed: participantsAtStart,
      teamsFormed: newTeams.length,
      participantsMatched: newlyMatchedCount,
      remainingUnmatched: remainingParticipants.length,
      efficiency: iterationEfficiency
    });

    if (logLevel !== 'minimal') {
      console.log(`Iteration ${iteration} results:`);
      console.log(`  - Teams formed: ${newTeams.length}`);
      console.log(`  - Participants matched: ${newlyMatchedCount}`);
      console.log(`  - Remaining unmatched: ${remainingParticipants.length}`);
      console.log(`  - Iteration efficiency: ${iterationEfficiency.toFixed(1)}%`);
    }

    // Track consecutive failures
    if (newlyMatchedCount === 0) {
      consecutiveFailures++;
      if (logLevel !== 'minimal') {
        console.log(`No progress made in iteration ${iteration} (consecutive failures: ${consecutiveFailures})`);
      }
      
      // Only stop if we've had too many consecutive failures and very few participants remain
      if (consecutiveFailures >= maxConsecutiveFailures && remainingParticipants.length < 4) {
        if (logLevel !== 'minimal') {
          console.log(`Stopping after ${consecutiveFailures} consecutive failures with ${remainingParticipants.length} participants remaining`);
        }
        break;
      }
    } else {
      consecutiveFailures = 0; // Reset failure counter on success
    }

    // Continue even with low efficiency if we have enough participants and iterations left
    if (remainingParticipants.length >= 4 && iteration < maxIterations - 2) {
      if (logLevel === 'verbose') {
        console.log(`Continuing with ${remainingParticipants.length} participants (${maxIterations - iteration} iterations remaining)`);
      }
    }

    // Break if we've matched everyone
    if (remainingParticipants.length === 0) {
      if (logLevel !== 'minimal') {
        console.log(`All participants matched after ${iteration} iterations!`);
      }
      break;
    }
  }

  // Calculate final statistics
  const totalParticipants = participants.length;
  const finalMatchingEfficiency = totalParticipants > 0 ? (totalParticipantsMatched / totalParticipants) * 100 : 0;
  const averageTeamSize = allTeams.length > 0 ? totalParticipantsMatched / allTeams.length : 0;

  // Create team size distribution
  const teamSizeDistribution = allTeams.reduce((acc, team) => {
    acc[team.teamSize] = (acc[team.teamSize] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Create case type distribution
  const caseTypeDistribution = allTeams.reduce((acc, team) => {
    team.commonCaseTypes.forEach(caseType => {
      acc[caseType] = (acc[caseType] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const result: IterativeMatchingResult = {
    teams: allTeams,
    unmatched: remainingParticipants,
    statistics: {
      totalParticipants,
      teamsFormed: allTeams.length,
      averageTeamSize,
      matchingEfficiency: finalMatchingEfficiency,
      teamSizeDistribution,
      caseTypeDistribution
    },
    iterations: iteration,
    iterationHistory
  };

  if (logLevel !== 'minimal') {
    console.log(`\n=== Final Iterative Matching Results ===`);
    console.log(`Total iterations: ${iteration}`);
    console.log(`Total teams formed: ${allTeams.length}`);
    console.log(`Total participants matched: ${totalParticipantsMatched}/${totalParticipants}`);
    console.log(`Final matching efficiency: ${finalMatchingEfficiency.toFixed(1)}%`);
    console.log(`Remaining unmatched: ${remainingParticipants.length}`);
    
    if (logLevel === 'verbose' && iterationHistory.length > 0) {
      console.log(`\n--- Iteration Summary ---`);
      iterationHistory.forEach(hist => {
        console.log(`Iteration ${hist.iteration}: ${hist.participantsMatched}/${hist.participantsProcessed} matched (${hist.efficiency.toFixed(1)}%)`);
      });
    }
  }

  return result;
}

/**
 * Strategic regrouping that maintains strict team size requirements
 * but tries different combinations to maximize matching
 */
function tryStrategicRegrouping(participants: Participant[], logLevel: string = 'detailed'): MatchingResult {
  if (logLevel === 'verbose') {
    console.log(`Starting strategic regrouping for ${participants.length} participants with strict team sizes`);
  }

  const teams: Team[] = [];
  let remaining = [...participants];

  // Group participants by their preferred team size
  const sizeGroups = {
    2: remaining.filter(p => p.preferredTeamSize === 2),
    3: remaining.filter(p => p.preferredTeamSize === 3),
    4: remaining.filter(p => p.preferredTeamSize === 4)
  };

  if (logLevel === 'verbose') {
    console.log(`Size groups: 2-member (${sizeGroups[2].length}), 3-member (${sizeGroups[3].length}), 4-member (${sizeGroups[4].length})`);
  }

  // Try to form teams in order of preference (largest first for better efficiency)
  const sizeOrder = [4, 3, 2] as const;
  
  for (const targetSize of sizeOrder) {
    const candidates = sizeGroups[targetSize];
    
    if (candidates.length >= targetSize) {
      if (logLevel === 'verbose') {
        console.log(`Attempting to form ${targetSize}-member teams from ${candidates.length} candidates`);
      }
      
      // Try different combinations to find the best matches
      const teamsFormed = formOptimalTeamsOfSize(candidates, targetSize, logLevel);
      teams.push(...teamsFormed);
      
      // Remove matched participants from remaining list
      const matchedIds = new Set(teamsFormed.flatMap(team => team.members.map(m => m.id)));
      remaining = remaining.filter(p => !matchedIds.has(p.id));
      
      if (logLevel === 'verbose') {
        console.log(`Formed ${teamsFormed.length} teams of size ${targetSize}, ${remaining.length} participants remaining`);
      }
    }
  }

  // Calculate statistics
  const totalParticipants = participants.length;
  const matchedParticipants = totalParticipants - remaining.length;
  const matchingEfficiency = totalParticipants > 0 ? (matchedParticipants / totalParticipants) * 100 : 0;
  const averageTeamSize = teams.length > 0 ? matchedParticipants / teams.length : 0;

  const teamSizeDistribution = teams.reduce((acc, team) => {
    acc[team.teamSize] = (acc[team.teamSize] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const caseTypeDistribution = teams.reduce((acc, team) => {
    team.commonCaseTypes.forEach(caseType => {
      acc[caseType] = (acc[caseType] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    teams,
    unmatched: remaining,
    statistics: {
      totalParticipants,
      teamsFormed: teams.length,
      averageTeamSize,
      matchingEfficiency,
      teamSizeDistribution,
      caseTypeDistribution
    }
  };
}

/**
 * Form optimal teams of a specific size using greedy approach with backtracking
 */
function formOptimalTeamsOfSize(candidates: Participant[], targetSize: number, logLevel: string): Team[] {
  const teams: Team[] = [];
  const available = [...candidates];
  
  // Sort candidates by experience and availability for better anchor selection
  available.sort((a, b) => {
    const experienceOrder = { 'None': 0, 'Participated in 1–2': 1, 'Participated in 3+': 2, 'Finalist/Winner in at least one': 3 };
    const expDiff = experienceOrder[b.experience] - experienceOrder[a.experience];
    if (expDiff !== 0) return expDiff;
    
    // Secondary sort by availability (fully available first)
    const availOrder = { 
      'Fully Available (10–15 hrs/week)': 3, 
      'Moderately Available (5–10 hrs/week)': 2, 
      'Lightly Available (1–4 hrs/week)': 1,
      'Not available now, but interested later': 0
    };
    return availOrder[b.availability] - availOrder[a.availability];
  });

  while (available.length >= targetSize) {
    const team = buildBestTeamOfSize(available, targetSize, logLevel);
    
    if (team && team.members.length === targetSize) {
      teams.push(team);
      
      // Remove team members from available list
      team.members.forEach(member => {
        const index = available.findIndex(p => p.id === member.id);
        if (index !== -1) {
          available.splice(index, 1);
        }
      });
      
      if (logLevel === 'verbose') {
        console.log(`Formed team of ${targetSize} members, ${available.length} candidates remaining`);
      }
    } else {
      // Can't form more teams of this size
      break;
    }
  }

  return teams;
}

/**
 * Build the best possible team of a specific size using compatibility scoring
 */
function buildBestTeamOfSize(candidates: Participant[], targetSize: number, logLevel: string): Team | null {
  if (candidates.length < targetSize) return null;

  // Start with the best anchor (most experienced, highly available)
  const anchor = candidates[0];
  const team = [anchor];
  const remaining = candidates.slice(1);

  if (logLevel === 'verbose') {
    console.log(`Building team of size ${targetSize} with anchor: ${anchor.fullName}`);
  }

  // Greedily add the best compatible members
  while (team.length < targetSize && remaining.length > 0) {
    let bestCandidate: Participant | null = null;
    let bestScore = -1;

    for (const candidate of remaining) {
      const score = calculateStrictCompatibilityScore(team, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      team.push(bestCandidate);
      const index = remaining.findIndex(p => p.id === bestCandidate!.id);
      remaining.splice(index, 1);
      
      if (logLevel === 'verbose') {
        console.log(`Added ${bestCandidate.fullName} to team (score: ${bestScore.toFixed(1)})`);
      }
    } else {
      break;
    }
  }

  // Only return team if it has exactly the target size
  if (team.length === targetSize) {
    return createStrictTeamObject(team);
  }

  return null;
}

/**
 * Calculate compatibility score for strict team size matching
 */
function calculateStrictCompatibilityScore(team: Participant[], candidate: Participant): number {
  let score = 0;

  // Experience diversity bonus (prefer different experience levels)
  const teamExperiences = team.map(p => p.experience);
  if (!teamExperiences.includes(candidate.experience)) {
    score += 25;
  }

  // Case type overlap bonus (prefer some common interests)
  const teamCaseTypes = new Set(team.flatMap(p => p.casePreferences));
  const candidateCaseTypes = new Set(candidate.casePreferences);
  const caseOverlap = [...teamCaseTypes].filter(type => candidateCaseTypes.has(type)).length;
  score += caseOverlap * 15;

  // Skill diversity bonus (prefer complementary skills)
  const teamSkills = new Set(team.flatMap(p => p.coreStrengths));
  const candidateSkills = new Set(candidate.coreStrengths);
  const skillOverlap = [...teamSkills].filter(skill => candidateSkills.has(skill)).length;
  const uniqueSkills = candidate.coreStrengths.length - skillOverlap;
  score += uniqueSkills * 10;

  // Availability compatibility bonus
  const teamAvailabilities = team.map(p => p.availability);
  const availabilityMatch = teamAvailabilities.some(avail => 
    isAvailabilityCompatible(getAvailabilityLevel({ availability: avail } as Participant), 
                           getAvailabilityLevel(candidate))
  );
  if (availabilityMatch) {
    score += 20;
  }

  // Role diversity bonus
  const teamRoles = new Set(team.flatMap(p => p.preferredRoles));
  const candidateRoles = new Set(candidate.preferredRoles);
  const roleOverlap = [...teamRoles].filter(role => candidateRoles.has(role)).length;
  const uniqueRoles = candidate.preferredRoles.length - roleOverlap;
  score += uniqueRoles * 8;

  // Education level diversity bonus (mix of UG and PG is good)
  const teamEducationLevels = team.map(p => p.currentYear.includes('PG') || p.currentYear.includes('MBA') ? 'PG' : 'UG');
  const candidateEducationLevel = candidate.currentYear.includes('PG') || candidate.currentYear.includes('MBA') ? 'PG' : 'UG';
  const hasEducationDiversity = teamEducationLevels.includes('PG') && teamEducationLevels.includes('UG');
  if (!hasEducationDiversity && !teamEducationLevels.includes(candidateEducationLevel)) {
    score += 12;
  }

  return score;
}

/**
 * Create team object with strict size requirements
 */
function createStrictTeamObject(members: Participant[]): Team {
  const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate team compatibility score
  let totalScore = 0;
  let comparisons = 0;
  
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      totalScore += calculateStrictCompatibilityScore([members[i]], members[j]);
      comparisons++;
    }
  }
  
  const compatibilityScore = comparisons > 0 ? totalScore / comparisons : 0;
  
  // Find common case types
  const allCaseTypes = members.flatMap(m => m.casePreferences);
  const caseTypeCounts = allCaseTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const commonCaseTypes = Object.entries(caseTypeCounts)
    .filter(([_, count]) => count >= 2)
    .map(([type, _]) => type as any)
    .slice(0, 3);

  // Calculate average experience
  const experienceValues = { 'None': 0, 'Participated in 1–2': 1, 'Participated in 3+': 2, 'Finalist/Winner in at least one': 3 };
  const avgExperience = members.reduce((sum, m) => sum + experienceValues[m.experience], 0) / members.length;

  // Calculate team size preference match (should be 100% since we're using strict sizes)
  const preferredSizeMatches = members.filter(m => m.preferredTeamSize === members.length).length;
  const preferredTeamSizeMatch = (preferredSizeMatches / members.length) * 100;

  return {
    id: teamId,
    members,
    skillVector: [], // Simplified for this implementation
    compatibilityScore: Math.min(100, Math.max(0, compatibilityScore)),
    teamSize: members.length,
    averageExperience: avgExperience,
    commonCaseTypes,
    workStyleCompatibility: 'Optimized for compatibility',
    preferredTeamSizeMatch
  };
}

// Helper functions
function getAvailabilityLevel(participant: Participant): 'High' | 'Medium' | 'Low' {
  switch (participant.availability) {
    case 'Fully Available (10–15 hrs/week)': return 'High';
    case 'Moderately Available (5–10 hrs/week)': return 'Medium';
    case 'Lightly Available (1–4 hrs/week)': return 'Low';
    case 'Not available now, but interested later': return 'Low';
    default: return 'Medium';
  }
}

function isAvailabilityCompatible(level1: 'High' | 'Medium' | 'Low', level2: 'High' | 'Medium' | 'Low'): boolean {
  // High can work with High and Medium
  // Medium can work with High, Medium, and Low
  // Low can work with Medium and Low
  if (level1 === 'High') return level2 === 'High' || level2 === 'Medium';
  if (level1 === 'Medium') return true; // Medium is compatible with all
  if (level1 === 'Low') return level2 === 'Medium' || level2 === 'Low';
  return false;
}

/**
 * Alternative grouping strategy that tries cross-education mixing
 */
function tryAlternativeGrouping(participants: Participant[], logLevel: string): MatchingResult {
  if (logLevel === 'verbose') {
    console.log(`Trying alternative grouping for ${participants.length} participants`);
  }

  // Mix UG and PG participants more aggressively
  const ugParticipants = participants.filter(p => !p.currentYear.includes('PG') && !p.currentYear.includes('MBA'));
  const pgParticipants = participants.filter(p => p.currentYear.includes('PG') || p.currentYear.includes('MBA'));

  if (logLevel === 'verbose') {
    console.log(`Alternative grouping: ${ugParticipants.length} UG, ${pgParticipants.length} PG`);
  }

  // Try to form mixed teams first
  const teams: Team[] = [];
  const remaining = [...participants];

  // Sort by preferred team size and experience for better matching
  remaining.sort((a, b) => {
    const sizeOrder = b.preferredTeamSize - a.preferredTeamSize;
    if (sizeOrder !== 0) return sizeOrder;
    
    const experienceOrder = { 'None': 0, 'Participated in 1–2': 1, 'Participated in 3+': 2, 'Finalist/Winner in at least one': 3 };
    return experienceOrder[b.experience] - experienceOrder[a.experience];
  });

  // Group by preferred team size and try to form teams
  const sizeGroups = {
    2: remaining.filter(p => p.preferredTeamSize === 2),
    3: remaining.filter(p => p.preferredTeamSize === 3),
    4: remaining.filter(p => p.preferredTeamSize === 4)
  };

  // Try to form teams starting with the most popular size
  const sizeCounts = Object.entries(sizeGroups).map(([size, participants]) => ({
    size: parseInt(size),
    count: participants.length,
    participants
  })).sort((a, b) => b.count - a.count);

  for (const { size, participants: sizeParticipants } of sizeCounts) {
    if (sizeParticipants.length >= size) {
      const formedTeams = formOptimalTeamsOfSize(sizeParticipants, size, logLevel);
      teams.push(...formedTeams);
      
      // Remove matched participants
      const matchedIds = new Set(formedTeams.flatMap(team => team.members.map(m => m.id)));
      const remainingIndex = remaining.length;
      for (let i = remainingIndex - 1; i >= 0; i--) {
        if (matchedIds.has(remaining[i].id)) {
          remaining.splice(i, 1);
        }
      }
    }
  }

  return createMatchingResult(participants, teams, remaining);
}

/**
 * Minimal grouping for small numbers of participants
 */
function tryMinimalGrouping(participants: Participant[], logLevel: string): MatchingResult {
  if (logLevel === 'verbose') {
    console.log(`Trying minimal grouping for ${participants.length} participants`);
  }

  const teams: Team[] = [];
  const remaining = [...participants];

  // For small groups, try to form any valid team
  if (remaining.length >= 2) {
    // Sort by compatibility potential
    remaining.sort((a, b) => {
      // Prefer participants with more common case types
      const aCommonTypes = a.casePreferences.length;
      const bCommonTypes = b.casePreferences.length;
      return bCommonTypes - aCommonTypes;
    });

    // Try to form teams of preferred sizes first
    const preferredSizes = [...new Set(remaining.map(p => p.preferredTeamSize))].sort((a, b) => b - a);
    
    for (const targetSize of preferredSizes) {
      const candidates = remaining.filter(p => p.preferredTeamSize === targetSize);
      
      if (candidates.length >= targetSize) {
        const team = buildBestTeamOfSize(candidates, targetSize, logLevel);
        if (team) {
          teams.push(team);
          
          // Remove team members from remaining
          team.members.forEach(member => {
            const index = remaining.findIndex(p => p.id === member.id);
            if (index !== -1) {
              remaining.splice(index, 1);
            }
          });
          
          if (logLevel === 'verbose') {
            console.log(`Formed minimal team of size ${targetSize}`);
          }
          break; // Only form one team in minimal grouping
        }
      }
    }
  }

  return createMatchingResult(participants, teams, remaining);
}

/**
 * Helper function to create MatchingResult
 */
function createMatchingResult(originalParticipants: Participant[], teams: Team[], unmatched: Participant[]): MatchingResult {
  const totalParticipants = originalParticipants.length;
  const matchedParticipants = totalParticipants - unmatched.length;
  const matchingEfficiency = totalParticipants > 0 ? (matchedParticipants / totalParticipants) * 100 : 0;
  const averageTeamSize = teams.length > 0 ? matchedParticipants / teams.length : 0;

  const teamSizeDistribution = teams.reduce((acc, team) => {
    acc[team.teamSize] = (acc[team.teamSize] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const caseTypeDistribution = teams.reduce((acc, team) => {
    team.commonCaseTypes.forEach(caseType => {
      acc[caseType] = (acc[caseType] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    teams,
    unmatched,
    statistics: {
      totalParticipants,
      teamsFormed: teams.length,
      averageTeamSize,
      matchingEfficiency,
      teamSizeDistribution,
      caseTypeDistribution
    }
  };
}

export function getIterativeMatchingStats(result: IterativeMatchingResult): IterativeMatchingStats {
  return {
    totalIterations: result.iterations,
    totalTeamsFormed: result.teams.length,
    totalParticipantsMatched: result.statistics.totalParticipants - result.unmatched.length,
    finalEfficiency: result.statistics.matchingEfficiency,
    iterationBreakdown: result.iterationHistory,
    averageIterationEfficiency: result.iterationHistory.length > 0 
      ? result.iterationHistory.reduce((sum, hist) => sum + hist.efficiency, 0) / result.iterationHistory.length 
      : 0,
    bestIteration: result.iterationHistory.length > 0 
      ? result.iterationHistory.reduce((best, current) => 
          current.efficiency > best.efficiency ? current : best
        )
      : null,
    worstIteration: result.iterationHistory.length > 0 
      ? result.iterationHistory.reduce((worst, current) => 
          current.efficiency < worst.efficiency ? current : worst
        )
      : null
  };
}