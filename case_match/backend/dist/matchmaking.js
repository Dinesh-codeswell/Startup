"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchParticipantsToTeams = matchParticipantsToTeams;
const uuid_1 = require("uuid");
const config = {
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
const requiredRoles = {
    strategist: ['Strategy & Structuring', 'Innovation & Ideation'],
    analyst: ['Data Analysis & Research', 'Financial Modeling', 'Market Research'],
    communicator: ['Public Speaking & Pitching', 'Storytelling', 'Presentation Design (PPT/Canva)'],
    designer: ['UI/UX or Product Thinking', 'Storytelling', 'Presentation Design (PPT/Canva)']
};
const roleMapping = {
    'Team Lead': 'lead',
    'Researcher': 'researcher',
    'Data Analyst': 'analyst',
    'Designer': 'designer',
    'Presenter': 'presenter',
    'Coordinator': 'coordinator',
    'Flexible with any role': 'flexible'
};
function matchParticipantsToTeams(participants) {
    console.log(`Starting anti-bias matchmaking for ${participants.length} participants`);
    const ugParticipants = participants.filter(p => !p.currentYear.includes('PG') && !p.currentYear.includes('MBA'));
    const pgParticipants = participants.filter(p => p.currentYear.includes('PG') || p.currentYear.includes('MBA'));
    console.log(`Education level separation: ${ugParticipants.length} UG, ${pgParticipants.length} PG`);
    const ugTeams = formTeamsAntiBias(ugParticipants);
    const pgTeams = formTeamsAntiBias(pgParticipants);
    const allTeams = [...ugTeams.teams, ...pgTeams.teams];
    const unmatched = [...ugTeams.unmatched, ...pgTeams.unmatched];
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
function formTeamsAntiBias(participants) {
    if (participants.length === 0) {
        return { teams: [], unmatched: [] };
    }
    const teams = [];
    const availableParticipants = [...participants];
    availableParticipants.sort((a, b) => getExperienceScore(b) - getExperienceScore(a));
    console.log(`Forming anti-bias teams from ${availableParticipants.length} participants`);
    const size2Participants = availableParticipants.filter(p => p.preferredTeamSize === 2);
    const size3Participants = availableParticipants.filter(p => p.preferredTeamSize === 3);
    const size4Participants = availableParticipants.filter(p => p.preferredTeamSize === 4);
    console.log(`Team size preferences: 2=${size2Participants.length}, 3=${size3Participants.length}, 4=${size4Participants.length}`);
    const size2Teams = formTeamsBySize(size2Participants, 2);
    const size3Teams = formTeamsBySize(size3Participants, 3);
    const size4Teams = formTeamsBySize(size4Participants, 4);
    const allTeams = [...size2Teams.teams, ...size3Teams.teams, ...size4Teams.teams];
    const remainingParticipants = [...size2Teams.unmatched, ...size3Teams.unmatched, ...size4Teams.unmatched];
    const additionalTeams = formTeamsFromRemaining(remainingParticipants);
    const finalTeams = [...allTeams, ...additionalTeams.teams];
    const unmatched = additionalTeams.unmatched;
    console.log(`Anti-bias team formation complete: ${finalTeams.length} teams, ${unmatched.length} unmatched`);
    return { teams: finalTeams, unmatched };
}
function formTeamsBySize(participants, targetSize) {
    const teams = [];
    const availableParticipants = [...participants];
    while (availableParticipants.length >= targetSize) {
        const team = createTeamWithAntiBiasLogic(availableParticipants, targetSize);
        if (team && team.members.length >= targetSize) {
            teams.push(team);
            console.log(`Formed ${targetSize}-member team with ${team.members.length} members`);
            team.members.forEach(member => {
                const index = availableParticipants.findIndex(p => p.id === member.id);
                if (index !== -1) {
                    availableParticipants.splice(index, 1);
                }
            });
        }
        else {
            break;
        }
    }
    return { teams, unmatched: availableParticipants };
}
function formTeamsFromRemaining(participants) {
    const teams = [];
    const availableParticipants = [...participants];
    while (availableParticipants.length >= config.minTeamSize) {
        let targetSize = 4;
        if (availableParticipants.length < 4)
            targetSize = 3;
        if (availableParticipants.length < 3)
            targetSize = 2;
        const team = createTeamWithAntiBiasLogic(availableParticipants, targetSize);
        if (team && team.members.length >= config.minTeamSize) {
            teams.push(team);
            console.log(`Formed additional ${targetSize}-member team with ${team.members.length} members`);
            team.members.forEach(member => {
                const index = availableParticipants.findIndex(p => p.id === member.id);
                if (index !== -1) {
                    availableParticipants.splice(index, 1);
                }
            });
        }
        else {
            console.log(`Anti-bias logic failed for ${targetSize}-member team, trying minimal constraints`);
            const teamWithMinimalConstraints = createTeamWithMinimalConstraints(availableParticipants, targetSize);
            if (teamWithMinimalConstraints && teamWithMinimalConstraints.members.length >= config.minTeamSize) {
                teams.push(teamWithMinimalConstraints);
                console.log(`Formed ${targetSize}-member team with minimal constraints`);
                teamWithMinimalConstraints.members.forEach(member => {
                    const index = availableParticipants.findIndex(p => p.id === member.id);
                    if (index !== -1) {
                        availableParticipants.splice(index, 1);
                    }
                });
            }
            else {
                break;
            }
        }
    }
    return { teams, unmatched: availableParticipants };
}
function createTeamWithMinimalConstraints(participants, targetSize) {
    if (participants.length < targetSize)
        return null;
    const anchor = participants[0];
    const team = [anchor];
    const remaining = participants.slice(1);
    console.log(`Starting ${targetSize}-member team with minimal constraints: ${anchor.fullName} (${anchor.currentYear})`);
    while (team.length < targetSize && remaining.length > 0) {
        const nextMember = findBestMatchWithMinimalConstraints(team, remaining, targetSize);
        if (nextMember) {
            team.push(nextMember);
            console.log(`Added member with minimal constraints: ${nextMember.fullName} (${nextMember.currentYear})`);
            const index = remaining.findIndex(p => p.id === nextMember.id);
            remaining.splice(index, 1);
        }
        else {
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
function findBestMatchWithMinimalConstraints(currentTeam, candidates, targetSize) {
    console.log(`Finding match with minimal constraints for ${targetSize}-member team of size ${currentTeam.length} from ${candidates.length} candidates`);
    const candidatesWithAvailability = filterByAvailabilityMatch(currentTeam, candidates);
    console.log(`After minimal availability filtering: ${candidatesWithAvailability.length} candidates`);
    if (candidatesWithAvailability.length === 0) {
        console.log('No candidates with availability match, allowing all candidates');
        return selectBestCandidateBasic(currentTeam, candidates, targetSize);
    }
    const bestCandidate = selectBestCandidateBasic(currentTeam, candidatesWithAvailability, targetSize);
    if (bestCandidate) {
        console.log(`Selected best candidate with minimal constraints: ${bestCandidate.fullName}`);
    }
    return bestCandidate;
}
function createTeamWithAntiBiasLogic(participants, targetSize) {
    if (participants.length < targetSize)
        return null;
    const anchor = participants[0];
    const team = [anchor];
    const remaining = participants.slice(1);
    console.log(`Starting ${targetSize}-member team with anchor: ${anchor.fullName} (${anchor.currentYear})`);
    while (team.length < targetSize && remaining.length > 0) {
        const nextMember = findBestMatchAntiBias(team, remaining, targetSize);
        if (nextMember) {
            team.push(nextMember);
            console.log(`Added member: ${nextMember.fullName} (${nextMember.currentYear})`);
            const index = remaining.findIndex(p => p.id === nextMember.id);
            remaining.splice(index, 1);
        }
        else {
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
function findBestMatchAntiBias(currentTeam, candidates, targetSize) {
    console.log(`Finding match for ${targetSize}-member team of size ${currentTeam.length} from ${candidates.length} candidates`);
    const candidatesWithCaseDiversity = filterByCaseTypeDiversity(currentTeam, candidates);
    console.log(`After case diversity filtering: ${candidatesWithCaseDiversity.length} candidates`);
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
function findBestMatchWithCandidates(currentTeam, candidates, targetSize) {
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
    const candidatesWithExperienceDiversity = filterByExperienceDiversity(currentTeam, candidatesWithSkillBalance);
    console.log(`After experience filtering: ${candidatesWithExperienceDiversity.length} candidates`);
    if (candidatesWithExperienceDiversity.length === 0) {
        console.log('No candidates that maintain experience diversity, allowing all candidates');
        return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithSkillBalance, targetSize);
    }
    const candidatesWithAvailabilityMatch = filterByAvailabilityMatch(currentTeam, candidatesWithExperienceDiversity);
    console.log(`After availability filtering: ${candidatesWithAvailabilityMatch.length} candidates`);
    if (candidatesWithAvailabilityMatch.length === 0) {
        console.log('No candidates with availability match, allowing all candidates');
        return findBestMatchWithRelaxedConstraints(currentTeam, candidatesWithExperienceDiversity, targetSize);
    }
    const bestCandidate = selectBestCandidateAntiBias(currentTeam, candidatesWithAvailabilityMatch, targetSize);
    if (bestCandidate) {
        console.log(`Selected best candidate: ${bestCandidate.fullName}`);
    }
    return bestCandidate;
}
function findBestMatchWithRelaxedConstraints(currentTeam, candidates, targetSize) {
    console.log(`Using relaxed constraints for team formation with ${candidates.length} candidates`);
    const candidatesWithAvailability = filterByAvailabilityMatch(currentTeam, candidates);
    console.log(`After final availability filtering: ${candidatesWithAvailability.length} candidates`);
    if (candidatesWithAvailability.length === 0) {
        console.log('No candidates even with relaxed constraints');
        return null;
    }
    const bestCandidate = selectBestCandidateBasic(currentTeam, candidatesWithAvailability, targetSize);
    if (bestCandidate) {
        console.log(`Selected best candidate with relaxed constraints: ${bestCandidate.fullName}`);
    }
    return bestCandidate;
}
function filterByCaseTypeDiversity(team, candidates) {
    if (team.length === 0)
        return candidates;
    const teamCaseTypes = team.flatMap(member => member.casePreferences);
    const uniqueTeamCaseTypes = new Set(teamCaseTypes);
    if (uniqueTeamCaseTypes.size === 0) {
        return candidates;
    }
    const candidatesWithDifferentCaseTypes = candidates.filter(candidate => {
        const candidateCaseTypes = new Set(candidate.casePreferences);
        const hasDifferentCaseTypes = candidate.casePreferences.some(caseType => !uniqueTeamCaseTypes.has(caseType));
        return hasDifferentCaseTypes;
    });
    return candidatesWithDifferentCaseTypes.length > 0 ? candidatesWithDifferentCaseTypes : candidates;
}
function filterByCaseTypeRelaxed(team, candidates) {
    if (team.length === 0)
        return candidates;
    const teamCaseTypes = team.flatMap(member => member.casePreferences);
    const uniqueTeamCaseTypes = new Set(teamCaseTypes);
    if (uniqueTeamCaseTypes.size === 0) {
        return candidates;
    }
    return candidates.filter(candidate => {
        const hasCommonCaseType = candidate.casePreferences.some(caseType => uniqueTeamCaseTypes.has(caseType));
        return hasCommonCaseType || team.length < 3;
    });
}
function filterByRoleCompatibility(team, candidates) {
    const teamRoles = team.flatMap(member => member.preferredRoles);
    const roleCounts = countRoles(teamRoles);
    return candidates.filter(candidate => {
        const candidateRoles = candidate.preferredRoles;
        for (const role of candidateRoles) {
            if (role === 'Flexible with any role')
                continue;
            const roleKey = roleMapping[role];
            if (roleKey === 'lead' && roleCounts.lead >= 2)
                return false;
            if (roleKey === 'designer' && roleCounts.designer >= 2)
                return false;
            if (roleKey === 'presenter' && roleCounts.presenter >= 2)
                return false;
        }
        return true;
    });
}
function filterByRoleCompatibilityRelaxed(team, candidates) {
    const teamRoles = team.flatMap(member => member.preferredRoles);
    const roleCounts = countRoles(teamRoles);
    return candidates.filter(candidate => {
        const candidateRoles = candidate.preferredRoles;
        for (const role of candidateRoles) {
            if (role === 'Flexible with any role')
                continue;
            const roleKey = roleMapping[role];
            if (roleKey === 'lead' && roleCounts.lead >= 3)
                return false;
            if (roleKey === 'designer' && roleCounts.designer >= 3)
                return false;
            if (roleKey === 'presenter' && roleCounts.presenter >= 3)
                return false;
        }
        return true;
    });
}
function filterBySkillComplementarity(team, candidates) {
    return candidates.filter(candidate => {
        const teamWithCandidate = [...team, candidate];
        const hasStrategist = hasSkillFromCategory(teamWithCandidate, requiredRoles.strategist);
        const hasAnalyst = hasSkillFromCategory(teamWithCandidate, requiredRoles.analyst);
        const hasCommunicator = hasSkillFromCategory(teamWithCandidate, requiredRoles.communicator);
        const hasDesigner = hasSkillFromCategory(teamWithCandidate, requiredRoles.designer);
        const requiredRolesCovered = [hasStrategist, hasAnalyst, hasCommunicator, hasDesigner]
            .filter(Boolean).length >= 2;
        return requiredRolesCovered;
    });
}
function filterBySkillComplementarityRelaxed(team, candidates) {
    return candidates.filter(candidate => {
        const teamWithCandidate = [...team, candidate];
        const hasStrategist = hasSkillFromCategory(teamWithCandidate, requiredRoles.strategist);
        const hasAnalyst = hasSkillFromCategory(teamWithCandidate, requiredRoles.analyst);
        const hasCommunicator = hasSkillFromCategory(teamWithCandidate, requiredRoles.communicator);
        const hasDesigner = hasSkillFromCategory(teamWithCandidate, requiredRoles.designer);
        const requiredRolesCovered = [hasStrategist, hasAnalyst, hasCommunicator, hasDesigner]
            .filter(Boolean).length >= 1;
        return requiredRolesCovered;
    });
}
function filterByExperienceDiversity(team, candidates) {
    const teamExperienceScores = team.map(getExperienceScore);
    const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
    const hasBeginnerMember = teamExperienceScores.some(score => score <= 1);
    return candidates.filter(candidate => {
        const candidateExperience = getExperienceScore(candidate);
        if (!hasExperiencedMember && candidateExperience >= 3) {
            return true;
        }
        if (!hasBeginnerMember && candidateExperience <= 1) {
            return true;
        }
        return true;
    });
}
function filterByAvailabilityMatch(team, candidates) {
    if (team.length === 0)
        return candidates;
    const teamAvailabilityScores = team.map(getAvailabilityScore);
    const avgTeamAvailability = teamAvailabilityScores.reduce((a, b) => a + b, 0) / teamAvailabilityScores.length;
    return candidates.filter(candidate => {
        const candidateAvailability = getAvailabilityScore(candidate);
        const availabilityDiff = Math.abs(candidateAvailability - avgTeamAvailability);
        return availabilityDiff <= 2;
    });
}
function selectBestCandidateAntiBias(team, candidates, targetSize) {
    if (candidates.length === 0)
        return null;
    let bestCandidate = null;
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
function calculateAntiBiasCompatibilityScore(team, candidate, targetSize) {
    const teamWithCandidate = [...team, candidate];
    let score = 0;
    const teamCaseTypes = team.flatMap(member => member.casePreferences);
    const uniqueTeamCaseTypes = new Set(teamCaseTypes);
    const candidateCaseTypes = new Set(candidate.casePreferences);
    const hasDifferentCaseTypes = candidate.casePreferences.some(caseType => !uniqueTeamCaseTypes.has(caseType));
    if (hasDifferentCaseTypes) {
        score += 0.4;
    }
    else {
        score += 0.1;
    }
    const teamExperienceScores = team.map(getExperienceScore);
    const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
    const hasBeginnerMember = teamExperienceScores.some(score => score <= 1);
    const candidateExperience = getExperienceScore(candidate);
    if (!hasExperiencedMember && candidateExperience >= 3) {
        score += 0.3;
    }
    else if (!hasBeginnerMember && candidateExperience <= 1) {
        score += 0.2;
    }
    if (candidate.preferredTeamSize === targetSize) {
        score += 0.2;
    }
    const teamAvailabilityScores = team.map(getAvailabilityScore);
    const avgTeamAvailability = teamAvailabilityScores.reduce((a, b) => a + b, 0) / teamAvailabilityScores.length;
    const candidateAvailability = getAvailabilityScore(candidate);
    const availabilityDiff = Math.abs(candidateAvailability - avgTeamAvailability);
    score += (1 - availabilityDiff * 0.2) * 0.2;
    const uniqueSkills = new Set(teamWithCandidate.flatMap(member => member.coreStrengths)).size;
    const totalSkills = teamWithCandidate.reduce((total, member) => total + member.coreStrengths.length, 0);
    if (totalSkills > 0) {
        const diversityBonus = (uniqueSkills / totalSkills) * 0.1;
        score += diversityBonus;
    }
    return Math.min(score, 1.0);
}
function selectBestCandidateBasic(team, candidates, targetSize) {
    if (candidates.length === 0)
        return null;
    let bestCandidate = null;
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
function calculateBasicCompatibilityScore(team, candidate, targetSize) {
    let score = 0;
    if (candidate.preferredTeamSize === targetSize) {
        score += 0.3;
    }
    const teamAvailabilityScores = team.map(getAvailabilityScore);
    const avgTeamAvailability = teamAvailabilityScores.reduce((a, b) => a + b, 0) / teamAvailabilityScores.length;
    const candidateAvailability = getAvailabilityScore(candidate);
    const availabilityDiff = Math.abs(candidateAvailability - avgTeamAvailability);
    score += (1 - availabilityDiff * 0.2) * 0.3;
    const teamExperienceScores = team.map(getExperienceScore);
    const hasExperiencedMember = teamExperienceScores.some(score => score >= 3);
    const candidateExperience = getExperienceScore(candidate);
    if (!hasExperiencedMember && candidateExperience >= 3) {
        score += 0.2;
    }
    const teamWithCandidate = [...team, candidate];
    const uniqueSkills = new Set(teamWithCandidate.flatMap(member => member.coreStrengths)).size;
    const totalSkills = teamWithCandidate.reduce((total, member) => total + member.coreStrengths.length, 0);
    if (totalSkills > 0) {
        const diversityBonus = (uniqueSkills / totalSkills) * 0.2;
        score += diversityBonus;
    }
    return Math.min(score, 1.0);
}
function countRoles(roles) {
    const counts = {
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
function hasSkillFromCategory(team, skillCategory) {
    return team.some(member => member.coreStrengths.some(skill => skillCategory.includes(skill)));
}
function createTeamObject(members) {
    const skillVector = createSkillVector(members);
    const compatibilityScore = calculateTeamCompatibilityScore(members);
    const averageExperience = members.reduce((sum, member) => sum + getExperienceScore(member), 0) / members.length;
    const commonCaseTypes = findCommonCaseTypes(members);
    const workStyleCompatibility = determineWorkStyleCompatibility(members);
    const teamSize = members.length;
    const membersWithPreferredSize = members.filter(member => member.preferredTeamSize === teamSize).length;
    const preferredTeamSizeMatch = (membersWithPreferredSize / members.length) * 100;
    return {
        id: (0, uuid_1.v4)(),
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
function createSkillVector(team) {
    const allSkills = [
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
        const memberCount = team.filter(member => member.coreStrengths.includes(skill)).length;
        return memberCount > 0 ? 1 : 0;
    });
}
function calculateTeamCompatibilityScore(team) {
    if (team.length <= 1)
        return 100;
    let totalScore = 0;
    const weights = config.weights;
    totalScore += calculateSkillCompatibility(team) * weights.skillCompatibility;
    totalScore += calculateExperienceBalance(team) * weights.experienceBalance;
    totalScore += calculateAvailabilityMatch(team) * weights.availabilityMatch;
    totalScore += calculateWorkStyleCompatibility(team) * weights.workStyleMatch;
    totalScore += calculateCaseTypeMatch(team) * weights.caseTypeMatch;
    totalScore += 1.0 * weights.educationLevelMatch;
    return totalScore * 100;
}
function calculateSkillCompatibility(team) {
    const hasStrategist = hasSkillFromCategory(team, requiredRoles.strategist);
    const hasAnalyst = hasSkillFromCategory(team, requiredRoles.analyst);
    const hasCommunicator = hasSkillFromCategory(team, requiredRoles.communicator);
    const hasDesigner = hasSkillFromCategory(team, requiredRoles.designer);
    let score = 0;
    if (hasStrategist)
        score += 0.25;
    if (hasAnalyst)
        score += 0.25;
    if (hasCommunicator)
        score += 0.25;
    if (hasDesigner)
        score += 0.25;
    const totalSkills = team.reduce((total, member) => total + member.coreStrengths.length, 0);
    const uniqueSkills = new Set(team.flatMap(member => member.coreStrengths)).size;
    if (totalSkills > 0) {
        const diversityBonus = (uniqueSkills / totalSkills) * 0.5;
        score += diversityBonus;
    }
    return Math.min(score, 1.0);
}
function calculateExperienceBalance(team) {
    const experienceScores = team.map(getExperienceScore);
    const avgExperience = experienceScores.reduce((a, b) => a + b, 0) / experienceScores.length;
    const hasExperienced = experienceScores.some(score => score >= 3);
    let score = 0.5;
    if (hasExperienced)
        score += 0.3;
    const variance = experienceScores.reduce((acc, score) => acc + Math.pow(score - avgExperience, 2), 0) / experienceScores.length;
    const balanceBonus = Math.max(0, 0.2 - (variance * 0.1));
    score += balanceBonus;
    return Math.min(score, 1.0);
}
function calculateAvailabilityMatch(team) {
    const availabilityScores = team.map(getAvailabilityScore);
    const avgAvailability = availabilityScores.reduce((a, b) => a + b, 0) / availabilityScores.length;
    const variance = availabilityScores.reduce((acc, score) => acc + Math.pow(score - avgAvailability, 2), 0) / availabilityScores.length;
    return Math.max(0, 1.0 - (variance * 0.5));
}
function calculateWorkStyleCompatibility(team) {
    const workStyles = team.map(member => member.workStyle);
    const structuredCount = workStyles.filter(style => style === 'Structured meetings and deadlines').length;
    const flexibleCount = workStyles.filter(style => style === 'Flexible work with async updates').length;
    const combinationCount = workStyles.filter(style => style === 'Combination of both').length;
    if (combinationCount === team.length)
        return 1.0;
    if (structuredCount === team.length)
        return 0.9;
    if (flexibleCount === team.length)
        return 0.9;
    if (combinationCount > 0)
        return 0.8;
    return 0.6;
}
function calculateCaseTypeMatch(team) {
    const allCaseTypes = team.flatMap(member => member.casePreferences);
    const uniqueCaseTypes = new Set(allCaseTypes);
    const commonTypes = [];
    for (const caseType of uniqueCaseTypes) {
        const memberCount = team.filter(member => member.casePreferences.includes(caseType)).length;
        if (memberCount >= Math.ceil(team.length / 2)) {
            commonTypes.push(caseType);
        }
    }
    if (commonTypes.length >= 3)
        return 0.9;
    if (commonTypes.length >= 2)
        return 0.8;
    if (commonTypes.length >= 1)
        return 0.7;
    return 0.5;
}
function findCommonCaseTypes(team) {
    const allCaseTypes = team.flatMap(member => member.casePreferences);
    const uniqueCaseTypes = new Set(allCaseTypes);
    const commonTypes = [];
    for (const caseType of uniqueCaseTypes) {
        const memberCount = team.filter(member => member.casePreferences.includes(caseType)).length;
        if (memberCount >= Math.ceil(team.length / 2)) {
            commonTypes.push(caseType);
        }
    }
    return commonTypes;
}
function determineWorkStyleCompatibility(team) {
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
function getExperienceScore(participant) {
    switch (participant.experience) {
        case 'Finalist/Winner in at least one': return 4;
        case 'Participated in 3+': return 3;
        case 'Participated in 1–2': return 2;
        case 'None': return 1;
        default: return 1;
    }
}
function getAvailabilityScore(participant) {
    switch (participant.availability) {
        case 'Fully Available (10–15 hrs/week)': return 4;
        case 'Moderately Available (5–10 hrs/week)': return 3;
        case 'Lightly Available (1–4 hrs/week)': return 2;
        case 'Not available now, but interested later': return 1;
        default: return 3;
    }
}
function calculateTeamSizeDistribution(teams) {
    const distribution = { 2: 0, 3: 0, 4: 0 };
    teams.forEach(team => {
        distribution[team.teamSize] = (distribution[team.teamSize] || 0) + 1;
    });
    return distribution;
}
function calculateCaseTypeDistribution(teams) {
    const distribution = {};
    teams.forEach(team => {
        if (team.commonCaseTypes.length > 0) {
            const primaryCaseType = team.commonCaseTypes[0];
            distribution[primaryCaseType] = (distribution[primaryCaseType] || 0) + 1;
        }
    });
    return distribution;
}
