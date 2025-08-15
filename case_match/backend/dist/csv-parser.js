"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSVToParticipants = parseCSVToParticipants;
const uuid_1 = require("uuid");
const csv_parser_1 = __importDefault(require("csv-parser"));
async function parseCSVToParticipants(csvData) {
    return new Promise((resolve, reject) => {
        const participants = [];
        let headers = [];
        const stream = require('stream');
        const readable = new stream.Readable();
        readable.push(csvData);
        readable.push(null);
        readable
            .pipe((0, csv_parser_1.default)())
            .on('headers', (headerList) => {
            headers = headerList;
            console.log('CSV Headers:', headers);
        })
            .on('data', (row) => {
            console.log('Processing row:', row);
            try {
                const participant = {
                    id: (0, uuid_1.v4)(),
                    fullName: row['Full Name'] || '',
                    email: row['Email ID'] || '',
                    whatsappNumber: row['WhatsApp Number'] || '',
                    collegeName: row['College Name'] || '',
                    currentYear: parseCurrentYear(row['Current Year of Study']),
                    coreStrengths: parseCoreStrengths(row['Top 3 Core Strengths']),
                    preferredRoles: parsePreferredRoles(row['Preferred Role(s)']),
                    workingStyle: parseWorkingStyle(row['Working Style Preferences'] || ''),
                    idealTeamStructure: parseIdealTeamStructure(row['Ideal Team Structure'] || ''),
                    lookingFor: parseLookingFor(row['Looking For'] || ''),
                    availability: parseAvailability(row['Availability (next 2–4 weeks)']),
                    experience: parseExperience(row['Previous Case Comp Experience']),
                    workStyle: parseWorkStyle(row['Work Style'] || ''),
                    casePreferences: parseCasePreferences(row['Case Comp Preferences']),
                    preferredTeamSize: parsePreferredTeamSize(row['Preferred Team Size'])
                };
                participants.push(participant);
                console.log(`Added participant: ${participant.fullName} (${participant.currentYear})`);
            }
            catch (error) {
                console.error('Error parsing row:', error);
                console.error('Row data:', row);
            }
        })
            .on('end', () => {
            console.log(`Successfully parsed ${participants.length} participants`);
            const ugCount = participants.filter(p => !p.currentYear.includes('PG') && !p.currentYear.includes('MBA')).length;
            const pgCount = participants.filter(p => p.currentYear.includes('PG') || p.currentYear.includes('MBA')).length;
            console.log(`Education distribution: ${ugCount} UG, ${pgCount} PG`);
            resolve(participants);
        })
            .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            reject(error);
        });
    });
}
function parseCurrentYear(value) {
    if (!value)
        return 'First Year';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('pg') ||
        normalized.includes('mba') ||
        normalized.includes('masters') ||
        normalized.includes('master') ||
        normalized.includes('postgraduate') ||
        normalized.includes('post graduate')) {
        if (normalized.includes('1st') || normalized.includes('1') || normalized.includes('first')) {
            return 'PG/MBA (1st Year)';
        }
        else {
            return 'PG/MBA (2nd Year)';
        }
    }
    if (normalized.includes('1st') || normalized.includes('1') || normalized.includes('first'))
        return 'First Year';
    if (normalized.includes('2nd') || normalized.includes('2') || normalized.includes('second'))
        return 'Second Year';
    if (normalized.includes('3rd') || normalized.includes('3') || normalized.includes('third'))
        return 'Third Year';
    if (normalized.includes('4th') || normalized.includes('4') || normalized.includes('fourth') || normalized.includes('final'))
        return 'Final Year';
    return 'First Year';
}
function parseCoreStrengths(value) {
    if (!value)
        return [];
    const strengths = value.split(/[;,\n]/).map(s => s.trim());
    const validStrengths = [];
    const strengthMap = {
        'strategy & structuring': 'Strategy & Structuring',
        'strategy and structuring': 'Strategy & Structuring',
        'data analysis & research': 'Data Analysis & Research',
        'data analysis and research': 'Data Analysis & Research',
        'financial modeling': 'Financial Modeling',
        'market research': 'Market Research',
        'presentation design (ppt/canva)': 'Presentation Design (PPT/Canva)',
        'presentation design': 'Presentation Design (PPT/Canva)',
        'public speaking & pitching': 'Public Speaking & Pitching',
        'public speaking and pitching': 'Public Speaking & Pitching',
        'time management & coordination': 'Time Management & Coordination',
        'time management and coordination': 'Time Management & Coordination',
        'innovation & ideation': 'Innovation & Ideation',
        'innovation and ideation': 'Innovation & Ideation',
        'ui/ux or product thinking': 'UI/UX or Product Thinking',
        'ui/ux': 'UI/UX or Product Thinking',
        'product thinking': 'UI/UX or Product Thinking',
        'storytelling': 'Storytelling',
        'technical (coding, app dev, automation)': 'Technical (Coding, App Dev, Automation)',
        'technical': 'Technical (Coding, App Dev, Automation)',
        'coding': 'Technical (Coding, App Dev, Automation)'
    };
    strengths.forEach(strength => {
        const normalized = strength.toLowerCase().trim();
        if (strengthMap[normalized]) {
            if (!validStrengths.includes(strengthMap[normalized])) {
                validStrengths.push(strengthMap[normalized]);
            }
        }
    });
    return validStrengths.slice(0, 3);
}
function parsePreferredRoles(value) {
    if (!value)
        return ['Flexible with any role'];
    const roles = value.split(/[;,\n]/).map(s => s.trim());
    const validRoles = [];
    const roleMap = {
        'team lead': 'Team Lead',
        'team leader': 'Team Lead',
        'leader': 'Team Lead',
        'researcher': 'Researcher',
        'data analyst': 'Data Analyst',
        'analyst': 'Data Analyst',
        'designer': 'Designer',
        'presenter': 'Presenter',
        'coordinator': 'Coordinator',
        'flexible with any role': 'Flexible with any role',
        'flexible': 'Flexible with any role',
        'any role': 'Flexible with any role'
    };
    roles.forEach(role => {
        const normalized = role.toLowerCase().trim();
        if (roleMap[normalized]) {
            if (!validRoles.includes(roleMap[normalized])) {
                validRoles.push(roleMap[normalized]);
            }
        }
    });
    return validRoles.length > 0 ? validRoles.slice(0, 2) : ['Flexible with any role'];
}
function parseWorkingStyle(value) {
    if (!value)
        return ['I enjoy brainstorming and team sessions', 'I prefer clearly divided responsibilities'];
    const styles = value.split(/[;,\n]/).map(s => s.trim());
    const validStyles = [];
    styles.forEach(style => {
        const normalized = style.toLowerCase().trim();
        if (normalized.includes('owning') || normalized.includes('start to finish')) {
            if (!validStyles.includes('I like owning a task from start to finish')) {
                validStyles.push('I like owning a task from start to finish');
            }
        }
        if (normalized.includes('divided') || normalized.includes('clear responsibilities')) {
            if (!validStyles.includes('I prefer clearly divided responsibilities')) {
                validStyles.push('I prefer clearly divided responsibilities');
            }
        }
        if (normalized.includes('brainstorming') || normalized.includes('team sessions')) {
            if (!validStyles.includes('I enjoy brainstorming and team sessions')) {
                validStyles.push('I enjoy brainstorming and team sessions');
            }
        }
        if (normalized.includes('independently') || normalized.includes('regular updates')) {
            if (!validStyles.includes('I prefer working independently with regular updates')) {
                validStyles.push('I prefer working independently with regular updates');
            }
        }
        if (normalized.includes('representing') || normalized.includes('presenting')) {
            if (!validStyles.includes('I like representing and presenting for the team')) {
                validStyles.push('I like representing and presenting for the team');
            }
        }
        if (normalized.includes('backstage') || normalized.includes('high-quality input')) {
            if (!validStyles.includes('I prefer backstage roles but ensure high-quality input')) {
                validStyles.push('I prefer backstage roles but ensure high-quality input');
            }
        }
    });
    return validStyles.length > 0 ? validStyles : ['I enjoy brainstorming and team sessions', 'I prefer clearly divided responsibilities'];
}
function parseIdealTeamStructure(value) {
    if (!value)
        return 'Diverse roles and specializations';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('similar') || normalized.includes('same')) {
        return 'Similar skillsets across all members';
    }
    if (normalized.includes('diverse') || normalized.includes('specialization')) {
        return 'Diverse roles and specializations';
    }
    if (normalized.includes('flexible') || normalized.includes('any structure')) {
        return 'Flexible with any structure';
    }
    return 'Diverse roles and specializations';
}
function parseLookingFor(value) {
    if (!value)
        return 'Build a new team from scratch';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('new team') || normalized.includes('scratch')) {
        return 'Build a new team from scratch';
    }
    if (normalized.includes('join') || normalized.includes('existing')) {
        return 'Join an existing team';
    }
    if (normalized.includes('both') || normalized.includes('either')) {
        return 'Open to both options';
    }
    return 'Build a new team from scratch';
}
function parseAvailability(value) {
    if (!value)
        return 'Moderately Available (5–10 hrs/week)';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('fully available') ||
        normalized.includes('10–15') ||
        normalized.includes('10-15') ||
        normalized.includes('15') ||
        normalized.includes('high') ||
        normalized.includes('very available')) {
        return 'Fully Available (10–15 hrs/week)';
    }
    if (normalized.includes('moderately available') ||
        normalized.includes('5–10') ||
        normalized.includes('5-10') ||
        normalized.includes('moderate')) {
        return 'Moderately Available (5–10 hrs/week)';
    }
    if (normalized.includes('lightly available') ||
        normalized.includes('1–4') ||
        normalized.includes('1-4') ||
        normalized.includes('light') ||
        normalized.includes('limited')) {
        return 'Lightly Available (1–4 hrs/week)';
    }
    if (normalized.includes('not available') ||
        normalized.includes('interested later') ||
        normalized.includes('busy')) {
        return 'Not available now, but interested later';
    }
    return 'Moderately Available (5–10 hrs/week)';
}
function parseExperience(value) {
    if (!value)
        return 'None';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('finalist') ||
        normalized.includes('winner') ||
        normalized.includes('won') ||
        normalized.includes('first place')) {
        return 'Finalist/Winner in at least one';
    }
    if (normalized.includes('3+') ||
        normalized.includes('3 or more') ||
        normalized.includes('more than 3') ||
        normalized.includes('multiple') ||
        normalized.includes('many')) {
        return 'Participated in 3+';
    }
    if (normalized.includes('1–2') ||
        normalized.includes('1-2') ||
        normalized.includes('1 to 2') ||
        normalized.includes('couple') ||
        normalized.includes('few')) {
        return 'Participated in 1–2';
    }
    if (normalized.includes('none') ||
        normalized.includes('no') ||
        normalized.includes('never') ||
        normalized.includes('first time')) {
        return 'None';
    }
    return 'None';
}
function parseWorkStyle(value) {
    if (!value)
        return 'Combination of both';
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('structured') && normalized.includes('deadlines') && !normalized.includes('flexible')) {
        return 'Structured meetings and deadlines';
    }
    if (normalized.includes('flexible') && normalized.includes('async') && !normalized.includes('structured')) {
        return 'Flexible work with async updates';
    }
    if (normalized.includes('combination') ||
        normalized.includes('both') ||
        normalized.includes('mix') ||
        (normalized.includes('structured') && normalized.includes('flexible'))) {
        return 'Combination of both';
    }
    return 'Combination of both';
}
function parseCasePreferences(value) {
    if (!value)
        return ['Consulting'];
    const preferences = value.split(/[;,\n]/).map(s => s.trim());
    const validPreferences = [];
    const preferenceMap = {
        'consulting': 'Consulting',
        'product/tech': 'Product/Tech',
        'product': 'Product/Tech',
        'tech': 'Product/Tech',
        'technology': 'Product/Tech',
        'marketing': 'Marketing',
        'social impact': 'Social Impact',
        'social': 'Social Impact',
        'impact': 'Social Impact',
        'operations/supply chain': 'Operations/Supply Chain',
        'operations': 'Operations/Supply Chain',
        'supply chain': 'Operations/Supply Chain',
        'finance': 'Finance',
        'financial': 'Finance',
        'public policy/esg': 'Public Policy/ESG',
        'public policy': 'Public Policy/ESG',
        'esg': 'Public Policy/ESG',
        'policy': 'Public Policy/ESG'
    };
    preferences.forEach(preference => {
        const normalized = preference.toLowerCase().trim();
        if (preferenceMap[normalized]) {
            if (!validPreferences.includes(preferenceMap[normalized])) {
                validPreferences.push(preferenceMap[normalized]);
            }
        }
    });
    return validPreferences.length > 0 ? validPreferences.slice(0, 3) : ['Consulting'];
}
function parsePreferredTeamSize(value) {
    if (!value)
        return 4;
    const normalized = value.toLowerCase().trim();
    if (normalized === '2' ||
        normalized.includes('2 member') ||
        normalized.includes('two') ||
        normalized.includes('pair'))
        return 2;
    if (normalized === '3' ||
        normalized.includes('3 member') ||
        normalized.includes('three') ||
        normalized.includes('trio'))
        return 3;
    if (normalized === '4' ||
        normalized.includes('4 member') ||
        normalized.includes('four') ||
        normalized.includes('quad'))
        return 4;
    return 4;
}
