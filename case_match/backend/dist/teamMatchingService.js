"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTeamMatching = processTeamMatching;
const csv_parser_1 = require("./csv-parser");
const matchmaking_1 = require("./matchmaking");
async function processTeamMatching(options) {
    const { csvData, strictEducationSeparation = true, strictTeamSizeMatching = true, logLevel = 'detailed' } = options;
    try {
        if (logLevel !== 'minimal') {
            console.log('Starting enhanced team matching process...');
            console.log(`Options: strictEducationSeparation=${strictEducationSeparation}, strictTeamSizeMatching=${strictTeamSizeMatching}`);
        }
        const participants = await (0, csv_parser_1.parseCSVToParticipants)(csvData);
        if (participants.length === 0) {
            return {
                success: false,
                error: 'No valid participants found in CSV',
                details: 'Please check that your CSV file has the correct format and contains valid participant data.'
            };
        }
        const parseStats = {
            totalRows: csvData.split('\n').length - 1,
            totalParsed: participants.length,
            skippedRows: 0,
            errors: []
        };
        parseStats.skippedRows = parseStats.totalRows - parseStats.totalParsed;
        if (logLevel !== 'minimal') {
            console.log(`Parsed ${participants.length} participants from ${parseStats.totalRows} rows`);
        }
        const warnings = [];
        const missingNames = participants.filter(p => !p.fullName.trim()).length;
        const missingEmails = participants.filter(p => !p.email.trim()).length;
        const missingColleges = participants.filter(p => !p.collegeName.trim()).length;
        if (missingNames > 0)
            warnings.push(`${missingNames} participants have missing names`);
        if (missingEmails > 0)
            warnings.push(`${missingEmails} participants have missing emails`);
        if (missingColleges > 0)
            warnings.push(`${missingColleges} participants have missing college names`);
        const ugParticipants = participants.filter(p => !p.currentYear.includes('PG') && !p.currentYear.includes('MBA'));
        const pgParticipants = participants.filter(p => p.currentYear.includes('PG') || p.currentYear.includes('MBA'));
        if (ugParticipants.length === 0) {
            warnings.push('No undergraduate participants found');
        }
        if (pgParticipants.length === 0) {
            warnings.push('No postgraduate participants found');
        }
        if (logLevel === 'verbose') {
            console.log(`Education distribution: ${ugParticipants.length} UG, ${pgParticipants.length} PG`);
        }
        const teamSizeDistribution = participants.reduce((acc, p) => {
            acc[p.preferredTeamSize] = (acc[p.preferredTeamSize] || 0) + 1;
            return acc;
        }, {});
        if (logLevel !== 'minimal') {
            console.log('Team size preferences:', teamSizeDistribution);
        }
        Object.entries(teamSizeDistribution).forEach(([size, count]) => {
            const sizeNum = parseInt(size);
            if (count % sizeNum !== 0) {
                warnings.push(`${count} participants prefer team size ${size} (${count % sizeNum} may be unmatched)`);
            }
        });
        if (logLevel !== 'minimal') {
            console.log('Starting matchmaking algorithm...');
        }
        const result = (0, matchmaking_1.matchParticipantsToTeams)(participants);
        if (logLevel !== 'minimal') {
            console.log(`Matchmaking complete: ${result.teams.length} teams formed, ${result.unmatched.length} unmatched`);
        }
        const enhancedResult = {
            ...result,
            statistics: {
                ...result.statistics,
                teamSizeDistribution: result.teams.reduce((acc, team) => {
                    acc[team.teamSize] = (acc[team.teamSize] || 0) + 1;
                    return acc;
                }, {}),
                caseTypeDistribution: result.teams.reduce((acc, team) => {
                    team.commonCaseTypes.forEach(caseType => {
                        acc[caseType] = (acc[caseType] || 0) + 1;
                    });
                    return acc;
                }, {})
            }
        };
        if (result.unmatched.length > 0) {
            warnings.push(`${result.unmatched.length} participants could not be matched to teams`);
        }
        if (result.statistics.matchingEfficiency < 80) {
            warnings.push(`Low matching efficiency (${result.statistics.matchingEfficiency.toFixed(1)}%) - consider adjusting team size preferences`);
        }
        return {
            success: true,
            result: enhancedResult,
            parseStats,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    catch (error) {
        console.error('Error in team matching process:', error);
        return {
            success: false,
            error: 'Failed to process team matching',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
