import { v4 as uuidv4 } from 'uuid';
import { Participant, Team, MatchingResult, MatchingConfig, CoreStrength, CaseType, PreferredRole } from './types';

// Configuration for team matching
const config: MatchingConfig = {
  preferredTeamSize: 4,
  minTeamSize: 2,
  maxTeamSize: 4,
  weights: {
    skillCompatibility: 0.20,
    experienceBalance: 0.15,
    availabilityMatch: 0.15,
    workStyleMatch: 0.10,
    caseTypeMatch: 0.25,
    educationLevelMatch: 0.10,
    teamSizePreference: 0.05,
  },
};

// Required roles for balanced teams (Skill Complementarity)
const requiredRoles = {
  strategist: ['Strategy & Structuring', 'Innovation & Ideation'],
  analyst: ['Data Analysis & Research', 'Financial Modeling', 'Market Research'],
  communicator: ['Public Speaking & Pitching', 'Storytelling', 'Presentation Design (PPT/Canva)'],
  designer: ['UI/UX or Product Thinking', 'Storytelling', 'Presentation Design (PPT/Canva)']
};

// Role mapping for conflict prevention (Preferred Role Matching)
const roleMapping = {
  'Team Lead': 'lead',
  'Researcher': 'researcher',
  'Data Analyst': 'analyst',
  'Designer': 'designer',
  'Presenter': 'presenter',
  'Coordinator': 'coordinator',
  'Flexible with any role': 'flexible'
};

/**
 * Anti-Bias Team Matching Algorithm
 * 
 * This algorithm is designed to eliminate bias and ensure fair team selection:
 * 1. Education Level Matching (UG with UG, PG with PG)
 * 2. Preferred Team Size Matching (respect individual preferences)
 * 3. Case Type Diversity (ensure teams have diverse case interests)
 * 4. Role Conflict Prevention (balanced role distribution)
 * 5. Skill Complementarity (ensure each team has required roles)
 * 6. Experience Level Balancing (diverse experience levels)
 * 7. Availability Matching (similar availability levels)
 */
export function matchParticipantsToTeams(participants: Participant[]): MatchingResult {
  console.log(`Starting anti-bias matchmaking for ${participants.length} participants`);
  
  // Step 1: Education Level Matching (UG matched with UG, PG matched with PG)
  const ugParticipants = participants.filter(p => 
    !p.currentYear.includes('PG') && !p.currentYear.includes('MBA')
  );
  const pgParticipants = participants.filter(p => 
    p.currentYear.includes('PG') || p.currentYear.includes('MBA')
  );

  console.log(`Education level separation: ${ugParticipants.length} UG, ${pgParticipants.length} PG`);

  // Step 2: Form teams within each education level with anti-bias approach
  const ugTeams = formTeamsAntiBias(ugParticipants);
  const pgTeams = formTeamsAntiBias(pgParticipants);
  
  const allTeams = [...ugTeams.teams, ...pgTeams.teams];
  const unmatched = [...ugTeams.unmatched, ...pgTeams.unmatched];

  // Calculate enhanced statistics
  const teamSizeDistribution = calculateTeamSizeDistribution(allTeams);
  const caseTypeDistribution = calculateCaseTypeDistribution(allTeams);
  
  const statistics = {
    totalParticipants: participants.length,
    teamsFormed: allTeams.length,
    averageTeamSize: allTeams.length > 0 ? 
      allTeams.reduce((acc, team) => acc + team.teamSize, 0) / allTeams.length : 0,
    matchingEfficiency: participants.length > 0 ? 
      ((participants.length - unmatched.length) / participants.length) * 100 : 0,
    teamSizeDistribution,
    caseTypeDistribution
  };

  console.log(`Anti-bias matching complete: ${allTeams.length} teams formed, ${unmatched.length} unmatched`);
  console.log(`Team size distribution:`, teamSizeDistribution);
  console.log(`Case type distribution:`, caseTypeDistribution);
  
  return { teams: allTeams, unmatched, statistics };
}

function formTeamsAntiBias(participants: Participant[]): { teams: Team[], unmatched: Participant[] } {
  if (participants.length === 0) {
    return { teams: [], unmatched: [] };
  }

  const teams: Team[] = [];
  const availableParticipants = [...participants];
  
  // Sort by experience (most experienced first) for better team formation
  availableParticipants.sort((a, b) => getExperienceScore(b) - getExperienceScore(a));

  console.log(`Forming anti-bias teams from ${availableParticipants.length} participants`);

  // Group participants by preferred team size
  const size2Participants = availableParticipants.filter(p => p.preferredTeamSize === 2);
  const size3Participants = availableParticipants.filter(p => p.preferredTeamSize === 3);
  const size4Participants = availableParticipants.filter(p => p.preferredTeamSize === 4);

  console.log(`Team size preferences: 2=${size2Participants.length}, 3=${size3Participants.length}, 4=${size4Participants.length}`);

  // Form teams prioritizing preferred team sizes
  const size2Teams = formTeamsBySize(size2Participants, 2);
  const size3Teams = formTeamsBySize(size3Participants, 3);
  const size4Teams = formTeamsBySize(size4Participants, 4);

  // Combine all teams
  const allTeams = [...size2Teams.teams, ...size3Teams.teams, ...size4Teams.teams];
  const remainingParticipants = [...size2Teams.unmatched, ...size3Teams.unmatched, ...size4Teams.unmatched];

  // STRICT MODE: Do not try to form additional teams from remaining participants
  // All remaining participants will be unmatched if they can't form teams with their preferred size
  console.log(`STRICT MODE: ${remainingParticipants.length} participants remain unmatched due to strict constraints`);
  
  const finalTeams = allTeams;
  const unmatched = remainingParticipants;

  console.log(`Anti-bias team formation complete: ${finalTeams.length} teams, ${unmatched.length} unmatched`);
  return { teams: finalTeams, unmatched };
}

