/**
 * Demonstration records for authenticated and administrative screens.
 * Every value here is sample data for the prototype and is labelled in the UI.
 * Public content lives in site.ts and comes from the club's published material.
 */

export const DEMO_LABEL = 'Demonstration data — sample records for interface review, not live club information.'

export const demoMember = {
  id: 14,
  memberId: 'DC-2026-0014',
  name: 'Amina Juma',
  email: 'amina.juma@student.kiut.ac.tz',
  phone: '+255 712 000 014',
  course: 'Bachelor of Computer Science',
  year: 'Year 2',
  status: 'student' as const,
  title: 'Frontend developer',
  bio: 'Second-year computer science student building interfaces for campus projects. Currently learning React and design systems.',
  areasOfInterest: ['Web Development', 'UI/UX Design', 'Cloud Computing'],
  github: 'github.com/amina-dev',
  linkedin: 'linkedin.com/in/amina-juma',
  joined: '2025-10-12',
  points: 480,
  rank: 4,
  bestRank: 2,
  competitions: 6,
  warmupsCompleted: 9,
  team: 'Byte Builders',
  membership: {
    status: 'valid' as 'valid' | 'expired' | 'none',
    amount: 20000,
    paidOn: '2026-02-12',
    startDate: '2026-02-12',
    endDate: '2026-12-31',
    method: 'Mobile money',
    reference: 'MP-88214',
  },
  digitalId: {
    issued: '2025-10-12',
    validThrough: '2028-09-30',
    status: 'Active',
  },
  profileCompletion: 85,
}

export type DemoUser = {
  id: number
  name: string
  email: string
  role: 'student' | 'admin' | 'quizmaster'
  course: string
  year: string
  status: 'student' | 'alumni'
  approved: boolean
  active: boolean
  joined: string
  memberId: string
  points: number
}

export const demoUsers: DemoUser[] = [
  { id: 1, name: 'Neema Mwakyusa', email: 'neema.m@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Information Technology', year: 'Year 1', status: 'student', approved: false, active: true, joined: '2026-11-14', memberId: 'DC-2026-0021', points: 0 },
  { id: 2, name: 'Baraka Kimaro', email: 'baraka.k@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Software Engineering', year: 'Year 1', status: 'student', approved: false, active: true, joined: '2026-11-12', memberId: 'DC-2026-0020', points: 0 },
  { id: 3, name: 'Fatuma Ally', email: 'fatuma.a@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Data Science', year: 'Year 2', status: 'student', approved: false, active: true, joined: '2026-11-09', memberId: 'DC-2026-0019', points: 0 },
  { id: 4, name: 'Amina Juma', email: 'amina.juma@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Computer Science', year: 'Year 2', status: 'student', approved: true, active: true, joined: '2025-10-12', memberId: 'DC-2026-0014', points: 480 },
  { id: 5, name: 'Joseph Mtei', email: 'joseph.m@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Computer Science', year: 'Year 3', status: 'student', approved: true, active: true, joined: '2025-09-30', memberId: 'DC-2026-0011', points: 640 },
  { id: 6, name: 'Halima Nyoni', email: 'halima.n@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Cybersecurity', year: 'Year 2', status: 'student', approved: true, active: true, joined: '2025-11-02', memberId: 'DC-2026-0016', points: 520 },
  { id: 7, name: 'Elias Mwansa', email: 'elias.m@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Software Engineering', year: 'Year 3', status: 'student', approved: true, active: false, joined: '2025-08-19', memberId: 'DC-2026-0009', points: 310 },
  { id: 8, name: 'Grace Emmanuel', email: 'grace.e@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Information Technology', year: 'Year 2', status: 'student', approved: true, active: true, joined: '2025-10-25', memberId: 'DC-2026-0015', points: 395 },
  { id: 9, name: 'Samuel Mwita', email: 'samuel.m@student.kiut.ac.tz', role: 'quizmaster', course: 'Bachelor of Computer Science', year: 'Year 3', status: 'student', approved: true, active: true, joined: '2025-08-04', memberId: 'DC-2026-0006', points: 720 },
  { id: 10, name: 'Rehema Salum', email: 'rehema.s@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Data Science', year: 'Graduate', status: 'alumni', approved: true, active: true, joined: '2023-09-11', memberId: 'DC-2024-0002', points: 1120 },
  { id: 11, name: 'Ibrahim Kondo', email: 'ibrahim.k@student.kiut.ac.tz', role: 'student', course: 'Bachelor of Computer Science', year: 'Alumni', status: 'alumni', approved: true, active: true, joined: '2022-10-03', memberId: 'DC-2024-0001', points: 980 },
  { id: 12, name: 'Daniel Mushi', email: 'admin@digitalclub.kiut.ac.tz', role: 'admin', course: 'Bachelor of Computer Science', year: 'Year 4', status: 'student', approved: true, active: true, joined: '2024-01-15', memberId: 'DC-2026-0001', points: 0 },
]

