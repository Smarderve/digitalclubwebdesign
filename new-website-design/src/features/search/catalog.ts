import {
  Activity,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Code2,
  FolderGit2,
  House,
  KeyRound,
  LockKeyhole,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCircle,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  demoCompetitions,
  demoMemberEvents,
  demoMemberProjects,
  demoQuizzes,
  demoSessions,
  demoTeams,
  demoTrophies,
} from '../../data/demo'
import type { NavSection } from '../../components/app/AppShell'
import { THEMES as THEME_OPTIONS } from '../settings/preferences'

export type SearchGroup = 'Pages' | 'Members' | 'Activities' | 'Learning' | 'Settings'

export type DestinationResult = {
  id: string
  kind: 'page' | 'setting' | 'content'
  group: SearchGroup
  label: string
  description?: string
  to: string
  keywords: string
  icon: LucideIcon
  featured?: boolean
}

const MEMBER_PAGES: DestinationResult[] = [
  {
    id: 'page-home',
    kind: 'page',
    group: 'Pages',
    label: 'Home',
    description: 'Your dashboard, points and what is next.',
    to: '/member',
    keywords: 'home dashboard overview start welcome',
    icon: House,
    featured: true,
  },
  {
    id: 'page-learning',
    kind: 'page',
    group: 'Pages',
    label: 'Learning Hub',
    to: '/member/learning',
    keywords: 'learning hub warmups sessions study quizzes timetable',
    icon: BookOpenCheck,
    featured: true,
  },
  {
    id: 'page-warmups',
    kind: 'page',
    group: 'Learning',
    label: 'Warmups',
    description: 'Short quizzes that open each teaching week.',
    to: '/member/learning?tab=warmups',
    keywords: 'warmups warm up quiz quizzes practice exercises',
    icon: Code2,
  },
  {
    id: 'page-sessions',
    kind: 'page',
    group: 'Learning',
    label: 'Sessions',
    description: 'The teaching-week timetable and session reports.',
    to: '/member/learning?tab=sessions',
    keywords: 'sessions timetable schedule classes instructors attendance',
    icon: CalendarDays,
  },
  {
    id: 'page-activities',
    kind: 'page',
    group: 'Pages',
    label: 'Activities',
    to: '/member/activities',
    keywords: 'activities events projects',
    icon: Activity,
    featured: true,
  },
  {
    id: 'page-events',
    kind: 'page',
    group: 'Activities',
    label: 'Events',
    to: '/member/activities?tab=events',
    keywords: 'events meetups workshops rsvp calendar',
    icon: CalendarDays,
  },
  {
    id: 'page-projects',
    kind: 'page',
    group: 'Activities',
    label: 'Projects',
    description: 'Projects attached to your member profile.',
    to: '/member/activities?tab=projects',
    keywords: 'projects portfolio repository work showcase',
    icon: FolderGit2,
  },
  {
    id: 'page-competitions',
    kind: 'page',
    group: 'Pages',
    label: 'Competitions',
    to: '/member/competitions',
    keywords: 'competitions compete challenges contest hackathons weekly monthly',
    icon: Trophy,
    featured: true,
  },
  {
    id: 'page-weekly',
    kind: 'page',
    group: 'Activities',
    label: 'Weekly Challenges',
    to: '/member/competitions?tab=weekly',
    keywords: 'weekly challenges competitions short contests',
    icon: Trophy,
  },
  {
    id: 'page-monthly',
    kind: 'page',
    group: 'Activities',
    label: 'Monthly Challenges',
    to: '/member/competitions?tab=monthly',
    keywords: 'monthly challenges competitions builds contests',
    icon: Trophy,
  },
  {
    id: 'page-hackathons',
    kind: 'page',
    group: 'Activities',
    label: 'Hackathons',
    to: '/member/competitions?tab=hackathons',
    keywords: 'hackathons hackathon teams sprints events',
    icon: Sparkles,
  },
  {
    id: 'page-rankings',
    kind: 'page',
    group: 'Pages',
    label: 'Rankings',
    to: '/member/rankings',
    keywords: 'rankings leaderboard leaderboards points standings teams',
    icon: BarChart3,
    featured: true,
  },
  {
    id: 'page-leaderboards',
    kind: 'page',
    group: 'Pages',
    label: 'Leaderboards',
    to: '/member/rankings?tab=leaderboards',
    keywords: 'leaderboard leaderboards rankings points members table',
    icon: BarChart3,
  },
  {
    id: 'page-teams',
    kind: 'page',
    group: 'Activities',
    label: 'Teams',
    to: '/member/rankings?tab=teams',
    keywords: 'teams team hub join requests members',
    icon: Users,
  },
  {
    id: 'page-notifications',
    kind: 'page',
    group: 'Pages',
    label: 'Notifications',
    to: '/member/notifications',
    keywords: 'notifications alerts follow requests updates',
    icon: Sparkles,
  },
  {
    id: 'page-profile',
    kind: 'page',
    group: 'Pages',
    label: 'Profile',
    to: '/member/profile',
    keywords: 'profile account digital id membership rewards social privacy',
    icon: UserCircle,
  },
  {
    id: 'page-digital-id',
    kind: 'page',
    group: 'Pages',
    label: 'Digital ID',
    to: '/member/profile?tab=digital-id',
    keywords: 'digital id card qr identity',
    icon: BookOpen,
  },
  {
    id: 'page-membership',
    kind: 'page',
    group: 'Pages',
    label: 'Membership',
    to: '/member/profile?tab=membership',
    keywords: 'membership subscription payment status',
    icon: ShieldCheck,
  },
  {
    id: 'page-rewards',
    kind: 'page',
    group: 'Pages',
    label: 'Rewards and achievements',
    to: '/member/profile?tab=rewards',
    keywords: 'rewards achievements trophies points badge',
    icon: Trophy,
  },
  {
    id: 'page-elections',
    kind: 'page',
    group: 'Pages',
    label: 'Elections',
    to: '/member/elections',
    keywords: 'elections vote positions leadership',
    icon: ShieldCheck,
  },
]