function formTeamsBySize(participants: Participant[], targetSize: number): { teams: Team[], unmatched: Participant[] } {
  const teams: Team[] = [];
  const availableParticipants = [...participants];

  // STRICT: Only form teams of exactly the target size
  while (availableParticipants.length >= targetSize) {
    const team = createTeamWithStrictConstraints(availableParticipants, targetSize);
    if (team && team.members.length === targetSize) {
      teams.push(team);
      console.log(`Formed STRICT ${targetSize}-member team with exactly ${team.members.length} members`);
      
      // Remove team members from available participants
      team.members.forEach(member => {
        const index = availableParticipants.findIndex(p => p.id === member.id);
        if (index !== -1) {
          availableParticipants.splice(index, 1);
        }
      });
    } else {
      console.log(`Cannot form more ${targetSize}-member teams with strict constraints`);
      break; // Can't form more teams with strict constraints
    }
  }

  return { teams, unmatched: availableParticipants };
}

function formTeamsFromRemaining(participants: Participant[]): { teams: Team[], unmatched: Participant[] } {
  const teams: Team[] = [];
  const availableParticipants = [...participants];

  while (availableParticipants.length >= config.minTeamSize) {
    // Try different team sizes based on remaining participants
    let targetSize = 4;
    if (availableParticipants.length < 4) targetSize = 3;
    if (availableParticipants.length < 3) targetSize = 2;

    const team = createTeamWithAntiBiasLogic(availableParticipants, targetSize);
    if (team && team.members.length >= config.minTeamSize) {
      teams.push(team);
      console.log(`Formed additional ${targetSize}-member team with ${team.members.length} members`);
      
      // Remove team members from available participants
      team.members.forEach(member => {
        const index = availableParticipants.findIndex(p => p.id === member.id);
        if (index !== -1) {
          availableParticipants.splice(index, 1);
        }
      });
    } else {
      // If anti-bias logic fails, try with minimal constraints
      console.log(`Anti-bias logic failed for ${targetSize}-member team, trying minimal constraints`);
      const teamWithMinimalConstraints = createTeamWithMinimalConstraints(availableParticipants, targetSize);
      if (teamWithMinimalConstraints && teamWithMinimalConstraints.members.length >= config.minTeamSize) {
        teams.push(teamWithMinimalConstraints);
        console.log(`Formed ${targetSize}-member team with minimal constraints`);
        
        // Remove team members from available participants
        teamWithMinimalConstraints.members.forEach(member => {
          const index = availableParticipants.findIndex(p => p.id === member.id);
          if (index !== -1) {
            availableParticipants.splice(index, 1);
          }
        });
      } else {
        break; // Can't form more teams
      }
    }
  }

  return { teams, unmatched: availableParticipants };
}

function createTeamWithMinimalConstraints(participants: Participant[], targetSize: number): Team | null {
  if (participants.length < targetSize) return null;

  // Start with the most experienced participant as anchor
  const anchor = participants[0];
  const team: Participant[] = [anchor];
  const remaining = participants.slice(1);

  console.log(`Starting ${targetSize}-member team with minimal constraints: ${anchor.fullName} (${anchor.currentYear})`);

  // Build team with minimal constraints - only basic availability matching
  while (team.length < targetSize && remaining.length > 0) {
    const nextMember = findBestMatchWithMinimalConstraints(team, remaining, targetSize);
    if (nextMember) {
      team.push(nextMember);
      console.log(`Added member with minimal constraints: ${nextMember.fullName} (${nextMember.currentYear})`);
      const index = remaining.findIndex(p => p.id === nextMember.id);
      remaining.splice(index, 1);
    } else {
      console.log(`No suitable member found for team of size ${team.length} with minimal constraints`);
      break;
    }
  }

  if (team.length < config.minTeamSize) {
    console.log(`Team too small (${team.length} members), discarding`);
    return null;
  }

  console.log(`Created ${targetSize}-member team with minimal constraints: ${team.length} members`);
  return createTeamObject(team);
}

function findBestMatchWithMinimalConstraints(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  console.log(`Finding match with minimal constraints for ${targetSize}-member team of size ${currentTeam.length} from ${candidates.length} candidates`);

  // Only apply very basic availability matching
  const candidatesWithAvailability = filterByAvailabilityMatch(currentTeam, candidates);
  console.log(`After minimal availability filtering: ${candidatesWithAvailability.length} candidates`);
  
  if (candidatesWithAvailability.length === 0) {
    console.log('No candidates with availability match, allowing all candidates');
    return selectBestCandidateBasic(currentTeam, candidates, targetSize);
  }
  
  // Select best candidate based on basic compatibility
  const bestCandidate = selectBestCandidateBasic(currentTeam, candidatesWithAvailability, targetSize);
  if (bestCandidate) {
    console.log(`Selected best candidate with minimal constraints: ${bestCandidate.fullName}`);
  }
  return bestCandidate;
}