export const demoNotifications = [
  { id: 1, title: 'Competition result published', body: 'Your submission for Weekly Challenge 05 — Dynamic Programming was ranked #2. 80 points were awarded.', date: '2026-11-16T10:20:00', read: false, kind: 'competition' },
  { id: 2, title: 'Session room changed', body: 'Week 06 — React Fundamentals will now meet in Computer Lab 2 instead of the Tech Lab.', date: '2026-11-15T16:05:00', read: false, kind: 'session' },
  { id: 3, title: 'Membership valid through 31 December', body: 'Your 2026 membership payment has been recorded. Your digital ID remains active.', date: '2026-11-10T09:12:00', read: true, kind: 'membership' },
  { id: 4, title: 'Team request approved', body: 'Byte Builders accepted your request to join the team.', date: '2026-11-04T13:40:00', read: true, kind: 'team' },
  { id: 5, title: 'Warmup quiz published', body: 'React Fundamentals Warmup is now available. Closes on 22 November at 18:00.', date: '2026-11-03T08:00:00', read: true, kind: 'quiz' },
]

export const demoRewardHistory = [
  { id: 1, points: 80, reason: '2nd place — Weekly Challenge 05: Dynamic Programming', type: 'Competition', date: '2026-11-16' },
  { id: 2, points: 40, reason: 'Event check-in — AI Bootcamp', type: 'Event', date: '2026-03-30' },
  { id: 3, points: 60, reason: 'Completed React Fundamentals warmup', type: 'Warmup', date: '2026-03-21' },
  { id: 4, points: 100, reason: 'Weekly Challenge 04 — Top 10 finish', type: 'Competition', date: '2026-03-14' },
  { id: 5, points: 25, reason: 'Workshop attendance — Git & GitHub', type: 'Event', date: '2026-02-28' },
  { id: 6, points: 175, reason: 'Semester contribution points', type: 'Manual', date: '2026-02-10' },
]

export const demoTrophies = [
  { name: 'First Commit', description: 'Awarded for your first approved project contribution.', points: 50, earnedOn: '2025-11-01' },
  { name: 'Warmup Regular', description: 'Complete five warmup quizzes in a semester.', points: 100, earnedOn: '2026-02-18' },
  { name: 'Podium Finish', description: 'Place in the top three of a weekly competition.', points: 150, earnedOn: '2026-11-16' },
  { name: 'Community Builder', description: 'Mentor a new member through their first project.', points: 200, earnedOn: null },
]

export const demoMemberProjects = [
  {
    id: 1,
    title: 'Library Seat Finder',
    description: 'A small web app that shows which seats are free in the KIUT library using a simple check-in form and a live occupancy view.',
    technologies: 'React, TypeScript, Firebase',
    link: 'https://github.com/amina-dev/library-seat-finder',
    demo: '',
    visibility: 'Public' as const,
    status: 'Published' as const,
    updated: '2026-11-12',
  },
  {
    id: 2,
    title: 'Timetable Reminder Bot',
    description: 'A Telegram bot that reads a course timetable and sends reminders before each class. Built as a first-year side project.',
    technologies: 'Python, SQLite, Telegram API',
    link: '',
    demo: '',
    visibility: 'Private' as const,
    status: 'Draft' as const,
    updated: '2026-10-28',
  },
]

export const demoMemberEvents = [
  {
    id: 7,
    title: 'AI Bootcamp',
    date: '2026-03-30T09:00:00',
    location: 'Computer Lab 1',
    type: 'Workshop',
    audience: 'Public event' as const,
    rsvp: 'approved' as const,
    checkedIn: true,
  },
  {
    id: 21,
    title: 'React Fundamentals — Week 06',
    date: '2026-11-25T16:00:00',
    location: 'Computer Lab 2',
    type: 'Members session',
    audience: 'Members' as const,
    rsvp: 'pending' as const,
    checkedIn: false,
  },
  {
    id: 22,
    title: 'Monthly Build — Campus Utility App',
    date: '2026-12-05T10:00:00',
    location: 'KIUT Tech Lab',
    type: 'Competition briefing',
    audience: 'Members' as const,
    rsvp: 'none' as const,
    checkedIn: false,
  },
]

