/**
 * Centralised catalogue – imported by:
 *   • components/resources.tsx (home page preview)
 *   • components/resources-content.tsx (filter UI)
 *   • app/resources/[id]/page.tsx  (detail view)
 */

/* ------------ types ------------ */

export interface Category {
  id: string
  name: string
}

export interface Resource {
  id: number
  title: string
  description: string
  tags: string[]
  type: string
  isFeatured: boolean
  link: string
  category: string

  /* optional fields used by the detail page */
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  rating?: number
  duration?: string
  author?: string
  publishedDate?: string
  aboutSection?: string
  included?: string[]
  audience?: string[]
}

/* ------------ category list ------------ */
/* NOTE: first item is "All" so resources-content.tsx can do slice(1) */

export const categories: Category[] = [
  { id: "all", name: "All" },
  { id: "Resume & Interview Help", name: "Resume & Interview Help" },
  { id: "Consulting Prep", name: "Consulting Prep" },
  { id: "Networking Tools", name: "Networking Tools" },
  { id: "Test Practice", name: "Test Practice" },
  { id: "Skill-Building Guides", name: "Skill-Building Guides" },
]

/* ------------ master resource list ------------ */

export const resources: Resource[] = [
  {
    id: 1,
    title: "Resume Template – 95% ATS Score",
    description:
      "ATS-tested formats used by top recruiters. Ship a recruiter-ready resume in under 30 minutes—no design headaches.",
    tags: ["Resume", "ATS", "Career"],
    type: "Template",
    isFeatured: true,
    link: "https://www.canva.com/design/DAGnUUYbRwE/KfPrw_x2qYk8ldSQj6ec6w/view?mode=preview",
    category: "Resume & Interview Help",
    difficulty: "Beginner",
    rating: 4.8,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-10",
    aboutSection:
      "This resume template is a professionally crafted tool developed in collaboration with experienced recruiters from top companies, ensuring it meets the high standards of both Applicant Tracking Systems (ATS) and human reviewers. Designed for clarity, precision, and speed, the template helps job seekers create a recruiter-ready resume in under 30 minutes without struggling with formatting or design issues. Whether you’re a student building your resume from scratch, a working professional refining your existing one, or a career switcher applying across industries, this resource is tailored to suit your needs.It includes editable formats compatible with Word, Google Docs, and PDF, along with ATS-compliant structures that increase your chances of passing automated screening systems. The template also comes with bullet point banks and pre-written content suggestions, allowing you to clearly articulate your experience, skills, and achievements. Its versatile layout adapts well across industries like tech, marketing, consulting, design, and finance.What makes this resource truly stand out is its focus on effectiveness. With recruiters often spending less than 10 seconds scanning a resume, this template ensures your most important information is immediately visible and easy to digest. The structure is built to emphasize strong visual hierarchy, keyword optimization, and clean formatting—helping you make a powerful impression while saving hours of resume-building effort..",
    included: [
     " Editable resume formats",
     "ATS-compliant structures",
     "Bullet point banks and pre-written line",
    ],
    audience: [
      "Students building resumes from scratch",
      "Working professionals optimizing resumes for hiring systems",
      "Career switchers applying across industries",
    ],
  },
  {
    id: 2,
    title: "PM Roadmap (Books, Casebooks, Guesstimates)",
    description:
      "Real resources. Not just folders dumped from the internet. Curated PM roadmap with books, casebooks, and guesstimates to help you prep seriously.",
    tags: ["Product Management", "Roadmap", "Career"],
    type: "Document",
    isFeatured: true,
    link: "https://docs.google.com/document/d/1VjHId1Q4OIAN8A6HxUmGwtWXcDFHgoP2/edit?usp=sharing&ouid=109980360727192573916&rtpof=true&sd=true",
    category: "Skill-Building Guides",
    difficulty: "Intermediate",
    rating: 4.9,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-02-12",
    aboutSection:
      "This Product Management (PM) roadmap is a thoughtfully curated resource built to provide serious candidates with everything they need to break into product roles—with structure, clarity, and real prep materials that reflect industry standards. Unlike scattered Google Drive folders or Reddit compilations, this roadmap has been carefully assembled to help you focus only on what truly matters. It includes a collection of the most insightful PM books that cover fundamentals, strategy, and execution, handpicked interview casebooks sourced from top companies like Google, Meta, and Amazon, and real-world guesstimate problems that simulate what you're likely to face in PM interviews.Whether you're a student aiming for a PM internship, a software engineer transitioning into product, or a marketer eyeing a cross-functional role, this resource serves as a strategic learning path—no fluff, no guesswork. Each section is chosen to build core competencies like product thinking, analytical problem-solving, prioritization, user empathy, and communication. It’s designed to help you not only understand the role of a PM but also to confidently navigate the hiring process from resume to final interview.By following this roadmap, you’ll save over 40 hours of aimless online searching, and instead, spend that time deeply focused on the skills and content that top recruiters and PM interviewers actually value. It’s more than just prep—it’s a career clarity toolkit for aspiring product leaders.",
    included: [
     "Curated book recommendations",
     "Handpicked casebooks",
     "Guesstimate problem sets",
    ],
    audience: [
      "Students preparing for PM internships",
      "Working professionals breaking into PM",
      "Engineers or marketers pivoting into product roles",
    ],
  },
  {
    id: 3,
    title: "400+ HR & Hiring Database",
    description:
      "Here's the 400+ HR & Hiring Database you requested. Verified contacts and updated links to help you reach the right people faster.",
    tags: ["Hiring", "HR Database", "Outreach"],
    type: "Spreadsheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1eefOcpEwQ8KquNgxKtsHYAX57kZTCfDkOWwcnd_u6iY/edit?usp=sharing",
    category: "Networking Tools",
    difficulty: "Beginner",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-03-02",
    aboutSection:
      " It’s not just a list—it’s a targeted outreach weapon. This database has verified hiring contacts across industries so you can stop guessing and start reaching decision-makers. Perfect for anyone tired of cold applying into the void. Customize your messages and dramatically increase your reply rate.This meticulously curated database contains verified contact information for 400+ HR professionals, recruiters, and hiring managers across top companies in India and globally. Each contact has been manually verified within the last 3 months to ensure accuracy. The database includes contacts from companies like TCS, Infosys, Wipro, Accenture, Deloitte, and many startups. You'll find direct email addresses, LinkedIn profiles, and specific departments they handle. The spreadsheet is organized by company, industry, and role type for easy filtering. Our users report a 40% response rate when using these contacts for cold outreach, significantly higher than industry averages.",
    included: [
      "400+ verified HR contact details",
      "Direct email addresses and LinkedIn profiles",
      "Company and department information",
      "Industry-wise categorization",
      "Last verification dates",
      "Cold outreach email templates",
    ],
    audience: [
      "Active job seekers",
      "Career changers exploring opportunities",
      "Recruiters building networks",
      "Sales professionals targeting HR departments",
      "Students seeking internship contacts",
    ],
  },
  {
    id: 4,
    title: "Consulting Resource Pack",
    description: "Frameworks, case interview guides, consulting resumes, and prep documents in one place.",
    tags: ["Consulting", "Case Prep", "MBB"],
    type: "Drive",
    isFeatured: true,
    link: "https://drive.google.com/drive/folders/1C_X7vdZd-xiRf6jiwGOOu4camIcDrs31?usp=sharing",
    category: "Consulting Prep",
    difficulty: "Intermediate",
    rating: 4.8,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-16",
    aboutSection:
      "This is the ultimate crash course for cracking consulting roles. Built from battle-tested frameworks, the pack combines structured thinking with resume prep and insider tips. It’s everything you need before walking into a consulting interview room—without the noise, only the gold. This Consulting Resource Pack is your one-stop-shop for acing case interviews and landing your dream consulting role. It includes a comprehensive collection of frameworks, case interview guides, consulting resumes, and prep documents, all meticulously curated by former consultants from McKinsey, BCG, and Bain. You'll find detailed guides on market sizing, profitability analysis, and other essential case interview topics. The pack also includes sample resumes that have helped candidates land interviews at top consulting firms. With this resource, you'll have everything you need to confidently tackle any case interview.",
    included: [
      "20+ proven case interview frameworks",
      "Market sizing and profitability guides",
      "MBB-style resume templates",
      "Case interview practice questions",
      "Consulting industry insights",
      "Interview preparation timeline",
    ],
    audience: [
      "MBA students targeting consulting",
      "Undergraduates applying to consulting firms",
      "Professionals switching to consulting",
      "Current consultants seeking promotion",
      "Case competition participants",
    ],
  },
  {
    id: 5,
    title: "Winner's Decks from Top Case Competitions",
    description: "Learn strategy, storytelling, and frameworks from real case comp winners.",
    tags: ["Consulting", "Competitions", "Strategy"],
    type: "Drive",
    isFeatured: true,
    link: "https://drive.google.com/drive/folders/1kMNsXolciOBd37AFf7QD82JgZb93ppLL",
    category: "Consulting Prep",
    difficulty: "Intermediate",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-16",
    aboutSection:
      " Why reinvent the wheel? These decks won top competitions at IIMs, IITs, and global challenges. See how winning teams structured their analysis, designed slides, and presented with impact. Whether you’re prepping for a campus comp or building a startup pitch, this is your inspiration vault. Unlock the secrets to winning case competitions with this exclusive collection of winner's decks from top competitions around the world. Learn the strategies, storytelling techniques, and frameworks used by the best teams to impress judges and win coveted prizes. Each deck has been carefully analyzed to identify key success factors. You'll gain insights into how to structure your presentations, develop compelling narratives, and present data effectively. This resource is perfect for students and professionals looking to hone their case-solving skills and stand out in competitive environments.",
    included: [
      "15+ winning presentation decks",
      "Strategy frameworks from champions",
      "Storytelling and narrative techniques",
      "Data visualization best practices",
      "Judge evaluation criteria",
      "Competition preparation timeline",
    ],
    audience: [
      "Business school students",
      "Case competition participants",
      "Consulting aspirants",
      "Strategy professionals",
      "Presentation skills seekers",
    ],
  },
  {
    id: 6,
    title: "Deloitte Online Assessment Kit",
    description: "Deloitte OA prep questions, format guides, and sample solutions.",
    tags: ["Consulting", "OA", "Deloitte"],
    type: "Drive",
    isFeatured: true,
    link: "https://drive.google.com/drive/folders/1UgwajcrTpdW-_So0ppxPbDD4W8GYHKM8?usp=sharing",
    category: "Test Practice",
    difficulty: "Intermediate",
    rating: 4.6,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-17",
    aboutSection:
      "The Deloitte OA has a unique structure and difficulty curve. This resource is a focused prep pack that mirrors the real assessment format. Practice smarter with real questions, and understand the logic Deloitte evaluates you on—communication, logical thinking, and business scenarios. Ace your Deloitte Online Assessment with this comprehensive prep kit. It includes a curated collection of practice questions, format guides, and sample solutions designed to help you master the skills tested in the Deloitte OA. You'll find detailed explanations for each question type, including logical reasoning, numerical reasoning, and situational judgment. The kit also includes tips and strategies for managing your time effectively and avoiding common mistakes. With this resource, you'll be well-prepared to tackle the Deloitte OA with confidence and increase your chances of landing an interview.",
    included: [
      "50+ practice questions with solutions",
      "Detailed format and timing guides",
      "Logical and numerical reasoning prep",
      "Situational judgment scenarios",
      "Time management strategies",
      "Common mistakes to avoid",
    ],
    audience: [
      "Deloitte job applicants",
      "Consulting interview candidates",
      "Business graduates",
      "Assessment test takers",
      "Career changers targeting consulting",
    ],
  },
  {
    id: 7,
    title: "PwC Online Assessment Kit",
    description: "Assessment materials and practice tests for PwC recruitment.",
    tags: ["PwC", "Assessment", "Consulting"],
    type: "PDF",
    isFeatured: true,
    link: "https://drive.google.com/file/d/1HbbP51h3G9sfxq-UIeylcv3XAUy2pl8T/view?usp=sharing",
    category: "Test Practice",
    difficulty: "Intermediate",
    rating: 4.6,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-18",
    aboutSection:
      " This PDF pack simulates the real OA environment for PwC. With clear walkthroughs, skill breakdowns, and accurate practice problems, you’ll walk into your PwC test with confidence. Especially useful if you’re new to consulting-style assessments. Prepare for your PwC recruitment process with this essential Online Assessment Kit. It contains a wealth of assessment materials and practice tests specifically designed for PwC candidates. You'll find realistic simulations of the actual assessment, covering topics such as verbal reasoning, numerical reasoning, and logical reasoning. The kit also includes detailed answer explanations and performance analysis to help you identify your strengths and weaknesses. With this resource, you'll be able to familiarize yourself with the assessment format and improve your performance, giving you a competitive edge in the PwC recruitment process.",
    included: [
      "Full-length practice assessments",
      "Verbal and numerical reasoning tests",
      "Logical reasoning challenges",
      "Detailed answer explanations",
      "Performance analysis tools",
      "PwC-specific preparation tips",
    ],
    audience: [
      "PwC job applicants",
      "Audit and consulting candidates",
      "Finance professionals",
      "Recent graduates",
      "Assessment preparation seekers",
    ],
  },
  {
    id: 8,
    title: "BCG Online Assessment Kit 1",
    description: "Comprehensive prep kit for BCG OA round 1, with samples and solved Qs.",
    tags: ["BCG", "Consulting", "OA"],
    type: "PDF",
    isFeatured: true,
    link: "https://drive.google.com/file/d/18UElMcTkEMHhuK7W1Kt7t0zdlY3bYedk/view?usp=drive_link",
    category: "Test Practice",
    difficulty: "Advanced",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-18",
    aboutSection:
      " Round 1 of BCG’s recruitment is make-or-break. This kit contains real-type questions and practical tips to avoid common traps. Learn how to time your answers, break down long prompts, and improve your test-taking strategies. This comprehensive prep kit is designed to help you excel in the first round of the BCG Online Assessment. It includes a curated collection of sample questions and solved problems that mirror the format and difficulty of the actual assessment. You'll find detailed explanations for each question, covering topics such as logical reasoning, numerical reasoning, and data interpretation. The kit also includes tips and strategies for managing your time effectively and maximizing your score. With this resource, you'll be well-prepared to tackle the BCG OA with confidence and advance to the next stage of the recruitment process.",
    included: [
      "BCG OA Round 1 question bank",
      "Detailed solution explanations",
      "Data interpretation exercises",
      "Logical reasoning challenges",
      "Time management techniques",
      "Scoring optimization strategies",
    ],
    audience: [
      "BCG job applicants",
      "Top-tier consulting candidates",
      "MBA students",
      "Strategy professionals",
      "High-achievers targeting MBB",
    ],
  },
  {
    id: 9,
    title: "BCG Online Assessment Kit 2",
    description: "Advanced questions and prep for BCG OA second round.",
    tags: ["BCG", "Online Assessment", "Prep"],
    type: "PDF",
    isFeatured: true,
    link: "https://drive.google.com/file/d/1E9UDyxdJalTKsgnEInqnAaUm_aCAQqit/view?usp=drive_link",
    category: "Test Practice",
    difficulty: "Advanced",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-18",
    aboutSection:
      " If you’ve made it past Round 1, don’t leave your final prep to chance. This advanced kit is built to reflect the analytical rigour of Round 2. It’s not about guessing—it’s about pattern detection, fast math, and structured logic. Perfect for ambitious BCG aspirants. Take your BCG Online Assessment preparation to the next level with this advanced prep kit for the second round. It includes a challenging set of questions and problems designed to test your critical thinking, problem-solving, and analytical skills. You'll find detailed solutions and explanations for each question, covering topics such as case analysis, data interpretation, and strategic thinking. The kit also includes tips and strategies for approaching complex problems and presenting your solutions effectively. With this resource, you'll be well-equipped to tackle the BCG OA second round and demonstrate your potential as a future consultant.",
    included: [
      "Advanced BCG OA Round 2 questions",
      "Complex case analysis scenarios",
      "Strategic thinking exercises",
      "Advanced data interpretation",
      "Problem-solving methodologies",
      "Presentation techniques",
    ],
    audience: [
      "BCG Round 2 candidates",
      "Advanced consulting applicants",
      "Experienced professionals",
      "Top MBA candidates",
      "Strategic thinking enthusiasts",
    ],
  },
  {
    id: 10,
    title: "SQL Handwritten Notes",
    description: "Neatly compiled handwritten notes to master SQL for interviews.",
    tags: ["SQL", "Tech", "Notes"],
    type: "PDF",
    isFeatured: true,
    link: "https://drive.google.com/file/d/1Of-jQ2rE8_DUgzGwiQ_O-7wXc7NY3h82/view?usp=sharing",
    category: "Skill-Building Guides",
    difficulty: "Beginner",
    rating: 4.6,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-20",
    aboutSection:
      " Forget scattered video tutorials. These notes are sharp, visual, and quick to revise before interviews. Covers SELECT to JOINS to AGGREGATES—all with real-world use cases. Ideal for coding, data, and product roles.Master SQL for your technical interviews with these neatly compiled handwritten notes. This resource provides a concise and easy-to-understand overview of essential SQL concepts, including data types, operators, functions, and queries. You'll find clear explanations and examples for each topic, making it easy to grasp the fundamentals of SQL. The notes also cover common interview questions and provide tips for solving them effectively. Whether you're a beginner or an experienced programmer, this resource will help you brush up on your SQL skills and ace your technical interviews.",
    included: [
      "Comprehensive SQL syntax guide",
      "Data types and operators reference",
      "Query optimization techniques",
      "Common interview questions",
      "Practical examples and exercises",
      "Database design principles",
    ],
    audience: [
      "Software engineering candidates",
      "Data analyst aspirants",
      "Database administrators",
      "Technical interview preppers",
      "SQL beginners and refreshers",
    ],
  },
  {
    id: 11,
    title: "500+ HR Database",
    description: "Get access to HR contacts across top companies—great for cold emailing and networking.",
    tags: ["HR", "Database", "Job Search"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1Ir99bjGbAixpuYlDKMlThYAf2_QIV8d3AxIR5DUYhqM/edit?gid=0#gid=0",
    category: "Networking Tools",
    difficulty: "Intermediate",
    rating: 4.8,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-20",
    aboutSection:
      " This database is your cold-emailing launchpad. No fluff, just names, contacts, and categories. Instead of applying to job portals, connect directly with HRs and hiring managers across top companies.Expand your network and accelerate your job search with this comprehensive database of 500+ HR contacts across top companies. This resource provides you with direct access to HR professionals, recruiters, and hiring managers, making it easier to connect with the right people and get your foot in the door. You can use this database for cold emailing, networking, and building relationships with potential employers. The database is regularly updated to ensure accuracy and includes contact information for companies across various industries and locations. With this resource, you'll be able to reach out to the right people and increase your chances of landing your dream job.",
    included: [
      "500+ verified HR contact details",
      "Multi-industry coverage",
      "Direct email and LinkedIn profiles",
      "Company size and location data",
      "Regular database updates",
      "Networking strategy guide",
    ],
    audience: [
      "Job seekers across all industries",
      "Career networking enthusiasts",
      "Sales and business development professionals",
      "Recruiters building connections",
      "Students seeking mentorship",
    ],
  },
  {
    id: 12,
    title: "Top Product Companies Hiring",
    description: "List of 500+ companies hiring for product roles, updated regularly.",
    tags: ["Product", "Hiring", "Career"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1CLg4IwpwCguJ5hJuM5Ctq2PPFZjJZ8h59sN_EVkV8-A/edit?usp=sharing",
    category: "Networking Tools",
    difficulty: "Intermediate",
    rating: 4.8,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-21",
    aboutSection:
      " Your shortcut to finding active product job openings. Updated regularly and curated manually, this saves hours you'd waste on job boards. Especially helpful for folks targeting entry-level and growth product roles.Discover the top product companies that are actively hiring with this regularly updated list of 500+ companies. This resource provides you with a comprehensive overview of the product landscape, including companies of all sizes and across various industries. You'll find information on open positions, company culture, and employee benefits, making it easier to identify the right opportunities for your career goals. The list is updated regularly to ensure accuracy and includes companies from around the world. With this resource, you'll be able to stay informed about the latest product hiring trends and find your dream product role.",
    included: [
      "500+ product companies database",
      "Current job openings tracker",
      "Company culture insights",
      "Salary and benefits information",
      "Regular updates and additions",
      "Application tracking system",
    ],
    audience: [
      "Product managers and aspirants",
      "Product designers and researchers",
      "Product marketing professionals",
      "Career changers entering product",
      "Students exploring product careers",
    ],
  },
  {
    id: 13,
    title: "Software Hiring Database",
    description: "Spreadsheet of software companies currently hiring across roles and levels.",
    tags: ["Software", "Hiring", "Tech"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1AZ6hOX6pyfgg11ithVnn7stzPGABoVeUl5gBfgOIa28/edit?gid=0#gid=0",
    category: "Networking Tools",
    difficulty: "Intermediate",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-22",
    aboutSection:
      " Tired of “we’re not hiring” messages? This database highlights companies actively hiring. Curated to save time and boost your outreach efforts—because good engineers shouldn't waste time refreshing LinkedIn feedsFind your next software engineering role with this comprehensive database of software companies that are currently hiring across various roles and levels. This resource provides you with a detailed overview of the software hiring landscape, including companies of all sizes and across various industries. You'll find information on open positions, company culture, and employee benefits, making it easier to identify the right opportunities for your career goals. The database is regularly updated to ensure accuracy and includes companies from around the world. With this resource, you'll be able to stay informed about the latest software hiring trends and find your dream software engineering role.",
    included: [
      "Comprehensive software company listings",
      "Role-specific job openings",
      "Experience level categorization",
      "Technology stack information",
      "Company size and funding details",
      "Application deadline tracking",
    ],
    audience: [
      "Software engineers at all levels",
      "Full-stack developers",
      "Frontend and backend specialists",
      "DevOps and infrastructure engineers",
      "Computer science graduates",
    ],
  },
  {
    id: 14,
    title: "Product Hiring Database",
    description: "Top 500+ product hiring leads with roles, companies, and application links.",
    tags: ["Product", "Database", "Hiring"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1IDor9Hn6r4fIg_DtQVD57B0_OKZLfJZv9olD2T4yswA/edit?gid=0#gid=0",
    category: "Networking Tools",
    difficulty: "Intermediate",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-22",
    aboutSection:
      " Product roles are tough to find—and even harder to track. This live database features real leads across startups and big tech. Get rid of stale job boards and start applying where the doors are open.Accelerate your product job search with this database of 500+ product hiring leads, complete with roles, companies, and application links. This resource provides you with a comprehensive overview of the product hiring landscape, including companies of all sizes and across various industries. You'll find information on open positions, company culture, and employee benefits, making it easier to identify the right opportunities for your career goals. The database is regularly updated to ensure accuracy and includes companies from around the world. With this resource, you'll be able to stay informed about the latest product hiring trends and find your dream product role.",
    included: [
      "500+ active product job listings",
      "Direct application links",
      "Hiring manager contact information",
      "Salary range estimates",
      "Company product focus areas",
      "Interview process insights",
    ],
    audience: [
      "Product management professionals",
      "Product marketing managers",
      "Product analysts and researchers",
      "Growth and strategy professionals",
      "MBA graduates targeting product",
    ],
  },
  {
    id: 15,
    title: "Realtime HR Database",
    description: "Live-updated database of HRs, recruiters, and hiring managers in tech + product.",
    tags: ["HR", "Hiring", "Database"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/14V5bW7kNfyKBrNo78vrjUHuTnBTT0dVXQI_GQT6zPMM/edit?gid=0#gid=0",
    category: "Networking Tools",
    difficulty: "Intermediate",
    rating: 4.8,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-23",
    aboutSection:
      " Static lists go stale. This live sheet is monitored and updated for active hiring status. Find who's hiring now, not six months ago. Especially valuable for tech and product roles.Connect with HR professionals, recruiters, and hiring managers in the tech and product industries with this live-updated database. This resource provides you with direct access to key contacts, making it easier to network, build relationships, and get your foot in the door. The database is updated in real-time to ensure accuracy and includes contact information for companies of all sizes and across various industries. You can use this database for cold emailing, networking, and building relationships with potential employers. With this resource, you'll be able to reach out to the right people and increase your chances of landing your dream job.",
    included: [
      "Real-time updated contact database",
      "Tech and product industry focus",
      "Recruiter specialization areas",
      "Contact verification timestamps",
      "Outreach success rate tracking",
      "Personalized email templates",
    ],
    audience: [
      "Tech and product job seekers",
      "Career changers entering tech",
      "Networking professionals",
      "Startup job hunters",
      "Remote work seekers",
    ],
  },
  {
    id: 16,
    title: "McKinsey Interview Kit + Online Assessment",
    description: "Your complete guide to cracking McKinsey OA and interview rounds.",
    tags: ["McKinsey", "Interview", "Consulting"],
    type: "Drive",
    isFeatured: true,
    link: "https://drive.google.com/drive/folders/104J6UmywlfSM8h-jq0KfsvPuiFpAAgkA?usp=sharing",
    category: "Consulting Prep",
    difficulty: "Advanced",
    rating: 4.9,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-23",
    aboutSection:
      "McKinsey’s recruitment process is like no other. This kit walks you through each round—from the gamified Solve assessment to the behavior-heavy PEI. Learn the mindsets they test for, and prep using real examples.Ace your McKinsey Online Assessment and interview rounds with this complete guide. This resource provides you with everything you need to prepare for the McKinsey recruitment process, including practice questions, case studies, and interview tips. You'll find detailed explanations for each question type, as well as strategies for approaching complex problems and presenting your solutions effectively. The kit also includes sample resumes and cover letters that have helped candidates land interviews at McKinsey. With this resource, you'll be well-prepared to tackle the McKinsey recruitment process with confidence and increase your chances of landing your dream consulting role.",
    included: [
      "Complete McKinsey OA preparation",
      "Case interview frameworks and examples",
      "Personal Experience Interview guide",
      "McKinsey-specific resume templates",
      "Behavioral interview preparation",
      "Offer negotiation strategies",
    ],
    audience: [
      "McKinsey job applicants",
      "Top-tier consulting candidates",
      "MBA students targeting MBB",
      "Experienced professionals switching to consulting",
      "High-achievers seeking elite opportunities",
    ],
  },
  {
    id: 17,
    title: "Excel Financial Model Template",
    description: "Ready-to-use financial model template for students, analysts, and early startups.",
    tags: ["Finance", "Excel", "Model"],
    type: "Sheet",
    isFeatured: true,
    link: "https://docs.google.com/spreadsheets/d/1jlLHL7ePvwE-ULnTH1wcU7ZoqcK356Wc/edit?usp=sharing",
    category: "Skill-Building Guides",
    difficulty: "Intermediate",
    rating: 4.7,
    duration: "—",
    author: "Beyond Career",
    publishedDate: "2024-01-24",
    aboutSection:
      " Whether you're building a pitch deck or prepping for a finance role, this Excel template helps you simulate real business numbers. From projections to break-even analysis, it’s ready to plug and play—no need to build from scratch. Build professional-grade financial models with this ready-to-use Excel template, designed for students, analysts, and early-stage startups. This resource provides you with a customizable template that you can use to create financial projections, analyze investment opportunities, and make informed business decisions. The template includes pre-built formulas and charts, making it easy to input your data and generate meaningful insights. Whether you're a student learning about financial modeling or an entrepreneur building your first startup, this resource will help you create accurate and professional financial models.",
    included: [
      "Complete 3-statement financial model",
      "DCF valuation template",
      "Scenario and sensitivity analysis",
      "Professional charts and visualizations",
      "Formula documentation",
      "Best practices guide",
    ],
    audience: [
      "Finance students and professionals",
      "Investment banking analysts",
      "Startup founders and entrepreneurs",
      "Business school students",
      "Financial planning professionals",
    ],
  },
 
]

/* ---- add more resources below as needed ---- */