function createTeamWithStrictConstraints(participants: Participant[], targetSize: number): Team | null {
  if (participants.length < targetSize) return null;

  // STRICT: Only consider participants who prefer this exact team size
  const strictParticipants = participants.filter(p => p.preferredTeamSize === targetSize);
  
  if (strictParticipants.length < targetSize) {
    console.log(`Not enough participants prefer team size ${targetSize}: ${strictParticipants.length} available, ${targetSize} needed`);
    return null;
  }

  // Start with the most experienced participant as anchor
  const anchor = strictParticipants[0];
  const team: Participant[] = [anchor];
  const remaining = strictParticipants.slice(1);

  console.log(`Starting STRICT ${targetSize}-member team with anchor: ${anchor.fullName} (prefers size ${anchor.preferredTeamSize})`);

  // Build team following strict constraints
  while (team.length < targetSize && remaining.length > 0) {
    const nextMember = findBestMatchStrict(team, remaining, targetSize);
    if (nextMember) {
      team.push(nextMember);
      console.log(`Added member: ${nextMember.fullName} (prefers size ${nextMember.preferredTeamSize})`);
      const index = remaining.findIndex(p => p.id === nextMember.id);
      remaining.splice(index, 1);
    } else {
      console.log(`No suitable member found for strict team of size ${team.length}`);
      break;
    }
  }

  // STRICT: Only return team if it has exactly the target size
  if (team.length !== targetSize) {
    console.log(`Strict team formation failed: got ${team.length} members, needed ${targetSize}`);
    return null;
  }

  console.log(`Created STRICT ${targetSize}-member team with exactly ${team.length} members`);
  return createTeamObject(team);
}

function createTeamWithAntiBiasLogic(participants: Participant[], targetSize: number): Team | null {
  if (participants.length < targetSize) return null;

  // Start with the most experienced participant as anchor
  const anchor = participants[0];
  const team: Participant[] = [anchor];
  const remaining = participants.slice(1);

  console.log(`Starting ${targetSize}-member team with anchor: ${anchor.fullName} (${anchor.currentYear})`);

  // Build team following anti-bias constraints
  while (team.length < targetSize && remaining.length > 0) {
    const nextMember = findBestMatchAntiBias(team, remaining, targetSize);
    if (nextMember) {
      team.push(nextMember);
      console.log(`Added member: ${nextMember.fullName} (${nextMember.currentYear})`);
      const index = remaining.findIndex(p => p.id === nextMember.id);
      remaining.splice(index, 1);
    } else {
      console.log(`No suitable member found for team of size ${team.length}`);
      break;
    }
  }

  if (team.length < config.minTeamSize) {
    console.log(`Team too small (${team.length} members), discarding`);
    return null;
  }

  console.log(`Created ${targetSize}-member team with ${team.length} members`);
  return createTeamObject(team);
}

function findBestMatchStrict(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  console.log(`Finding STRICT match for ${targetSize}-member team of size ${currentTeam.length} from ${candidates.length} candidates`);

  // STRICT Step 1: Team size preference - all candidates must prefer the target size
  const candidatesWithCorrectSize = candidates.filter(c => c.preferredTeamSize === targetSize);
  console.log(`After strict team size filtering: ${candidatesWithCorrectSize.length} candidates`);
  
  if (candidatesWithCorrectSize.length === 0) {
    console.log('No candidates with correct team size preference');
    return null;
  }

  // STRICT Step 2: Availability matching - must be compatible
  const candidatesWithStrictAvailability = filterByStrictAvailabilityMatch(currentTeam, candidatesWithCorrectSize);
  console.log(`After strict availability filtering: ${candidatesWithStrictAvailability.length} candidates`);
  
  if (candidatesWithStrictAvailability.length === 0) {
    console.log('No candidates with compatible availability');
    return null;
  }

  // Step 3: Apply other constraints (case diversity, skills, etc.)
  return findBestMatchWithStrictCandidates(currentTeam, candidatesWithStrictAvailability, targetSize);
}

function findBestMatchAntiBias(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  console.log(`Finding match for ${targetSize}-member team of size ${currentTeam.length} from ${candidates.length} candidates`);

  // Step 1: Case Type Diversity - prioritize candidates with different case types
  const candidatesWithCaseDiversity = filterByCaseTypeDiversity(currentTeam, candidates);
  console.log(`After case diversity filtering: ${candidatesWithCaseDiversity.length} candidates`);
  
  // If no candidates pass case diversity, try with relaxed case type constraints
  if (candidatesWithCaseDiversity.length === 0) {
    console.log('No candidates with case type diversity, trying relaxed case constraints');
    const candidatesWithRelaxedCase = filterByCaseTypeRelaxed(currentTeam, candidates);
    console.log(`After relaxed case filtering: ${candidatesWithRelaxedCase.length} candidates`);
    if (candidatesWithRelaxedCase.length === 0) {
      console.log('No candidates even with relaxed case constraints');
      return null;
    }
    return findBestMatchWithCandidates(currentTeam, candidatesWithRelaxedCase, targetSize);
  }

  return findBestMatchWithCandidates(currentTeam, candidatesWithCaseDiversity, targetSize);
}