export const demoSessions = {
  week: { label: 'Week 06', theme: 'React fundamentals', start: '2026-11-23', end: '2026-11-28', status: 'published' },
  sessions: [
    { id: 1, title: 'Components and props', date: '2026-11-23', start: '16:00', end: '17:30', venue: 'Computer Lab 2', instructor: 'Samuel Mwita', type: 'Core session', attendance: 'Required' },
    { id: 2, title: 'State and events', date: '2026-11-24', start: '16:00', end: '17:30', venue: 'Computer Lab 2', instructor: 'Amina Juma', type: 'Core session', attendance: 'Required' },
    { id: 3, title: 'Build a study tracker', date: '2026-11-26', start: '15:00', end: '17:00', venue: 'KIUT Tech Lab', instructor: 'Samuel Mwita', type: 'Lab', attendance: 'Optional' },
    { id: 4, title: 'Code review clinic', date: '2026-11-28', start: '10:00', end: '12:00', venue: 'Online', instructor: 'Joseph Mtei', type: 'Clinic', attendance: 'Optional' },
  ],
}

export const demoSessionsReports = [
  { id: 1, session: 'State and events', instructor: 'Amina Juma', submitted: '2026-11-24', attendees: 18, status: 'pending' },
  { id: 2, session: 'Components and props', instructor: 'Samuel Mwita', submitted: '2026-11-23', attendees: 21, status: 'approved' },
  { id: 3, session: 'Build a study tracker', instructor: 'Samuel Mwita', submitted: '2026-11-26', attendees: 12, status: 'pending' },
]

export const demoCompetitions = [
  {
    id: 1,
    title: 'Weekly Challenge 06 — Array & String Patterns',
    category: 'Algorithms',
    frequency: 'weekly' as const,
    level: 1,
    status: 'published' as const,
    startsAt: '2026-11-23T08:00:00',
    endsAt: '2026-11-29T18:00:00',
    submissionType: 'GitHub repository',
    eligibility: 'Year 1 and Year 2',
    enrolled: 34,
    description: 'Solve five array and string problems. Score is based on correctness, code clarity and explanation quality.',
    criteria: [
      { name: 'Correctness', max: 50, weight: 50, visible: true },
      { name: 'Code clarity', max: 30, weight: 30, visible: true },
      { name: 'Explanation', max: 20, weight: 20, visible: true },
    ],
    rewards: [
      { rank: '1st', points: 120, prize: 'Top Guard badge' },
      { rank: '2nd', points: 80, prize: '80 club points' },
      { rank: '3rd', points: 50, prize: '50 club points' },
    ],
  },
  {
    id: 2,
    title: 'Weekly Challenge 06 — Graph Traversal',
    category: 'Algorithms',
    frequency: 'weekly' as const,
    level: 2,
    status: 'judging' as const,
    startsAt: '2026-11-16T08:00:00',
    endsAt: '2026-11-22T18:00:00',
    submissionType: 'GitHub repository',
    eligibility: 'Year 2 and Year 3',
    enrolled: 21,
    description: 'Apply breadth-first and depth-first search to three campus routing problems. Judged on approach, efficiency and code quality.',
    criteria: [
      { name: 'Correctness', max: 40, weight: 40, visible: true },
      { name: 'Efficiency', max: 30, weight: 30, visible: true },
      { name: 'Code quality', max: 30, weight: 30, visible: true },
    ],
    rewards: [
      { rank: '1st', points: 150, prize: '150 club points' },
      { rank: '2nd', points: 100, prize: '100 club points' },
    ],
  },
  {
    id: 3,
    title: 'Weekly Challenge 05 — Dynamic Programming',
    category: 'Algorithms',
    frequency: 'weekly' as const,
    level: 1,
    status: 'finalized' as const,
    startsAt: '2026-11-09T08:00:00',
    endsAt: '2026-11-15T18:00:00',
    submissionType: 'GitHub repository',
    eligibility: 'All members',
    enrolled: 41,
    description: 'Four dynamic programming problems covering memoisation, tabulation and space optimisation.',
    criteria: [
      { name: 'Correctness', max: 60, weight: 60, visible: true },
      { name: 'Code clarity', max: 40, weight: 40, visible: true },
    ],
    rewards: [{ rank: 'Top 3', points: 80, prize: 'Podium points' }],
  },
  {
    id: 4,
    title: 'Monthly Build — Campus Utility App',
    category: 'Product build',
    frequency: 'monthly' as const,
    level: 2,
    status: 'draft' as const,
    startsAt: '2026-12-01T08:00:00',
    endsAt: '2026-12-20T18:00:00',
    submissionType: 'Video demo',
    eligibility: 'Year 2 and above',
    enrolled: 0,
    description: 'Design and build a small utility that solves a real campus problem. Teams of up to four members.',
    criteria: [
      { name: 'Problem fit', max: 30, weight: 30, visible: true },
      { name: 'Working demo', max: 40, weight: 40, visible: true },
      { name: 'Presentation', max: 30, weight: 30, visible: true },
    ],
    rewards: [{ rank: 'Top 3', points: 200, prize: 'Incubation review' }],
  },
]