function settingsPages(settingsTo: string): DestinationResult[] {
  const page = (id: string, label: string, description: string, keywords: string, icon: LucideIcon, section: string) => ({
    id: `setting-${id}`,
    kind: 'setting' as const,
    group: 'Settings' as const,
    label,
    description,
    to: `${settingsTo}?section=${section}`,
    keywords,
    icon,
  })

  const themes: DestinationResult[] = THEME_OPTIONS.map((theme) => ({
    id: `setting-theme-${theme.id}`,
    kind: 'setting',
    group: 'Settings',
    label: `Appearance · ${theme.label}`,
    to: `${settingsTo}?section=appearance&theme=${theme.id}`,
    keywords: `appearance theme colour color ${theme.id} ${theme.label} ${theme.dark ? 'dark theme' : 'light theme'}`,
    icon: Palette,
  }))

  return [
    page('general', 'Settings', 'General, appearance, account, privacy and more.', 'settings preferences options configure', Settings, 'general'),
    page('general-preferences', 'General settings', 'Language and regional preferences.', 'general language region timezone date time', Settings, 'general'),
    page('appearance', 'Appearance', 'Theme, text size and interface contrast.', 'appearance theme colour color display dark light glass yellow blue', Palette, 'appearance'),
    ...themes,
    page('account', 'Account settings', 'Your account details and profile links.', 'account profile display name username email', UserCircle, 'account'),
    page('privacy', 'Privacy settings', 'Profile visibility, discovery and section permissions.', 'privacy visibility private public discoverability followers blocked', LockKeyhole, 'privacy'),
    page('notifications', 'Notification settings', 'How the club reaches you.', 'notifications alerts email in-app follow competition learning event', Sparkles, 'notifications'),
    page('security', 'Security', 'Password and the current signed-in session.', 'security password sign in session login credentials', KeyRound, 'security'),
    page('accessibility', 'Accessibility', 'Motion, text size and contrast preferences.', 'accessibility reduced motion text size contrast keyboard readable', ShieldCheck, 'accessibility'),
  ]
}

/**
 * Destination search runs against the actual navigation and settings surfaces.
 * There is no server search endpoint in this prototype; these are the same
 * records the pages render.
 */