function findBestMatchWithCandidates(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  // Step 2: Role Conflict Prevention
  const candidatesWithoutRoleConflicts = filterByRoleCompatibility(currentTeam, candidates);
  console.log(`After role filtering: ${candidatesWithoutRoleConflicts.length} candidates`);
  if (candidatesWithoutRoleConflicts.length === 0) {
    console.log('No candidates without role conflicts, trying relaxed role constraints');
    const candidatesWithRelaxedRole = filterByRoleCompatibilityRelaxed(currentTeam, candidates);
    console.log(`After relaxed role filtering: ${candidatesWithRelaxedRole.length} candidates`);
    if (candidatesWithRelaxedRole.length === 0) {
      console.log('No candidates even with relaxed role constraints');
      return null;
    }
    return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithRelaxedRole, targetSize);
  }

  // Step 3: Skill Complementarity
  const candidatesWithSkillBalance = filterBySkillComplementarity(currentTeam, candidatesWithoutRoleConflicts);
  console.log(`After skill filtering: ${candidatesWithSkillBalance.length} candidates`);
  if (candidatesWithSkillBalance.length === 0) {
    console.log('No candidates that maintain skill balance, trying relaxed skill constraints');
    const candidatesWithRelaxedSkill = filterBySkillComplementarityRelaxed(currentTeam, candidatesWithoutRoleConflicts);
    console.log(`After relaxed skill filtering: ${candidatesWithRelaxedSkill.length} candidates`);
    if (candidatesWithRelaxedSkill.length === 0) {
      console.log('No candidates even with relaxed skill constraints');
      return null;
    }
    return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithRelaxedSkill, targetSize);
  }

  // Step 4: Experience Diversity
  const candidatesWithExperienceDiversity = filterByExperienceDiversity(currentTeam, candidatesWithSkillBalance);
  console.log(`After experience filtering: ${candidatesWithExperienceDiversity.length} candidates`);
  if (candidatesWithExperienceDiversity.length === 0) {
    console.log('No candidates that maintain experience diversity, allowing all candidates');
    return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithSkillBalance, targetSize);
  }

  // Step 5: Availability Matching
  const candidatesWithAvailabilityMatch = filterByAvailabilityMatch(currentTeam, candidatesWithExperienceDiversity);
  console.log(`After availability filtering: ${candidatesWithAvailabilityMatch.length} candidates`);
  if (candidatesWithAvailabilityMatch.length === 0) {
    console.log('No candidates with availability match, allowing all candidates');
    return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithExperienceDiversity, targetSize);
  }

  // Among remaining candidates, choose the one with highest overall compatibility
  const bestCandidate = selectBestCandidateAntiBias(currentTeam, candidatesWithAvailabilityMatch, targetSize);
  if (bestCandidate) {
    console.log(`Selected best candidate: ${bestCandidate.fullName}`);
  }
  return bestCandidate;
}

function findBestMatchWithRelaxedConstraints(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  console.log(`Using relaxed constraints for team formation with ${candidates.length} candidates`);
  
  // Only apply basic availability matching as a final filter
  const candidatesWithAvailability = filterByAvailabilityMatch(currentTeam, candidates);
  console.log(`After final availability filtering: ${candidatesWithAvailability.length} candidates`);
  
  if (candidatesWithAvailability.length === 0) {
    console.log('No candidates even with relaxed constraints');
    return null;
  }
  
  // Select best candidate based on basic compatibility
  const bestCandidate = selectBestCandidateBasic(currentTeam, candidatesWithAvailability, targetSize);
  if (bestCandidate) {
    console.log(`Selected best candidate with relaxed constraints: ${bestCandidate.fullName}`);
  }
  return bestCandidate;
}

/**
 * Step 1: Case Type Diversity - prioritize candidates with different case types
 * This is the key anti-bias mechanism
 */
function filterByCaseTypeDiversity(team: Participant[], candidates: Participant[]): Participant[] {
  if (team.length === 0) return candidates;

  const teamCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueTeamCaseTypes = new Set(teamCaseTypes);
  
  // If team has no case types, allow any candidate
  if (uniqueTeamCaseTypes.size === 0) {
    return candidates;
  }

  // Prioritize candidates with different case types to avoid bias
  const candidatesWithDifferentCaseTypes = candidates.filter(candidate => {
    const candidateCaseTypes = new Set(candidate.casePreferences);
    
    // Check if candidate has any case types that are NOT in the team
    const hasDifferentCaseTypes = candidate.casePreferences.some(caseType => 
      !uniqueTeamCaseTypes.has(caseType)
    );
    
    return hasDifferentCaseTypes;
  });

  // If no candidates with different case types, fall back to all candidates
  return candidatesWithDifferentCaseTypes.length > 0 ? candidatesWithDifferentCaseTypes : candidates;
}

/**
 * Relaxed case type filtering - allows candidates with similar case types if diversity fails
 */
function filterByCaseTypeRelaxed(team: Participant[], candidates: Participant[]): Participant[] {
  if (team.length === 0) return candidates;

  const teamCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueTeamCaseTypes = new Set(teamCaseTypes);
  
  // If team has no case types, allow any candidate
  if (uniqueTeamCaseTypes.size === 0) {
    return candidates;
  }

  // Allow candidates with at least one common case type or any candidate if team is small
  return candidates.filter(candidate => {
    const hasCommonCaseType = candidate.casePreferences.some(caseType => 
      uniqueTeamCaseTypes.has(caseType)
    );
    
    // Allow if there's a common case type, or if team is small (be more flexible)
    return hasCommonCaseType || team.length < 3;
  });
}

/**
 * Step 2: Role Conflict Prevention - prevent role conflicts
 */
function filterByRoleCompatibility(team: Participant[], candidates: Participant[]): Participant[] {
  const teamRoles = team.flatMap(member => member.preferredRoles);
  const roleCounts = countRoles(teamRoles);
  
  return candidates.filter(candidate => {
    const candidateRoles = candidate.preferredRoles;
    
    // Check for role conflicts - be more lenient for smaller teams
    for (const role of candidateRoles) {
      if (role === 'Flexible with any role') continue;
      
      const roleKey = roleMapping[role];
      if (roleKey === 'lead' && roleCounts.lead >= 2) return false; // Max 2 team leads
      if (roleKey === 'designer' && roleCounts.designer >= 2) return false; // Max 2 designers
      if (roleKey === 'presenter' && roleCounts.presenter >= 2) return false; // Max 2 presenters
    }
    
    return true;
  });
}

/**
 * Relaxed role conflict prevention - more lenient constraints
 */