export const demoLeaderboard = [
  { rank: 1, name: 'Joseph Mtei', level: 3, score: 94.5, points: 150, time: '2h 14m', status: 'reviewed' },
  { rank: 2, name: 'Amina Juma', level: 1, score: 91.0, points: 80, time: '3h 02m', status: 'reviewed' },
  { rank: 3, name: 'Halima Nyoni', level: 2, score: 88.5, points: 50, time: '2h 48m', status: 'reviewed' },
  { rank: 4, name: 'Grace Emmanuel', level: 1, score: 84.0, points: 25, time: '3h 40m', status: 'reviewed' },
  { rank: 5, name: 'Baraka Kimaro', level: 1, score: 79.5, points: 10, time: '4h 05m', status: 'submitted' },
]

export const demoTeam = {
  name: 'Byte Builders',
  tagline: 'Small tools for everyday campus problems',
  leader: 'Joseph Mtei',
  points: 1240,
  rating: 4.6,
  members: [
    { name: 'Joseph Mtei', role: 'Team leader', joined: '2025-10-04' },
    { name: 'Amina Juma', role: 'Frontend', joined: '2026-11-04' },
    { name: 'Halima Nyoni', role: 'Security review', joined: '2026-02-16' },
    { name: 'Grace Emmanuel', role: 'Research', joined: '2026-03-02' },
  ],
  requests: [
    { id: 1, name: 'Baraka Kimaro', course: 'Software Engineering · Year 1', requested: '2026-11-15' },
    { id: 2, name: 'Fatuma Ally', course: 'Data Science · Year 2', requested: '2026-11-12' },
  ],
  competitions: [
    { title: 'Monthly Build — Campus Utility App', status: 'Enrolling', teamSize: 4 },
    { title: 'Weekly Challenge 06 — Graph Traversal', status: 'Judging', teamSize: 3 },
  ],
}

export const demoTeams = [
  { id: 1, name: 'Byte Builders', leader: 'Joseph Mtei', members: 4, points: 1240, rating: 4.6, status: 'active', requests: 2 },
  { id: 2, name: 'Null Pointers', leader: 'Halima Nyoni', members: 3, points: 980, rating: 4.2, status: 'active', requests: 0 },
  { id: 3, name: 'Stack Sisters', leader: 'Grace Emmanuel', members: 4, points: 860, rating: 4.5, status: 'active', requests: 1 },
  { id: 4, name: 'Campus Labs', leader: 'Baraka Kimaro', members: 2, points: 310, rating: 3.8, status: 'active', requests: 0 },
  { id: 5, name: 'Runtime Terrors', leader: 'Elias Mwansa', members: 3, points: 220, rating: 3.1, status: 'suspended', requests: 0 },
]

export const demoRankings = [
  { rank: 1, name: 'Joseph Mtei', points: 640, competitions: 4, warmups: 11, best: 1, team: 'Byte Builders' },
  { rank: 2, name: 'Halima Nyoni', points: 520, competitions: 5, warmups: 8, best: 2, team: 'Null Pointers' },
  { rank: 3, name: 'Samuel Mwita', points: 720, competitions: 3, warmups: 12, best: 1, team: 'Byte Builders' },
  { rank: 4, name: 'Amina Juma', points: 480, competitions: 6, warmups: 9, best: 2, team: 'Byte Builders' },
  { rank: 5, name: 'Grace Emmanuel', points: 395, competitions: 4, warmups: 7, best: 3, team: 'Stack Sisters' },
  { rank: 6, name: 'Elias Mwansa', points: 310, competitions: 2, warmups: 4, best: 5, team: 'Runtime Terrors' },
]

export type DemoQuiz = {
  id: number
  title: string
  topic: string
  field: string
  status: 'published' | 'draft' | 'closed'
  duration: number
  questions: number
  closesAt: string
  attempts: number
  average: number
  best: number
  description: string
}

export const demoQuizzes: DemoQuiz[] = [
  { id: 1, title: 'React Fundamentals Warmup', topic: 'Components, state and props', field: 'Web Development', status: 'published', duration: 10, questions: 4, closesAt: '2026-11-22T18:00:00', attempts: 48, average: 74, best: 100, description: 'A short warmup on components, props and state. Two attempts are allowed; your best score counts.' },
  { id: 2, title: 'Python Basics Warmup', topic: 'Data types and control flow', field: 'Programming', status: 'published', duration: 15, questions: 12, closesAt: '2026-11-29T18:00:00', attempts: 63, average: 68, best: 100, description: 'Warmup covering Python data types, loops and functions. Open to all members.' },
  { id: 3, title: 'Networking Essentials', topic: 'IP addressing and protocols', field: 'Networking', status: 'draft', duration: 12, questions: 10, closesAt: '—', attempts: 0, average: 0, best: 0, description: 'Draft warmup awaiting quizmaster review.' },
]

