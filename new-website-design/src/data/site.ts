/**
 * Content taken from the current KIUT Digital Club website (public crawl +
 * the supplied content handoff, 18 November 2026). No club facts are invented.
 * Items marked `needsConfirmation` are published values that the club must
 * verify before production use; they are surfaced in docs/04-content-notes.md.
 */

export const SITE = {
  name: 'KIUT Digital Club',
  shortName: 'Digital Club',
  university: 'Kampala International University in Tanzania',
  tagline: 'Empowering students through technology and innovation at Kampala International University in Tanzania.',
  signature: 'Learn. Build. Share. Innovate.',
  email: 'digitalclub@kiut.ac.tz',
  phone: '+255 716 153 399',
  address: ['Kampala International University in Tanzania', 'Kampala Road No. 2, Off Nyerere Road', 'Gongo la Mboto, Dar es Salaam, Tanzania'],
  responseTime: 'We typically respond to emails within 24–48 hours during weekdays.',
  meetings: [
    { label: 'Weekly Tech Sessions', detail: 'Every Wednesday, 4:00 PM' },
    { label: 'Workshops', detail: 'Every Saturday, 10:00 AM' },
    { label: 'Location', detail: 'KIUT Tech Lab' },
  ],
  officeHours: [
    { label: 'Monday–Friday', detail: '9:00 AM – 5:00 PM' },
    { label: 'Saturday', detail: '10:00 AM – 2:00 PM' },
    { label: 'Sunday', detail: 'Closed' },
  ],
  social: [
    { label: 'Facebook', href: '#' },
    { label: 'X (Twitter)', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
}

export const HERO = {
  eyebrow: 'Student technology community · KIUT',
  headline: 'Build real skills with a community that ships.',
  description:
    'Empowering IT & CS students through hands-on projects, coding competitions, mentorship, and real-world tech experience. Build your future in technology with us.',
}

export const CLUB_FACTS = [
  { value: '200+', label: 'Members', needsConfirmation: true },
  { value: '50+', label: 'Projects', needsConfirmation: true },
  { value: '100+', label: 'Events', needsConfirmation: true },
]

export const BENEFITS = [
  {
    title: 'Hands-on coding',
    description:
      'Work on real projects, build your portfolio, and gain practical programming experience in multiple languages and frameworks.',
  },
  {
    title: 'Peer learning',
    description:
      'Collaborate with fellow IT and CS students, share knowledge, and learn from each other in a supportive environment.',
  },
  {
    title: 'Competitions',
    description:
      'Participate in hackathons, coding challenges, and tech competitions to test your skills and win prizes.',
  },
  {
    title: 'Mentorship',
    description:
      'Get guidance from experienced developers, alumni, and industry professionals to accelerate your career growth.',
  },
  {
    title: 'Career opportunities',
    description:
      'Access internships, job opportunities, and networking events with leading tech companies and startups.',
  },
  {
    title: 'Skill development',
    description:
      'Attend workshops on cutting-edge technologies, best practices, and industry trends to stay ahead.',
  },
]

export const TECHNOLOGIES = [
  'Python', 'JavaScript', 'Java', 'React', 'Node.js', 'Docker',
  'AWS', 'Git', 'Linux', 'Databases', 'HTML/CSS', 'Mobile Dev',
]

export const LEARNING_PATHS = [
  {
    slug: 'web-development',
    title: 'Web Development',
    description:
      'Master frontend and backend development. Build responsive websites and web applications using modern frameworks.',
    tags: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
  },
  {
    slug: 'mobile-development',
    title: 'Mobile Development',
    description:
      'Create native and cross-platform mobile applications for iOS and Android using industry-standard tools.',
    tags: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
  },
  {
    slug: 'ai-machine-learning',
    title: 'AI & Machine Learning',
    description:
      'Explore artificial intelligence, machine learning, and data science. Build intelligent systems and predictive models.',
    tags: ['Python', 'TensorFlow', 'PyTorch', 'Data Science'],
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity',
    description:
      'Learn ethical hacking, network security, and digital forensics. Protect systems and data from threats.',
    tags: ['Ethical Hacking', 'Network Security', 'Penetration Testing', 'Cryptography'],
  },
  {
    slug: 'cloud-computing',
    title: 'Cloud Computing',
    description:
      'Master cloud platforms and DevOps. Deploy scalable applications and manage infrastructure in the cloud.',
    tags: ['AWS', 'Azure', 'Docker', 'Kubernetes'],
  },
  {
    slug: 'game-development',
    title: 'Game Development',
    description:
      'Create engaging games using game engines and programming. Learn game design principles and mechanics.',
    tags: ['Unity', 'Unreal Engine', 'C#', 'Game Design'],
  },
]

export const TOPICS = [
  { name: 'Python Programming', description: 'Learn Python from basics to advanced concepts' },
  { name: 'Web Development', description: 'HTML, CSS, JavaScript, and modern frameworks' },
  { name: 'Mobile Development', description: 'Android and iOS app development' },
  { name: 'Data Science', description: 'Data analysis, machine learning, and AI' },
  { name: 'Cybersecurity', description: 'Ethical hacking and security practices' },
  { name: 'Cloud Computing', description: 'AWS, Azure, and cloud technologies' },
]

export const SKILL_CATEGORIES = [
  { title: 'Programming Languages', count: '12+ languages', description: 'Master Python, JavaScript, Java, C++, and other essential programming languages.' },
  { title: 'Databases & Storage', count: '8+ technologies', description: 'Learn SQL, NoSQL, data modeling, and database optimization techniques.' },
  { title: 'Networking & Infrastructure', count: '6+ areas', description: 'Understand networks, servers, cloud infrastructure, and system administration.' },
  { title: 'Development Tools', count: '15+ tools', description: 'Master Git, Docker, IDEs, debugging tools, and development workflows.' },
  { title: 'Design & UX', count: '7+ disciplines', description: 'Learn UI/UX design, prototyping, user research, and design systems.' },
  { title: 'Data Science', count: '10+ tools', description: 'Explore data analysis, visualization, statistics, and business intelligence.' },
]

export type Project = {
  slug: string
  title: string
  summary: string
  description: string
  technologies: string[]
  metrics?: { label: string; value: string }[]
  year: string
  status: 'Published record'
  note?: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'smart-campus-navigator',
    title: 'Smart Campus Navigator',
    summary:
      'A mobile application that helps students navigate KIUT campus, find available study spaces, discover campus events in real time, and connect with peers.',
    description:
      'A comprehensive mobile application that helps students navigate KIUT campus, find available study spaces, discover campus events in real-time, and connect with peers. Built with React Native and integrated with Google Maps API.',
    technologies: ['React Native', 'Node.js', 'MongoDB', 'Google Maps API', 'Firebase', 'TypeScript'],
    metrics: [
      { label: 'Downloads', value: '1.2k' },
      { label: 'Team members', value: '5' },
      { label: 'Completed', value: '2024' },
      { label: 'App rating', value: '4.8★' },
    ],
    year: '2024',
    status: 'Published record',
    note: 'Metrics are as published on the current projects page.',
  },
  {
    slug: 'nexus-kiut-study-hub',
    title: 'Nexus: KIUT Study Hub',
    summary:
      'A dedicated academic portal designed to provide centralised study resources for KIUT students.',
    description:
      'The Nexus KIUT Study Hub website is a dedicated academic portal designed to provide centralised study resources for KIUT students. The full published description was truncated in the content handoff.',
    technologies: [],
    year: 'Published on homepage',
    status: 'Published record',
    note: 'The published description is truncated; the full CMS copy is required before production.',
  },
]

export type EventItem = {
  slug: string
  id: number
  title: string
  description: string
  longDescription: string[]
  date: string
  time: string
  endDate?: string
  location: string
  category: 'Workshop' | 'Hackathon' | 'Tech talk' | 'Social event'
  audience: 'Public event' | 'Members' | 'Paid members'
  capacity: number
  registered: number
  status: 'past' | 'upcoming' | 'closed'
  tags: string[]
}

export const EVENTS: EventItem[] = [
  {
    slug: 'ai-bootcamp',
    id: 7,
    title: 'AI Bootcamp',
    description:
      'Are you ready to level up your skills this end-semester break? KIUT Digital Club invites you to an AI Bootcamp designed to equip you with practical, real-world AI skills that you can start using immediately!',
    longDescription: [
      'Are you ready to level up your skills this end-semester break? KIUT Digital Club invites you to an AI Bootcamp designed to equip you with practical, real-world AI skills that you can start using immediately!',
      'What you will learn:',
      '1. How to effectively use AI tools',
      '2. How to use AI in coding',
    ],
    date: '2026-03-30T09:00:00',
    time: '09:00',
    location: 'Computer Lab 1',
    category: 'Workshop',
    audience: 'Public event',
    capacity: 200,
    registered: 0,
    status: 'past',
    tags: ['Workshop', 'Public event'],
  },
]

export const COMPETITION_ARCHIVE = [
  {
    title: 'KIUT Code Challenge 2024',
    timing: 'March 15–17, 2024',
    status: 'Past event',
    description:
      '48-hour coding competition open to all IT and CS students. Build innovative solutions and compete for cash prizes and tech gadgets.',
  },
  {
    title: 'Weekly Coding Challenges',
    timing: 'Every Friday',
    status: 'As published',
    description:
      'Weekly programming challenges covering algorithms, data structures, and problem-solving. Improve your coding skills and climb the leaderboard.',
  },
  {
    title: 'National Tech Competition',
    timing: 'May 2024',
    status: 'Past event',
    description:
      'Represent KIUT in the national inter-university tech competition. Showcase your skills and network with students from across Tanzania.',
  },
]

export const NEWS = [
  {
    id: 1,
    slug: 'digital-club-hackathon-2025-registration-open',
    title: 'Digital Club Hackathon 2025 Registration Open!',
    category: 'Hackathon',
    date: '2025-01-01T00:00:00',
    archived: true,
    excerpt:
      'Join us for the biggest hackathon of the year! Build innovative solutions and compete for amazing prizes.',
    body: [
      'Join us for the biggest hackathon of the year! Build innovative solutions and compete for amazing prizes.',
      'This notice was published for the 2025 hackathon. The current status of registration is not confirmed in the content handoff, so it is shown as an archived update rather than an open call.',
    ],
  },
]

export type Article = {
  slug: string
  title: string
  category: string
  date: string
  views?: number
  excerpt: string
  tags: string[]
  readingTime?: string
  body: { type: 'p' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'code'; text?: string; items?: string[] }[] | null
  bodyNote?: string
}

export const ARTICLES: Article[] = [
  {
    slug: '100-ready-to-use-research-project-titles-for-it-and-cs-students-20252026',
    title: '100 Ready-to-Use Research Project Titles for IT & CS Students (2025–2026)',
    category: 'General',
    date: '2025-12-04T00:00:00',
    views: 1259,
    excerpt:
      '100 fresh, ready-to-use B.Tech/M.Tech research project titles for IT & CS students (2025–2026) covering AI/ML, Cybersecurity, Blockchain, IoT, Web/Mobile, Data Science, Quantum, Me...',
    tags: ['Research', 'Project ideas'],
    body: null,
    bodyNote: 'Only the published excerpt was available in the content handoff. The full article remains in the club CMS.',
  },
  {
    slug: 'python-in-2025-from-zero-to-hello-world-in-under-5-minutes',
    title: 'Python in 2025: From Zero to "Hello World" in Under 5 Minutes — Beginner-Friendly',
    category: 'Tutorial',
    date: '2025-12-04T00:00:00',
    excerpt:
      'Zero-install option → Replit or python.org/shell. Install locally → 2-click installer on Windows/Mac/Linux. One-line code: print("Hello World! I am coding in 2025!")',
    tags: ['Python', 'Beginners'],
    body: null,
    bodyNote: 'Only the published excerpt was available in the content handoff. The full article remains in the club CMS.',
  },
  {
    slug: 'how-to-build-and-run-your-first-single-page-website-in-2025--zero-to-live-in-under-10-minutes',
    title: 'How to Build and Run Your First Single-Page Website in 2025 — Zero to Live in Under 10 Minutes',
    category: 'Tutorial',
    date: '2025-12-04T00:00:00',
    views: 985,
    excerpt:
      '100% beginner guide using only HTML, CSS & JavaScript: zero installations → use CodePen instantly, or save one index.html file and double-click. Includes a ready-to-use example.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
    readingTime: '8–10 min read',
    bodyNote: 'This is an abridged rendering of the published article, based on the structure recorded in the content handoff.',
    body: [
      { type: 'p', text: 'A beginner guide to building a working single-page website with HTML, CSS and JavaScript.' },
      { type: 'h2', text: "What you'll need" },
      {
        type: 'p',
        text: 'A computer, a browser and a text editor such as VS Code. No framework, database or complex installation is required.',
      },
      { type: 'h2', text: '01 Understand the three building blocks' },
      { type: 'p', text: 'HTML — the foundation. It defines content such as headings, paragraphs, images, links, buttons and sections.' },
      { type: 'p', text: 'CSS — the appearance. It controls colours, spacing, typography, layouts, responsiveness and visual identity.' },
      { type: 'p', text: 'JavaScript — the behaviour. It responds to user actions, updates content, validates forms and adds interaction.' },
      { type: 'h2', text: '02 Create your project' },
      { type: 'p', text: 'Create a folder named my-first-website and three files inside it:' },
      { type: 'code', text: 'my-first-website/\n  index.html\n  style.css\n  script.js' },
      { type: 'h2', text: '03 Build the page with HTML' },
      {
        type: 'p',
        text: 'Start with the document structure, then add a heading, a short introduction and a button. The published article includes a complete landing-page example you can copy into index.html.',
      },
      { type: 'h2', text: '08 What should you learn next?' },
      {
        type: 'ul',
        items: [
          'Build navigation',
          'Add images',
          'Create a contact form',
          'Learn responsive design and accessibility',
          'Learn Git and GitHub',
          'Explore React when you are ready',
        ],
      },
      { type: 'h2', text: 'Useful resources' },
      {
        type: 'ul',
        items: ['MDN Web Docs', 'W3Schools', 'VS Code Docs', 'GitHub Pages'],
      },
      { type: 'h2', text: 'Your challenge' },
      {
        type: 'p',
        text: 'Change the colours, replace the text, add a section and publish your first page.',
      },
      { type: 'p', text: 'Tags: #WebDevelopment #HTML #CSS #JavaScript #KIUTDigitalClub' },
    ],
  },
  {
    slug: 'how-to-start-coding-in-c-in-2025-from-zero-to-hello-world-and-beyond',
    title: 'How to Start Coding in C++ in 2025 — From Zero to "Hello World" and Beyond (Step-by-Step)',
    category: 'Tutorial',
    date: '2025-12-04T00:00:00',
    excerpt:
      'The fastest modern way to run C++ in 2025: Windows → VS Code + MSYS2 (5 min)...',
    tags: ['C++', 'Beginners'],
    body: null,
    bodyNote: 'Only the published excerpt was available in the content handoff. The full article remains in the club CMS.',
  },
  {
    slug: '10-insanely-creative-tech-tricks-youll-wish-you-knew-years-ago',
    title: "10 Insanely Creative Tech Tricks You'll Wish You Knew Years Ago",
    category: 'Tech',
    date: '2025-12-04T00:00:00',
    excerpt:
      'A 2025 collection of clever, lesser-known tips: turn YouTube into a floating player, use your browser as a teleprompter, generate perfect AI art prompts, make your computer read in...',
    tags: ['Tech tips'],
    body: null,
    bodyNote: 'Only the published excerpt was available in the content handoff. The full article remains in the club CMS.',
  },
]

export const ARTICLE_CATEGORIES = ['Tutorial', 'Tech', 'General']
export const POPULAR_TOPICS = [
  'Programming', 'Web Development', 'AI & Machine Learning', 'Cybersecurity',
  'Mobile Development', 'Career Tips', 'Tutorials', 'Tech News',
]

export type Leader = {
  name: string
  position: string
  programme: string
  year?: string
  bio?: string
}

export const LEADERS: Leader[] = [
  {
    name: 'Yunus Siraju',
    position: 'Chairman',
    programme: 'Bachelor of Computer Science',
    year: 'Year 3',
    bio: 'I build efficient solutions, crack complex challenges, and write code that behaves... most of the time.',
  },
  { name: 'Isaya Benson', position: 'Vice Chairman', programme: 'Bachelor of Computer Science', year: 'Year 2' },
  { name: 'TECLA OCTAVIAN ALOYCE', position: 'General Secretary', programme: 'Computer Science', year: 'Year 3' },
  {
    name: 'Latifa Ibrahimu Mnasi',
    position: 'Assistance General Secretary',
    programme: 'Bachelor of Information Technology',
    year: 'Year 2',
  },
  {
    name: 'Jozbert James Bhoyi',
    position: 'Project Manager',
    programme: 'Bachelor of Computer Science',
    year: 'Year 3',
    bio: 'A passionate software developer and cybersecurity enthusiast focused on building intelligent automation systems and modern SaaS solutions.',
  },
  {
    name: 'Nelson Chiduo',
    position: 'Project Manager',
    programme: 'Bachelor of Computer Science',
    year: 'Year 3',
    bio: 'Specializing in fast, modern, and scalable full-stack and AI-powered systems.',
  },
  {
    name: 'Aisha Athumani Hiza',
    position: 'Coordination Officer',
    programme: 'Bachelor of Computer Science',
    year: 'Year 3',
  },
  { name: 'Perfect Sebastian', position: 'Project Manager', programme: 'Bachelor of Computer Science', year: 'Year 1' },
  {
    name: 'DONATUS IHARE DAVIDO',
    position: 'Project Manager',
    programme: 'Computer Science',
    year: 'Year 3',
  },
  {
    name: 'Aswile Kisaka',
    position: 'Mentorship And Training',
    programme: 'Bachelor of Computer Science',
  },
  { name: 'Aziz Ali', position: 'Communication and Branding', programme: 'Computer Science' },
  {
    name: 'Sylvester Kayembes Shagama',
    position: 'Communication and Branding',
    programme: 'Bachelor of Computer Science',
    bio: 'graphic designing',
  },
]

export const LEADERSHIP_STRUCTURE = [
  {
    title: 'Executive Board',
    description:
      'Overall leadership and strategic direction of the club, responsible for major decisions and external relations.',
  },
  {
    title: 'Technical Leads',
    description:
      'Subject matter experts who lead workshops, mentor members, and oversee technical projects and competitions.',
  },
  {
    title: 'Department Heads',
    description:
      'Manage specific departments like events, marketing, partnerships, and community outreach.',
  },
]

export const ABOUT = {
  title: 'About Digital Club',
  description:
    "Empowering IT & CS students through hands-on projects, coding competitions, mentorship, and real-world tech experience. Building Tanzania's next generation of tech leaders.",
  mission:
    'To equip KIUT students with practical digital skills, foster a collaborative learning environment, and provide opportunities for real-world application of technology to address societal challenges.',
  vision:
    'To be a leading hub for digital innovation, knowledge sharing, and skill development within KIUT and the broader community, fostering a generation of digitally empowered leaders.',
  whatWeDo: [
    {
      title: 'Practical Skills Development',
      description:
        'Regular workshops on coding, networking, cybersecurity, web development, data analysis, and AI. Project-based learning and online courses to build strong foundations.',
    },
    {
      title: 'Innovation & Collaboration',
      description:
        'Hackathons, coding competitions, and specialized thematic groups for collaborative projects. Platform for pitching innovative ideas and receiving expert feedback.',
    },
    {
      title: 'Community & Mentorship',
      description:
        'Supportive community with mentorship programs from industry professionals. Community outreach initiatives using digital skills for social impact.',
    },
    {
      title: 'Partnerships & Opportunities',
      description:
        'Strategic partnerships with organizations like UNDP and tech companies providing internships, exchange programs, and professional networking.',
    },
  ],
  values: [
    { title: 'Collaboration', description: 'Working together to achieve more than we could individually.' },
    { title: 'Continuous learning', description: 'Embracing new technologies and constantly improving our skills.' },
    { title: 'Innovation', description: 'Pushing boundaries and creating solutions for real-world problems.' },
    { title: 'Community', description: "Supporting each other's growth and success in the tech industry." },
  ],
  faqs: [
    {
      question: 'How do I join Digital Club?',
      answer:
        'Simply register on our website using your KIUT student email. After registration, attend one of our orientation sessions to get started with club activities.',
    },
    {
      question: 'Do I need programming experience to join?',
      answer:
        'No prior experience is required! We welcome students at all skill levels. We offer beginner-friendly workshops and have experienced members who can mentor newcomers.',
    },
    {
      question: 'What activities does the club organize?',
      answer:
        'We organize coding workshops, hackathons, tech talks, project showcases, networking events, and collaborative coding sessions. We also participate in national competitions.',
    },
    {
      question: 'Are there any membership fees?',
      answer:
        "Digital Club membership is completely free for all KIUT students. We're funded through university support and partnerships with tech companies.",
    },
    {
      question: 'How can I get involved in projects?',
      answer:
        'We regularly announce new projects through our newsletter and social media. You can also propose your own project ideas. We encourage collaboration and will help match you with team members.',
    },
  ],
}

export const TESTIMONIALS = [
  {
    quote:
      'As a CS student, Digital Club gave me the practical experience I needed. The React workshop helped me build my first full-stack application, which landed me an internship at a leading tech company in Dar es Salaam.',
    name: 'Ramadhan Chota',
    role: 'CS Student | Cyber Security Intern',
  },
  {
    quote:
      'The weekly coding challenges improved my problem-solving skills significantly. I went from struggling with basic algorithms to solving complex data structure problems. The peer learning environment is amazing!',
    name: 'Ahmed Hassan',
    role: 'IT Student | Competitive Programmer',
  },
  {
    quote:
      "Through Digital Club's mentorship program, I got guidance on my machine learning project. My mentor helped me understand neural networks better, and now I'm working on an AI startup. The support here is incredible!",
    name: 'Yunus Siraju',
    role: 'CS Student | AI Enthusiast',
  },
]

export const PARTNERS = [
  { name: 'Microsoft', description: 'Cloud computing workshops and Azure credits' },
  { name: 'Google', description: 'Developer tools and Android development training' },
  { name: 'GitHub', description: 'Student developer pack and repository hosting' },
  { name: 'TechStart Tanzania', description: 'Internship opportunities and mentorship' },
  { name: 'Digital Innovation Hub', description: 'Co-working space and networking events' },
  { name: 'KIUT', description: 'University support and academic integration' },
]

export const ACHIEVEMENTS = [
  { title: '1st Place — Tanzania Hackathon 2024', description: 'Our team won the national hackathon with an innovative mobile health solution', date: 'March 2024' },
  { title: 'Best Student Organization Award', description: 'Recognized by KIUT for outstanding contribution to student development', date: 'February 2024' },
  { title: 'Startup Incubation Program', description: 'Three club members launched successful tech startups', date: 'January 2024' },
]

export const MEMBERSHIP_BENEFITS = [
  'Workshops and weekly tech sessions',
  'Competitions and warmup challenges',
  'Mentorship and code reviews',
  'Digital member ID and club profile',
  'Eligibility for paid-member events',
]

export const COURSES = [
  'Bachelor of Computer Science',
  'Bachelor of Information Technology',
  'Bachelor of Software Engineering',
  'Bachelor of Data Science',
  'Bachelor of Cybersecurity',
  'Diploma in Computer Science',
  'Diploma in Information Technology',
  'Diploma in Software Engineering',
  'Diploma in Cybersecurity',
  'Certificate of Information Technology',
  'Non-Computing Program',
]

export const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Graduate', 'Alumni']

export const RSVP_REQUIREMENTS = {
  attendeeTypes: ['Student', 'Non-student'],
  nonStudentRoles: ['Staff', 'Guest'],
  studyFields: COURSES,
  studyYears: YEARS,
}

export const SESSION_INFO = {
  title: 'Weekly sessions',
  description:
    'Published session weeks from the club timetable, including schedules, instructors and attendance reporting.',
}