function filterByRoleCompatibilityRelaxed(team: Participant[], candidates: Participant[]): Participant[] {
  const teamRoles = team.flatMap(member => member.preferredRoles);
  const roleCounts = countRoles(teamRoles);
  
  return candidates.filter(candidate => {
    const candidateRoles = candidate.preferredRoles;
    
    // More lenient role conflict checks
    for (const role of candidateRoles) {
      if (role === 'Flexible with any role') continue;
      
      const roleKey = roleMapping[role];
      if (roleKey === 'lead' && roleCounts.lead >= 3) return false; // Max 3 team leads
      if (roleKey === 'designer' && roleCounts.designer >= 3) return false; // Max 3 designers
      if (roleKey === 'presenter' && roleCounts.presenter >= 3) return false; // Max 3 presenters
    }
    
    return true;
  });
}

/**
 * Step 3: Skill Complementarity - ensure balanced team
 */
function filterBySkillComplementarity(team: Participant[], candidates: Participant[]): Participant[] {
  return candidates.filter(candidate => {
    const teamWithCandidate = [...team, candidate];
    
    // Check if team has required roles covered
    const hasStrategist = hasSkillFromCategory(teamWithCandidate, requiredRoles.strategist);
    const hasAnalyst = hasSkillFromCategory(teamWithCandidate, requiredRoles.analyst);
    const hasCommunicator = hasSkillFromCategory(teamWithCandidate, requiredRoles.communicator);
    const hasDesigner = hasSkillFromCategory(teamWithCandidate, requiredRoles.designer);
    
    // Team must have at least 2 out of 4 required roles
    const requiredRolesCovered = [hasStrategist, hasAnalyst, hasCommunicator, hasDesigner]
      .filter(Boolean).length >= 2;
    
    return requiredRolesCovered;
  });
}

/**
 * Relaxed skill complementarity - more lenient requirements
 */
function filterBySkillComplementarityRelaxed(team: Participant[], candidates: Participant[]): Participant[] {
  return candidates.filter(candidate => {
    const teamWithCandidate = [...team, candidate];
    
    // Check if team has required roles covered - more lenient
    const hasStrategist = hasSkillFromCategory(teamWithCandidate, requiredRoles.strategist);
    const hasAnalyst = hasSkillFromCategory(teamWithCandidate, requiredRoles.analyst);
    const hasCommunicator = hasSkillFromCategory(teamWithCandidate, requiredRoles.communicator);
    const hasDesigner = hasSkillFromCategory(teamWithCandidate, requiredRoles.designer);
    
    // Team must have at least 1 out of 4 required roles (very lenient)
    const requiredRolesCovered = [hasStrategist, hasAnalyst, hasCommunicator, hasDesigner]
      .filter(Boolean).length >= 1;
    
    return requiredRolesCovered;
  });
}

/**
 * Step 4: Experience Diversity - ensure diverse experience levels
 */
function filterByExperienceDiversity(team: Participant[], candidates: Participant[]): Participant[] {
  const teamExperienceScores = team.map(getExperienceScore);
  const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
  const hasBeginnerMember = teamExperienceScores.some(score => score <= 1);
  
  return candidates.filter(candidate => {
    const candidateExperience = getExperienceScore(candidate);
    
    // If team doesn't have experienced member, prefer experienced candidates
    if (!hasExperiencedMember && candidateExperience >= 3) {
      return true;
    }
    
    // If team doesn't have beginner member, prefer beginner candidates
    if (!hasBeginnerMember && candidateExperience <= 1) {
      return true;
    }
    
    // Otherwise, allow any candidate for diversity
    return true;
  });
}

/**
 * Step 5: STRICT Availability Matching - group members with compatible availability levels only
 * High with high, high with medium, medium with medium, medium with low
 */
function filterByAvailabilityMatch(team: Participant[], candidates: Participant[]): Participant[] {
  if (team.length === 0) return candidates;
  
  const teamAvailabilityLevels = team.map(member => getAvailabilityLevel(member));
  
  return candidates.filter(candidate => {
    const candidateAvailabilityLevel = getAvailabilityLevel(candidate);
    
    // Check if candidate's availability is compatible with any team member
    return teamAvailabilityLevels.some(teamLevel => 
      isAvailabilityCompatible(teamLevel, candidateAvailabilityLevel)
    );
  });
}

/**
 * Get availability level (High, Medium, Low)
 */
function getAvailabilityLevel(participant: Participant): 'High' | 'Medium' | 'Low' {
  switch (participant.availability) {
    case 'Fully Available (10–15 hrs/week)': return 'High';
    case 'Moderately Available (5–10 hrs/week)': return 'Medium';
    case 'Lightly Available (1–4 hrs/week)': return 'Low';
    case 'Not available now, but interested later': return 'Low';
    default: return 'Medium';
  }
}

/**
 * Check if two availability levels are compatible
 * Rules: High with High, High with Medium, Medium with Medium, Medium with Low
 */
function isAvailabilityCompatible(level1: 'High' | 'Medium' | 'Low', level2: 'High' | 'Medium' | 'Low'): boolean {
  const compatibilityMatrix = {
    'High': ['High', 'Medium'],
    'Medium': ['High', 'Medium', 'Low'],
    'Low': ['Medium', 'Low']
  };
  
  return compatibilityMatrix[level1].includes(level2);
}

/**
 * STRICT Availability Matching - enforces the exact compatibility rules
 */
function filterByStrictAvailabilityMatch(team: Participant[], candidates: Participant[]): Participant[] {
  if (team.length === 0) return candidates;
  
  const teamAvailabilityLevels = team.map(member => getAvailabilityLevel(member));
  
  return candidates.filter(candidate => {
    const candidateAvailabilityLevel = getAvailabilityLevel(candidate);
    
    // STRICT: Candidate must be compatible with ALL team members
    return teamAvailabilityLevels.every(teamLevel => 
      isAvailabilityCompatible(teamLevel, candidateAvailabilityLevel)
    );
  });
}