export const demoQuizQuestions = [
  {
    id: 1,
    prompt: 'Which React feature lets a component remember values between renders?',
    options: ['State', 'Props', 'Context', 'Refs'],
    correct: 0,
  },
  {
    id: 2,
    prompt: 'What is the correct way to pass data from a parent to a child component?',
    options: ['Using global variables', 'Through props', 'By editing the DOM directly', 'Through CSS classes'],
    correct: 1,
  },
  {
    id: 3,
    prompt: 'Which hook is used to run a side effect after a render?',
    options: ['useState', 'useMemo', 'useEffect', 'useRef'],
    correct: 2,
  },
  {
    id: 4,
    prompt: 'Why should list items have a stable `key` prop?',
    options: ['To style each item', 'To help React identify which items changed', 'To sort the list automatically', 'To make the list scrollable'],
    correct: 1,
  },
]

export const demoElection = {
  id: 1,
  title: 'KIUT Digital Club Leadership Election 2026/27',
  description:
    'Annual democratic election for the club executive board, technical leads and department heads. Nominations are reviewed by the electoral committee before voting opens.',
  term: '2026/27',
  status: 'voting',
  applicationsOpen: '2026-11-02T08:00:00',
  applicationsClose: '2026-11-14T23:59:00',
  votingOpen: '2026-11-18T08:00:00',
  votingClose: '2026-11-24T18:00:00',
  eligibility: 'Approved members with an active membership',
  positions: [
    {
      id: 1,
      title: 'Chairman',
      seats: 1,
      description: 'Overall leadership and strategic direction of the club.',
      candidates: [
        { id: 1, name: 'Joseph Mtei', year: 'Year 3', manifesto: 'More build weeks, clearer project pipelines and a stronger mentorship structure for first-years.' },
        { id: 2, name: 'Halima Nyoni', year: 'Year 2', manifesto: 'A calendar members can plan around, plus open office hours with every technical lead.' },
      ],
    },
    {
      id: 2,
      title: 'General Secretary',
      seats: 1,
      description: 'Records, communication and coordination of club meetings.',
      candidates: [
        { id: 3, name: 'Grace Emmanuel', year: 'Year 2', manifesto: 'Publish decisions and minutes within 48 hours, every week.' },
        { id: 4, name: 'Amina Juma', year: 'Year 2', manifesto: 'A single source of truth for sessions, deadlines and club documents.' },
      ],
    },
    {
      id: 3,
      title: 'Technical Lead — Web',
      seats: 1,
      description: 'Leads web development workshops and reviews member projects.',
      candidates: [
        { id: 5, name: 'Baraka Kimaro', year: 'Year 1', manifesto: 'Learn by shipping: one small shipped project every month.' },
      ],
    },
    {
      id: 4,
      title: 'Project Manager',
      seats: 2,
      description: 'Coordinates project teams, milestones and showcases.',
      candidates: [
        { id: 6, name: 'Fatuma Ally', year: 'Year 2', manifesto: 'Match members to projects based on interests and available time.' },
        { id: 7, name: 'Elias Mwansa', year: 'Year 3', manifesto: 'Clear milestones, fewer abandoned projects.' },
      ],
    },
  ],
  myCandidateApplication: { positionId: 2, status: 'approved', submitted: '2026-11-08', votes: 42 },
}

export const demoAdminStats = {
  totalMembers: 128,
  activeToday: 34,
  pendingApprovals: 3,
  upcomingEvents: 2,
  newsletterSubscribers: 96,
  unreadMessages: 4,
}

export const demoPayments = [
  { id: 1, member: 'Amina Juma', amount: 20000, date: '2026-02-12', method: 'Mobile money', period: 'Feb 2026 – Dec 2026', recordedBy: 'Daniel Mushi' },
  { id: 2, member: 'Joseph Mtei', amount: 20000, date: '2026-02-10', method: 'Bank transfer', period: 'Feb 2026 – Dec 2026', recordedBy: 'Daniel Mushi' },
  { id: 3, member: 'Halima Nyoni', amount: 20000, date: '2026-02-08', method: 'Mobile money', period: 'Feb 2026 – Dec 2026', recordedBy: 'Daniel Mushi' },
  { id: 4, member: 'Grace Emmanuel', amount: 20000, date: '2026-01-30', method: 'Cash', period: 'Feb 2026 – Dec 2026', recordedBy: 'Daniel Mushi' },
  { id: 5, member: 'Elias Mwansa', amount: 20000, date: '2025-11-04', method: 'Mobile money', period: 'Nov 2025 – Nov 2026', recordedBy: 'Daniel Mushi' },
]

