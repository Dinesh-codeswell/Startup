# Case Competition Team Matchmaker

A sophisticated web application that automatically forms optimal teams for case competitions based on participant questionnaire responses using advanced matching algorithms.

## Features

### 🎯 **Smart Matching Algorithm**
- **Skill Complementarity**: Ensures teams have strategists, analysts, communicators, and coordinators
- **Experience Balance**: Balances experienced and novice participants
- **Availability Matching**: Groups participants with similar time commitments
- **Work Style Compatibility**: Matches compatible working preferences
- **Case Type Alignment**: Considers shared interests in competition types
- **Education Level Separation**: Keeps undergraduate and graduate students in separate teams

### 🔧 **Technical Features**
- **CSV Upload**: Easy bulk participant data import
- **Real-time Processing**: Instant team formation and results
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Detailed Analytics**: Team compatibility scores and statistics
- **Export Capabilities**: Results can be copied or printed

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **CSV Parser** for data processing
- **Advanced matching algorithms** with weighted scoring

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** for modern styling
- **Heroicons** for consistent iconography
- **File upload** with drag-and-drop support

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone/Download the project**
   ```bash
   # Navigate to project directory
   cd "Case Team Match"
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start the development servers**
   
   **Option A: Start both servers simultaneously**
   ```bash
   npm run dev
   ```

   **Option B: Start servers separately**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Usage

### CSV Format Requirements

Your CSV file should include the following columns:

| Column Name | Description | Example Values |
|-------------|-------------|----------------|
| Full Name | Participant's full name | "John Smith" |
| Email ID | Contact email | "john@example.com" |
| WhatsApp Number | Phone number | "+1234567890" |
| College Name | Institution name | "MIT" |
| Current Year of Study | Academic level | "Third Year", "PG/MBA (1st Year)" |
| Your Top 3 Core Strengths | Comma-separated skills | "Strategy & Structuring, Data Analysis & Research" |
| Preferred Role(s) in a Team | Up to 2 roles | "Team Lead, Presenter" |
| How do you prefer to work in a team? | Working style preferences | "I enjoy brainstorming and team sessions" |
| Ideal Team Structure | Team composition preference | "Diverse roles and specializations" |
| Are you looking to... | Team formation preference | "Build a new team from scratch" |
| Your Availability | Time commitment | "Fully Available (10–15 hrs/week)" |
| Previous Case Competition Experience | Experience level | "Participated in 3+" |
| Preferred Work Style | Meeting preferences | "Structured meetings and deadlines" |
| Which type(s) of case competitions are you most interested in? | Case preferences | "Consulting, Finance" |

### Core Strengths Options
- Strategy & Structuring
- Data Analysis & Research
- Financial Modeling
- Market Research
- Presentation Design (PPT/Canva)
- Public Speaking & Pitching
- Time Management & Coordination
- Innovation & Ideation
- UI/UX or Product Thinking
- Storytelling
- Technical (Coding, App Dev, Automation)

### Sample Data

A sample CSV file (`sample_participants.csv`) is included in the project root for testing.

## Matching Algorithm Details

### Weighted Scoring System
- **Skill Compatibility**: 25%
- **Experience Balance**: 20%
- **Availability Match**: 15%
- **Work Style Match**: 15%
- **Case Type Match**: 15%
- **Education Level Match**: 10%

### Team Formation Logic

1. **Education Level Separation**
   - Undergraduate students matched separately from graduate students
   - Ensures appropriate experience and maturity levels

2. **Experience-Led Team Building**
   - Most experienced participants become team anchors
   - Balanced distribution of experience across teams

3. **Skill Balance Requirements**
   - Each team needs: Strategist, Analyst, Communicator, Coordinator
   - Algorithm prevents skill overlap while ensuring coverage

4. **Compatibility Optimization**
   - Iterative matching to maximize team compatibility scores
   - Considers multiple factors simultaneously

5. **Team Size Constraints**
   - Preferred size: 4 members
   - Minimum size: 3 members
   - Maximum size: 5 members

## API Endpoints

### POST `/upload-csv`
Upload a CSV file for team matching.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: CSV file

**Response:**
```json
{
  "teams": [
    {
      "id": "team-uuid",
      "members": [...],
      "compatibilityScore": 85.2,
      "teamSize": 4,
      "averageExperience": 2.5,
      "commonCaseTypes": ["Consulting", "Finance"],
      "workStyleCompatibility": "Combination of both"
    }
  ],
  "unmatched": [...],
  "statistics": {
    "totalParticipants": 20,
    "teamsFormed": 5,
    "averageTeamSize": 4.0,
    "matchingEfficiency": 95.0
  }
}
```

## Development

### Backend Development
```bash
cd backend
npm run dev    # Start with hot reload
npm run build  # Build for production
npm test       # Run tests
```

### Frontend Development
```bash
cd frontend
npm start      # Start development server
npm run build  # Build for production
npm test       # Run tests
```

## Project Structure

```
Case Team Match/
├── backend/
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts          # Type definitions
│   │   ├── index.ts              # Express server & CSV parsing
│   │   └── matchmaking.ts        # Core matching algorithm
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx    # CSV upload component
│   │   │   ├── TeamResults.tsx   # Results display
│   │   │   ├── TeamCard.tsx      # Individual team display
│   │   │   ├── Statistics.tsx    # Matching statistics
│   │   │   └── LoadingSpinner.tsx
│   │   ├── types/
│   │   │   └── index.ts          # Frontend type definitions
│   │   ├── App.tsx               # Main application
│   │   ├── index.tsx             # React entry point
│   │   └── index.css             # Tailwind CSS
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── sample_participants.csv        # Test data
├── package.json                  # Root package.json
└── README.md
```

## Customization

### Algorithm Parameters
Edit `backend/src/matchmaking.ts` to adjust:
- Team size constraints
- Scoring weights
- Required skill categories
- Matching thresholds

### UI Customization
Edit `frontend/tailwind.config.js` and component files to customize:
- Color schemes
- Layout and spacing
- Component styling
- Responsive breakpoints

## Troubleshooting

### Common Issues

1. **"No valid participants found"**
   - Check CSV column headers match expected format
   - Ensure required fields (Full Name, Email ID) are populated

2. **Teams not forming optimally**
   - Verify participant data variety in skills and preferences
   - Check if minimum team size requirements are met

3. **Frontend not connecting to backend**
   - Ensure backend is running on port 4000
   - Check CORS configuration
   - Verify API endpoint URLs

### Support
For issues or questions, check the console logs in both frontend (browser dev tools) and backend (terminal) for detailed error messages.

## Future Enhancements

- **Manual Adjustments**: Allow organizers to manually adjust team assignments
- **Multiple Team Sizes**: Support for different competition team size requirements
- **Export Options**: PDF reports and Excel exports
- **Advanced Analytics**: Detailed compatibility breakdowns
- **Participant Preferences**: Allow participants to express teammate preferences
- **Database Integration**: Persistent storage for historical data
- **Email Notifications**: Automatic team assignment notifications

## License

This project is open source and available under the MIT License.