/**
 * Find best match among strict candidates
 */
function findBestMatchWithStrictCandidates(currentTeam: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  // Apply case type diversity
  const candidatesWithCaseDiversity = filterByCaseTypeDiversity(currentTeam, candidates);
  console.log(`After case diversity filtering: ${candidatesWithCaseDiversity.length} candidates`);
  
  if (candidatesWithCaseDiversity.length === 0) {
    console.log('No candidates with case type diversity, using all strict candidates');
    return selectBestStrictCandidate(currentTeam, candidates, targetSize);
  }

  // Apply role compatibility
  const candidatesWithoutRoleConflicts = filterByRoleCompatibility(currentTeam, candidatesWithCaseDiversity);
  console.log(`After role filtering: ${candidatesWithoutRoleConflicts.length} candidates`);
  
  if (candidatesWithoutRoleConflicts.length === 0) {
    console.log('No candidates without role conflicts, using case diversity candidates');
    return selectBestStrictCandidate(currentTeam, candidatesWithCaseDiversity, targetSize);
  }

  // Apply skill complementarity
  const candidatesWithSkillBalance = filterBySkillComplementarity(currentTeam, candidatesWithoutRoleConflicts);
  console.log(`After skill filtering: ${candidatesWithSkillBalance.length} candidates`);
  
  if (candidatesWithSkillBalance.length === 0) {
    console.log('No candidates with skill balance, using role-compatible candidates');
    return selectBestStrictCandidate(currentTeam, candidatesWithoutRoleConflicts, targetSize);
  }

  // Select best candidate from remaining
  return selectBestStrictCandidate(currentTeam, candidatesWithSkillBalance, targetSize);
}

/**
 * Select best candidate with strict constraints
 */