export const demoFinancial = {
  period: { id: 4, name: 'Q4 2026', start: '2026-10-01', end: '2026-12-31', status: 'open', description: 'October–December 2026 operating period' },
  revenue: 420000,
  expenses: 186500,
  categories: [
    { id: 1, name: 'Membership payments', type: 'revenue', active: true, builtin: true },
    { id: 2, name: 'Sponsorship', type: 'revenue', active: true, builtin: false },
    { id: 3, name: 'Event costs', type: 'expense', active: true, builtin: false },
    { id: 4, name: 'Equipment', type: 'expense', active: true, builtin: false },
    { id: 5, name: 'Printing', type: 'expense', active: false, builtin: false },
  ],
  transactions: [
    { id: 1, date: '2026-11-12', description: 'Membership payments — November', category: 'Membership payments', type: 'revenue', amount: 120000, recordedBy: 'Daniel Mushi' },
    { id: 2, date: '2026-11-08', description: 'Workshop materials', category: 'Event costs', type: 'expense', amount: 45500, recordedBy: 'Daniel Mushi' },
    { id: 3, date: '2026-10-30', description: 'Club banner printing', category: 'Printing', type: 'expense', amount: 32000, recordedBy: 'Daniel Mushi' },
    { id: 4, date: '2026-10-21', description: 'Partner sponsorship instalment', category: 'Sponsorship', type: 'revenue', amount: 300000, recordedBy: 'Daniel Mushi' },
    { id: 5, date: '2026-10-14', description: 'USB drives for bootcamp', category: 'Equipment', type: 'expense', amount: 109000, recordedBy: 'Daniel Mushi' },
  ],
  reports: [
    { period: 'Q3 2026', revenue: 380000, expenses: 240000, net: 140000, status: 'closed' },
    { period: 'Q2 2026', revenue: 290000, expenses: 310000, net: -20000, status: 'closed' },
    { period: 'Q1 2026', revenue: 410000, expenses: 198000, net: 212000, status: 'closed' },
  ],
}

export const demoRsvps = [
  { id: 1, name: 'Amina Juma', email: 'amina.juma@student.kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-18', status: 'approved', checkedIn: true, type: 'Student' },
  { id: 2, name: 'Neema Mwakyusa', email: 'neema.m@student.kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-20', status: 'pending', checkedIn: false, type: 'Student' },
  { id: 3, name: 'Baraka Kimaro', email: 'baraka.k@student.kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-21', status: 'pending', checkedIn: false, type: 'Student' },
  { id: 4, name: 'Dr. Sarah Mwangi', email: 's.mwangi@kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-15', status: 'approved', checkedIn: false, type: 'Staff' },
  { id: 5, name: 'Fatuma Ally', email: 'fatuma.a@student.kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-22', status: 'rejected', checkedIn: false, type: 'Student' },
  { id: 6, name: 'Joseph Mtei', email: 'joseph.m@student.kiut.ac.tz', event: 'AI Bootcamp', submitted: '2026-03-19', status: 'approved', checkedIn: true, type: 'Student' },
]

export const demoNewsletter = [
  { id: 1, email: 'amina.juma@student.kiut.ac.tz', subscribed: '2026-02-04', active: true },
  { id: 2, email: 'joseph.m@student.kiut.ac.tz', subscribed: '2026-02-06', active: true },
  { id: 3, email: 'halima.n@student.kiut.ac.tz', subscribed: '2026-02-11', active: true },
  { id: 4, email: 'grace.e@student.kiut.ac.tz', subscribed: '2026-03-02', active: true },
  { id: 5, email: 'baraka.k@student.kiut.ac.tz', subscribed: '2026-03-19', active: false },
  { id: 6, email: 'fatuma.a@student.kiut.ac.tz', subscribed: '2026-04-01', active: true },
]

export const demoMessages = [
  { id: 1, subject: 'Week 06 session update', audience: 'All members', recipients: 128, sent: '2026-11-15T16:10:00', status: 'Sent', channel: 'Email + SMS' },
  { id: 2, subject: 'Membership renewal reminder', audience: 'Expired members', recipients: 14, sent: '2026-11-10T09:00:00', status: 'Sent', channel: 'Email' },
  { id: 3, subject: 'AI Bootcamp follow-up', audience: 'Event attendees', recipients: 86, sent: '2026-04-02T11:30:00', status: 'Sent', channel: 'Email' },
]

export const demoTechnologies = [
  { id: 1, name: 'React', category: 'web', active: true, description: 'Component-based UI library for web applications.' },
  { id: 2, name: 'Node.js', category: 'web', active: true, description: 'JavaScript runtime for server-side applications.' },
  { id: 3, name: 'React Native', category: 'mobile', active: true, description: 'Cross-platform mobile applications in JavaScript.' },
  { id: 4, name: 'Flutter', category: 'mobile', active: true, description: 'Cross-platform mobile UI toolkit.' },
  { id: 5, name: 'Python', category: 'ai', active: true, description: 'General-purpose language for data and AI work.' },
  { id: 6, name: 'TensorFlow', category: 'ai', active: true, description: 'Machine learning framework.' },
  { id: 7, name: 'Docker', category: 'other', active: true, description: 'Container platform for reproducible environments.' },
  { id: 8, name: 'Kubernetes', category: 'other', active: false, description: 'Container orchestration.' },
  { id: 9, name: 'PostgreSQL', category: 'data', active: true, description: 'Relational database.' },
  { id: 10, name: 'Arduino', category: 'iot', active: true, description: 'Microcontroller platform for physical computing.' },
]