export function searchDestinations(
  query: string,
  nav: NavSection[],
  settingsTo: string,
  includeMemberSurfaces: boolean,
): DestinationResult[] {
  const settings = settingsPages(settingsTo)
  const fromNav: DestinationResult[] = nav.flatMap((section) =>
    section.items
      .filter((item) => !(settingsTo.startsWith('/member') && item.to === settingsTo))
      .map((item) => ({
        id: `nav-${item.to}`,
        kind: 'page' as const,
        group: 'Pages' as const,
        label: item.label,
        to: item.to,
        keywords: `${section.label} ${item.label}`,
        icon: item.icon,
      })),
  )

  const destinations = includeMemberSurfaces ? [...fromNav, ...MEMBER_PAGES, ...settings] : [...fromNav, ...settings]

  if (!query) {
    return destinations.filter((item) => item.featured || item.kind === 'setting' && item.id === 'setting-appearance')
  }

  return destinations
    .map((item) => ({ item, score: score(item.label, item.keywords, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .map((entry) => entry.item)
}

export function searchContent(query: string): DestinationResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: DestinationResult[] = []
  const terms = q.split(/\s+/).filter(Boolean)
  const matches = (...values: string[]) => {
    const tokens = values
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
    return terms.every((term) => tokens.some((token) => token.startsWith(term)))
  }

  for (const competition of demoCompetitions) {
    if (competition.status === 'draft') continue
    if (matches(competition.title, competition.category, competition.description)) {
      results.push({
        id: `competition-${competition.id}`,
        kind: 'content',
        group: 'Activities',
        label: competition.title,
        description: `${competition.frequency === 'weekly' ? 'Weekly' : 'Monthly'} challenge · ${competition.category}`,
        to: `/member/competitions/${competition.id}`,
        keywords: competition.category,
        icon: Trophy,
      })
    }
  }

  for (const event of demoMemberEvents) {
    if (matches(event.title, event.type, event.location)) {
      results.push({
        id: `event-${event.id}`,
        kind: 'content',
        group: 'Activities',
        label: event.title,
        description: `${event.type} · ${event.location}`,
        to: '/member/activities?tab=events',
        keywords: event.type,
        icon: CalendarDays,
      })
    }
  }

  for (const project of demoMemberProjects) {
    if (matches(project.title, project.technologies, project.description)) {
      results.push({
        id: `project-${project.id}`,
        kind: 'content',
        group: 'Activities',
        label: project.title,
        description: `Project · ${project.technologies}`,
        to: '/member/activities?tab=projects',
        keywords: project.technologies,
        icon: FolderGit2,
      })
    }
  }

  for (const quiz of demoQuizzes) {
    if (quiz.status === 'draft') continue
    if (matches(quiz.title, quiz.field, quiz.topic)) {
      results.push({
        id: `quiz-${quiz.id}`,
        kind: 'content',
        group: 'Learning',
        label: quiz.title,
        description: `Warmup · ${quiz.field}`,
        to: `/member/quizzes/${quiz.id}`,
        keywords: `${quiz.field} ${quiz.topic}`,
        icon: Code2,
      })
    }
  }

  for (const session of demoSessions.sessions) {
    if (matches(session.title, session.instructor, session.type)) {
      results.push({
        id: `session-${session.id}`,
        kind: 'content',
        group: 'Learning',
        label: session.title,
        description: `Session · ${session.instructor}`,
        to: '/member/learning?tab=sessions',
        keywords: session.type,
        icon: BookOpenCheck,
      })
    }
  }

  for (const team of demoTeams) {
    if (matches(team.name, team.leader)) {
      results.push({
        id: `team-${team.id}`,
        kind: 'content',
        group: 'Activities',
        label: team.name,
        description: `Team · ${team.leader}`,
        to: '/member/rankings?tab=teams',
        keywords: `team ${team.leader}`,
        icon: Users,
      })
    }
  }

  for (const trophy of demoTrophies) {
    if (trophy.earnedOn && matches(trophy.name, trophy.description)) {
      results.push({
        id: `trophy-${trophy.name}`,
        kind: 'content',
        group: 'Pages',
        label: trophy.name,
        description: 'Achievement',
        to: '/member/profile?tab=rewards',
        keywords: trophy.description,
        icon: Trophy,
      })
    }
  }

  return results.slice(0, 12)
}

export const GROUP_ORDER: SearchGroup[] = ['Pages', 'Members', 'Activities', 'Learning', 'Settings']

function score(label: string, keywords: string, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const name = label.toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  const nameWords = name.split(/[^a-z0-9]+/)
  const words = keywords.toLowerCase().split(/[^a-z0-9]+/)
  if (name.startsWith(q)) return 100
  if (nameWords.some((word) => word.startsWith(q))) return 80
  if (name.includes(q)) return 60
  if (terms.length > 1 && terms.every((term) => nameWords.some((word) => word.startsWith(term)))) return 58
  if (words.some((word) => word.startsWith(q))) return 45
  if (terms.every((term) => words.some((word) => word.startsWith(term)))) return 40
  return 0
}

export const SearchIcon = Search