function selectBestStrictCandidate(team: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  if (candidates.length === 0) return null;
  
  let bestCandidate: Participant | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateStrictCompatibilityScore(team, candidate, targetSize);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Calculate compatibility score for strict matching
 */
function calculateStrictCompatibilityScore(team: Participant[], candidate: Participant, targetSize: number): number {
  let score = 0;
  
  // High bonus for matching preferred team size (already guaranteed in strict mode)
  if (candidate.preferredTeamSize === targetSize) {
    score += 0.5;
  }
  
  // Strict availability compatibility bonus (already guaranteed)
  const teamAvailabilityLevels = team.map(member => getAvailabilityLevel(member));
  const candidateAvailabilityLevel = getAvailabilityLevel(candidate);
  
  if (teamAvailabilityLevels.every(teamLevel => 
    isAvailabilityCompatible(teamLevel, candidateAvailabilityLevel))) {
    score += 0.3;
  }
  
  // Case type diversity bonus
  const teamCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueTeamCaseTypes = new Set(teamCaseTypes);
  const hasDifferentCaseTypes = candidate.casePreferences.some(caseType => 
    !uniqueTeamCaseTypes.has(caseType)
  );
  
  if (hasDifferentCaseTypes) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Final selection among candidates that passed all anti-bias constraints
 */
function selectBestCandidateAntiBias(team: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  if (candidates.length === 0) return null;
  
  let bestCandidate: Participant | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateAntiBiasCompatibilityScore(team, candidate, targetSize);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Calculates compatibility score with anti-bias considerations
 */
function calculateAntiBiasCompatibilityScore(team: Participant[], candidate: Participant, targetSize: number): number {
  const teamWithCandidate = [...team, candidate];
  
  let score = 0;
  
  // Case type diversity bonus (anti-bias)
  const teamCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueTeamCaseTypes = new Set(teamCaseTypes);
  const candidateCaseTypes = new Set(candidate.casePreferences);
  
  const hasDifferentCaseTypes = candidate.casePreferences.some(caseType => 
    !uniqueTeamCaseTypes.has(caseType)
  );
  
  if (hasDifferentCaseTypes) {
    score += 0.4; // High bonus for case type diversity
  } else {
    score += 0.1; // Low bonus for same case types
  }
  
  // Experience diversity bonus
  const teamExperienceScores = team.map(getExperienceScore);
  const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
  const hasBeginnerMember = teamExperienceScores.some(score => score <= 1);
  const candidateExperience = getExperienceScore(candidate);
  
  if (!hasExperiencedMember && candidateExperience >= 3) {
    score += 0.3; // High bonus for experienced candidate when team lacks experience
  } else if (!hasBeginnerMember && candidateExperience <= 1) {
    score += 0.2; // Bonus for beginner candidate when team lacks beginners
  }
  
  // Team size preference bonus
  if (candidate.preferredTeamSize === targetSize) {
    score += 0.2; // Bonus for matching preferred team size
  }
  
  // Availability match
  const teamAvailabilityScores = team.map(getAvailabilityScore);
  const avgTeamAvailability = teamAvailabilityScores.reduce((a, b) => a + b, 0) / teamAvailabilityScores.length;
  const candidateAvailability = getAvailabilityScore(candidate);
  const availabilityDiff = Math.abs(candidateAvailability - avgTeamAvailability);
  score += (1 - availabilityDiff * 0.2) * 0.2;
  
  // Skill diversity bonus
  const uniqueSkills = new Set(teamWithCandidate.flatMap(member => member.coreStrengths)).size;
  const totalSkills = teamWithCandidate.reduce((total, member) => total + member.coreStrengths.length, 0);
  if (totalSkills > 0) {
    const diversityBonus = (uniqueSkills / totalSkills) * 0.1;
    score += diversityBonus;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Basic candidate selection for relaxed constraints
 */
function selectBestCandidateBasic(team: Participant[], candidates: Participant[], targetSize: number): Participant | null {
  if (candidates.length === 0) return null;
  
  let bestCandidate: Participant | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateBasicCompatibilityScore(team, candidate, targetSize);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }
  
  return bestCandidate;
}

/**
 * Calculates basic compatibility score for relaxed constraints
 */
function calculateBasicCompatibilityScore(team: Participant[], candidate: Participant, targetSize: number): number {
  let score = 0;
  
  // Team size preference bonus
  if (candidate.preferredTeamSize === targetSize) {
    score += 0.3; // High bonus for matching preferred team size
  }
  
  // Availability match
  const teamAvailabilityScores = team.map(getAvailabilityScore);
  const avgTeamAvailability = teamAvailabilityScores.reduce((a, b) => a + b, 0) / teamAvailabilityScores.length;
  const candidateAvailability = getAvailabilityScore(candidate);
  const availabilityDiff = Math.abs(candidateAvailability - avgTeamAvailability);
  score += (1 - availabilityDiff * 0.2) * 0.3;
  
  // Experience diversity bonus
  const teamExperienceScores = team.map(getExperienceScore);
  const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
  const candidateExperience = getExperienceScore(candidate);
  
  if (!hasExperiencedMember && candidateExperience >= 3) {
    score += 0.2; // Bonus for experienced candidate when team lacks experience
  }
  
  // Skill diversity bonus
  const teamWithCandidate = [...team, candidate];
  const uniqueSkills = new Set(teamWithCandidate.flatMap(member => member.coreStrengths)).size;
  const totalSkills = teamWithCandidate.reduce((total, member) => total + member.coreStrengths.length, 0);
  if (totalSkills > 0) {
    const diversityBonus = (uniqueSkills / totalSkills) * 0.2;
    score += diversityBonus;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Counts roles in a team for conflict prevention
 */
function countRoles(roles: PreferredRole[]): { [key: string]: number } {
  const counts: { [key: string]: number } = {
    lead: 0,
    researcher: 0,
    analyst: 0,
    designer: 0,
    presenter: 0,
    coordinator: 0,
    flexible: 0
  };
  
  roles.forEach(role => {
    const roleKey = roleMapping[role];
    if (roleKey) {
      counts[roleKey]++;
    }
  });
  
  return counts;
}

/**
 * Checks if team has skills from a specific category
 */
function hasSkillFromCategory(team: Participant[], skillCategory: string[]): boolean {
  return team.some(member => 
    member.coreStrengths.some(skill => skillCategory.includes(skill))
  );
}

function createTeamObject(members: Participant[]): Team {
  const skillVector = createSkillVector(members);
  const compatibilityScore = calculateTeamCompatibilityScore(members);
  const averageExperience = members.reduce((sum, member) => 
    sum + getExperienceScore(member), 0
  ) / members.length;
  
  const commonCaseTypes = findCommonCaseTypes(members);
  const workStyleCompatibility = determineWorkStyleCompatibility(members);
  
  // Calculate preferred team size match percentage
  const teamSize = members.length;
  const membersWithPreferredSize = members.filter(member => member.preferredTeamSize === teamSize).length;
  const preferredTeamSizeMatch = (membersWithPreferredSize / members.length) * 100;

  return {
    id: uuidv4(),
    members,
    skillVector,
    compatibilityScore,
    teamSize: members.length,
    averageExperience,
    commonCaseTypes,
    workStyleCompatibility,
    preferredTeamSizeMatch
  };
}

function createSkillVector(team: Participant[]): number[] {
  const allSkills: CoreStrength[] = [
    'Strategy & Structuring',
    'Data Analysis & Research',
    'Financial Modeling',
    'Market Research',
    'Presentation Design (PPT/Canva)',
    'Public Speaking & Pitching',
    'Time Management & Coordination',
    'Innovation & Ideation',
    'UI/UX or Product Thinking',
    'Storytelling',
    'Technical (Coding, App Dev, Automation)'
  ];

  return allSkills.map(skill => {
    const memberCount = team.filter(member => 
      member.coreStrengths.includes(skill)
    ).length;
    return memberCount > 0 ? 1 : 0;
  });
}

function calculateTeamCompatibilityScore(team: Participant[]): number {
  if (team.length <= 1) return 100;
  
  let totalScore = 0;
  const weights = config.weights;

  totalScore += calculateSkillCompatibility(team) * weights.skillCompatibility;
  totalScore += calculateExperienceBalance(team) * weights.experienceBalance;
  totalScore += calculateAvailabilityMatch(team) * weights.availabilityMatch;
  totalScore += calculateWorkStyleCompatibility(team) * weights.workStyleMatch;
  totalScore += calculateCaseTypeMatch(team) * weights.caseTypeMatch;
  totalScore += 1.0 * weights.educationLevelMatch;

  return totalScore * 100; // Convert to percentage
}

function calculateSkillCompatibility(team: Participant[]): number {
  // Check if team has essential roles covered
  const hasStrategist = hasSkillFromCategory(team, requiredRoles.strategist);
  const hasAnalyst = hasSkillFromCategory(team, requiredRoles.analyst);
  const hasCommunicator = hasSkillFromCategory(team, requiredRoles.communicator);
  const hasDesigner = hasSkillFromCategory(team, requiredRoles.designer);

  let score = 0;
  
  // Base score for role coverage
  if (hasStrategist) score += 0.25;
  if (hasAnalyst) score += 0.25;
  if (hasCommunicator) score += 0.25;
  if (hasDesigner) score += 0.25;

  // Bonus for skill diversity (avoid too much overlap)
  const totalSkills = team.reduce((total, member) => total + member.coreStrengths.length, 0);
  const uniqueSkills = new Set(team.flatMap(member => member.coreStrengths)).size;
  
  if (totalSkills > 0) {
    const diversityBonus = (uniqueSkills / totalSkills) * 0.5;
    score += diversityBonus;
  }

  return Math.min(score, 1.0);
}

function calculateExperienceBalance(team: Participant[]): number {
  const experienceScores = team.map(getExperienceScore);
  const avgExperience = experienceScores.reduce((a, b) => a + b, 0) / experienceScores.length;
  const hasExperienced = experienceScores.some(score => score >= 3); // At least one experienced member
  
  let score = 0.5; // Base score
  
  if (hasExperienced) score += 0.3; // Bonus for having experienced member
  
  // Penalty for too much variance (prefer balanced experience)
  const variance = experienceScores.reduce((acc, score) => 
    acc + Math.pow(score - avgExperience, 2), 0
  ) / experienceScores.length;
  
  const balanceBonus = Math.max(0, 0.2 - (variance * 0.1));
  score += balanceBonus;
  
  return Math.min(score, 1.0);
}

function calculateAvailabilityMatch(team: Participant[]): number {
  const availabilityScores = team.map(getAvailabilityScore);
  const avgAvailability = availabilityScores.reduce((a, b) => a + b, 0) / availabilityScores.length;
  
  // Calculate how close members are to each other in availability
  const variance = availabilityScores.reduce((acc, score) => 
    acc + Math.pow(score - avgAvailability, 2), 0
  ) / availabilityScores.length;
  
  // Lower variance = better match
  return Math.max(0, 1.0 - (variance * 0.5));
}

function calculateWorkStyleCompatibility(team: Participant[]): number {
  const workStyles = team.map(member => member.workStyle);
  
  // Check for work style alignment
  const structuredCount = workStyles.filter(style => 
    style === 'Structured meetings and deadlines'
  ).length;
  const flexibleCount = workStyles.filter(style => 
    style === 'Flexible work with async updates'
  ).length;
  const combinationCount = workStyles.filter(style => 
    style === 'Combination of both'
  ).length;
  
  // Prefer teams with compatible or flexible work styles
  if (combinationCount === team.length) return 1.0; // All flexible
  if (structuredCount === team.length) return 0.9; // All structured
  if (flexibleCount === team.length) return 0.9; // All flexible
  if (combinationCount > 0) return 0.8; // Some flexible members
  
  return 0.6; // Mixed structured/flexible without combination
}

function calculateCaseTypeMatch(team: Participant[]): number {
  const allCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueCaseTypes = new Set(allCaseTypes);
  
  // Find common case types
  const commonTypes: CaseType[] = [];
  for (const caseType of uniqueCaseTypes) {
    const memberCount = team.filter(member => 
      member.casePreferences.includes(caseType)
    ).length;
    
    if (memberCount >= Math.ceil(team.length / 2)) {
      commonTypes.push(caseType);
    }
  }
  
  // Score based on number of common interests
  if (commonTypes.length >= 3) return 0.9;
  if (commonTypes.length >= 2) return 0.8;
  if (commonTypes.length >= 1) return 0.7;
  
  return 0.5; // No common interests
}

function findCommonCaseTypes(team: Participant[]): CaseType[] {
  const allCaseTypes = team.flatMap(member => member.casePreferences);
  const uniqueCaseTypes = new Set(allCaseTypes);
  
  const commonTypes: CaseType[] = [];
  for (const caseType of uniqueCaseTypes) {
    const memberCount = team.filter(member => 
      member.casePreferences.includes(caseType)
    ).length;
    
    if (memberCount >= Math.ceil(team.length / 2)) {
      commonTypes.push(caseType);
    }
  }
  
  return commonTypes;
}

function determineWorkStyleCompatibility(team: Participant[]): string {
  const workStyles = team.map(member => member.workStyle);
  const uniqueStyles = new Set(workStyles);
  
  if (uniqueStyles.size === 1) {
    return workStyles[0];
  }
  
  const hasCombination = workStyles.some(style => style === 'Combination of both');
  if (hasCombination) {
    return 'Flexible approach with mixed preferences';
  }
  
  return 'Mixed structured and flexible approaches';
}

// Helper functions for scoring
function getExperienceScore(participant: Participant): number {
  switch (participant.experience) {
    case 'Finalist/Winner in at least one': return 4;
    case 'Participated in 3+': return 3;
    case 'Participated in 1–2': return 2;
    case 'None': return 1;
    default: return 1;
  }
}

function getAvailabilityScore(participant: Participant): number {
  switch (participant.availability) {
    case 'Fully Available (10–15 hrs/week)': return 4;
    case 'Moderately Available (5–10 hrs/week)': return 3;
    case 'Lightly Available (1–4 hrs/week)': return 2;
    case 'Not available now, but interested later': return 1;
    default: return 3;
  }
}

// Helper functions for statistics
function calculateTeamSizeDistribution(teams: Team[]): { [key: number]: number } {
  const distribution: { [key: number]: number } = { 2: 0, 3: 0, 4: 0 };
  teams.forEach(team => {
    distribution[team.teamSize] = (distribution[team.teamSize] || 0) + 1;
  });
  return distribution;
}

function calculateCaseTypeDistribution(teams: Team[]): { [key: string]: number } {
  const distribution: { [key: string]: number } = {};
  teams.forEach(team => {
    if (team.commonCaseTypes.length > 0) {
      const primaryCaseType = team.commonCaseTypes[0];
      distribution[primaryCaseType] = (distribution[primaryCaseType] || 0) + 1;
    }
  });
  return distribution;
}