export const demoAdminTrophies = [
  { id: 1, name: 'First Commit', description: 'First approved project contribution.', points: 50, active: true, awarded: 42 },
  { id: 2, name: 'Warmup Regular', description: 'Complete five warmup quizzes in a semester.', points: 100, active: true, awarded: 28 },
  { id: 3, name: 'Podium Finish', description: 'Place in the top three of a weekly competition.', points: 150, active: true, awarded: 11 },
  { id: 4, name: 'Community Builder', description: 'Mentor a new member through their first project.', points: 200, active: true, awarded: 6 },
  { id: 5, name: 'Semester Champion', description: 'Highest total points in a semester.', points: 300, active: false, awarded: 0 },
]

export const demoGalleryItems = [
  { id: 1, title: 'AI Bootcamp — opening session', type: 'Image', category: 'Workshops', uploaded: '2026-03-30', status: 'Published' },
  { id: 2, title: 'AI Bootcamp — group work', type: 'Image', category: 'Workshops', uploaded: '2026-03-30', status: 'Published' },
  { id: 3, title: 'Weekly challenge briefing', type: 'Image', category: 'Competitions', uploaded: '2026-03-14', status: 'Published' },
  { id: 4, title: 'Project showcase', type: 'Video', category: 'Projects', uploaded: '2026-02-20', status: 'Draft' },
]

export const demoAdminBlogs = [
  { id: 1, title: 'How to Build and Run Your First Single-Page Website in 2025', category: 'Tutorial', author: 'admin@digitalclub.kiut.ac.tz', status: 'Published', views: 985, date: '2025-12-04' },
  { id: 2, title: '100 Ready-to-Use Research Project Titles for IT & CS Students (2025–2026)', category: 'General', author: 'admin@digitalclub.kiut.ac.tz', status: 'Published', views: 1259, date: '2025-12-04' },
  { id: 3, title: 'Python in 2025: From Zero to "Hello World" in Under 5 Minutes', category: 'Tutorial', author: 'admin@digitalclub.kiut.ac.tz', status: 'Published', views: 0, date: '2025-12-04' },
  { id: 4, title: 'How to Start Coding in C++ in 2025', category: 'Tutorial', author: 'admin@digitalclub.kiut.ac.tz', status: 'Published', views: 0, date: '2025-12-04' },
  { id: 5, title: '10 Insanely Creative Tech Tricks You\'ll Wish You Knew Years Ago', category: 'Tech', author: 'admin@digitalclub.kiut.ac.tz', status: 'Published', views: 0, date: '2025-12-04' },
  { id: 6, title: 'What we learned running our first hackathon', category: 'General', author: 'Daniel Mushi', status: 'Draft', views: 0, date: '—' },
]

export const demoAdminNews = [
  { id: 1, title: 'Digital Club Hackathon 2025 Registration Open!', category: 'Hackathon', status: 'Archived', date: '2025-01-01', author: 'admin@digitalclub.kiut.ac.tz' },
  { id: 2, title: 'Semester opening notice', category: 'General', status: 'Draft', date: '—', author: 'Daniel Mushi' },
]

export const demoAdminEvents = [
  { id: 7, title: 'AI Bootcamp', date: '2026-03-30T09:00:00', location: 'Computer Lab 1', category: 'Workshop', audience: 'Public event', rsvps: 6, capacity: 200, status: 'Past' },
  { id: 21, title: 'React Fundamentals — Week 06', date: '2026-11-25T16:00:00', location: 'Computer Lab 2', category: 'Workshop', audience: 'Members', rsvps: 48, capacity: 60, status: 'Upcoming' },
  { id: 22, title: 'Monthly Build briefing', date: '2026-12-05T10:00:00', location: 'KIUT Tech Lab', category: 'Hackathon', audience: 'Members', rsvps: 26, capacity: 80, status: 'Upcoming' },
]

export const demoAdminNewsletters = demoNewsletter

export const demoSettings = {
  registrationApprovalMode: 'manual',
  membershipFee: 20000,
  membershipPeriod: '12 months',
  clubEmail: 'digitalclub@kiut.ac.tz',
  clubPhone: '+255 716 153 399',
  newsletterEnabled: true,
  smsEnabled: true,
  aiQuizProvider: 'Configured on server',
}

export const demoQuizAnalytics = {
  totalQuizzes: 3,
  published: 2,
  attempts: 111,
  averageScore: 71,
  byField: [
    { field: 'Web Development', attempts: 48, average: 74 },
    { field: 'Programming', attempts: 63, average: 68 },
  ],
  recent: [
    { title: 'Python Basics Warmup', member: 'Fatuma Ally', score: 92, submitted: '2026-11-16' },
    { title: 'React Fundamentals Warmup', member: 'Amina Juma', score: 88, submitted: '2026-11-15' },
    { title: 'React Fundamentals Warmup', member: 'Baraka Kimaro', score: 75, submitted: '2026-11-14' },
  ],
}

export const demoAdminElections = [
  { id: 1, title: 'KIUT Digital Club Leadership Election 2026/27', term: '2026/27', status: 'voting', candidates: 7, applications: '2026-11-02 – 2026-11-14', voting: '2026-11-18 – 2026-11-24' },
  { id: 2, title: 'Club Constitution Referendum 2026', term: '2026', status: 'finalized', candidates: 0, applications: '—', voting: '2026-10-05 – 2026-10-09' },
]

export const demoPositions = [
  { id: 1, title: 'Chairman', subtitle: 'Overall leadership', seats: 1, active: true, order: 1 },
  { id: 2, title: 'Vice Chairman', subtitle: 'Deputises the chairperson', seats: 1, active: true, order: 2 },
  { id: 3, title: 'General Secretary', subtitle: 'Records and communication', seats: 1, active: true, order: 3 },
  { id: 4, title: 'Project Manager', subtitle: 'Project delivery', seats: 2, active: true, order: 4 },
  { id: 5, title: 'Technical Lead', subtitle: 'Technical training', seats: 3, active: true, order: 5 },
]

export const demoAdminUsers = demoUsers

export const demoAdminMembers = demoUsers.filter((user) => user.role !== 'admin')

export const demoMemberIds = demoUsers
  .filter((user) => user.memberId)
  .map((user) => ({ id: user.id, name: user.name, memberId: user.memberId, course: user.course, year: user.year, status: user.status, issued: '2025-10-12', active: user.active }))

export const demoCompetitionSubmissions = [
  { id: 1, member: 'Joseph Mtei', type: 'GitHub repository', submitted: '2026-11-21T14:20:00', status: 'reviewed', score: 94.5, rank: 1 },
  { id: 2, member: 'Amina Juma', type: 'GitHub repository', submitted: '2026-11-21T15:40:00', status: 'reviewed', score: 91, rank: 2 },
  { id: 3, member: 'Halima Nyoni', type: 'GitHub repository', submitted: '2026-11-22T09:05:00', status: 'reviewed', score: 88.5, rank: 3 },
  { id: 4, member: 'Grace Emmanuel', type: 'GitHub repository', submitted: '2026-11-22T12:10:00', status: 'submitted', score: 0, rank: null },
]

export const demoEnrollments = [
  { id: 1, member: 'Joseph Mtei', team: 'Byte Builders', enrolled: '2026-11-16', status: 'enrolled' },
  { id: 2, member: 'Amina Juma', team: 'Byte Builders', enrolled: '2026-11-16', status: 'enrolled' },
  { id: 3, member: 'Halima Nyoni', team: 'Null Pointers', enrolled: '2026-11-17', status: 'enrolled' },
  { id: 4, member: 'Elias Mwansa', team: 'Runtime Terrors', enrolled: '2026-11-15', status: 'disqualified' },
]

export const demoAdminJudges = [
  { id: 1, name: 'Daniel Mushi', role: 'Chair of judges', active: true },
  { id: 2, name: 'Samuel Mwita', role: 'Judge', active: true },
  { id: 3, name: 'Rehema Salum', role: 'Judge', active: false },
]

export const demoSponsors = [
  { id: 1, name: 'KIUT', website: 'https://kiut.ac.tz', description: 'University support and academic integration', active: true },
  { id: 2, name: 'TechStart Tanzania', website: '', description: 'Internship opportunities and mentorship', active: true },
]

export const demoAuditLog = [
  { id: 1, actor: 'Daniel Mushi', action: 'Published competition', target: 'Weekly Challenge 06 — Array & String Patterns', date: '2026-11-22T09:12:00' },
  { id: 2, actor: 'Daniel Mushi', action: 'Approved RSVP', target: 'Amina Juma — AI Bootcamp', date: '2026-11-21T17:40:00' },
  { id: 3, actor: 'Samuel Mwita', action: 'Submitted session report', target: 'State and events', date: '2026-11-24T18:05:00' },
  { id: 4, actor: 'Daniel Mushi', action: 'Recorded payment', target: 'Amina Juma — TZS 20,000', date: '2026-11-20T11:02:00' },
]

export const demoAdminProfile = {
  name: 'Daniel Mushi',
  email: 'admin@digitalclub.kiut.ac.tz',
  role: 'Admin',
  since: '2024-01-15',
  lastLogin: '2026-11-18T08:44:00',
  phone: '+255 716 153 399',
}
