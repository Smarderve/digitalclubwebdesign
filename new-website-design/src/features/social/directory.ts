import {
  demoCompetitionSubmissions,
  demoEnrollments,
  demoMember,
  demoMemberProjects,
  demoPayments,
  demoRankings,
  demoRewardHistory,
  demoRsvps,
  demoSessionsReports,
  demoTrophies,
  demoUsers,
} from '../../data/demo'
import { slugify } from '../../lib/utils'
import type {
  Achievement,
  ActivityEntry,
  LearningSummary,
  MemberProfile,
  ProfileProject,
  SectionKey,
  VisibilityMap,
} from './types'

/**
 * The social layer reuses the existing demonstration member records as its
 * member table. It does not invent additional members. Profile sections are
 * assembled only from fields that already exist on those records, and the
 * activity timeline is aggregated from the club's existing demo records
 * (submissions, RSVPs, payments, session reports, awards) rather than generated.
 */

export type DirectoryMember = {
  username: string
  memberId: string
  displayName: string
  email: string
  role: 'member' | 'admin' | 'quizmaster'
  course: string
  year: string
  joined: string
  points: number
  active: boolean
  approved: boolean
  status: 'student' | 'alumni'
}

const used = new Set<string>()
function uniqueUsername(name: string) {
  const base = slugify(name) || 'member'
  let candidate = base
  let index = 2
  while (used.has(candidate)) {
    candidate = `${base}-${index}`
    index += 1
  }
  used.add(candidate)
  return candidate
}

function buildDirectory(): DirectoryMember[] {
  return demoUsers.map((user) => ({
    username: uniqueUsername(user.name),
    memberId: user.memberId,
    displayName: user.name,
    email: user.email,
    role: user.role === 'student' ? 'member' : user.role,
    course: user.course,
    year: user.year,
    joined: user.joined,
    points: user.name === demoMember.name ? demoMember.points : user.points,
    active: user.active,
    approved: user.approved,
    status: user.status,
  }))
}

export const directory: DirectoryMember[] = buildDirectory()

export function findMemberByEmail(email: string) {
  return directory.find((member) => member.email.toLowerCase() === email.toLowerCase())
}

export function findMemberByUsername(username: string) {
  return directory.find((member) => member.username === username)
}

/** Stable lookup: usernames are editable, member IDs are not. */
export function findMemberByMemberId(memberId: string) {
  return directory.find((member) => member.memberId === memberId)
}

export function memberByName(name: string) {
  return directory.find((member) => member.displayName === name)
}

export const DEFAULT_SECTIONS: VisibilityMap = {
  fullName: true,
  course: true,
  bio: true,
  skills: true,
  activity: true,
  achievements: true,
  projects: true,
  membership: false,
  socialLists: false,
  socialLinks: true,
}

export const SECTION_META: { key: SectionKey; label: string; description: string; group: string }[] = [
  { key: 'fullName', label: 'Full name', description: 'Your full name on your profile header and in search results.', group: 'Identity' },
  { key: 'course', label: 'Course and year', description: 'Your programme and year of study.', group: 'Identity' },
  { key: 'bio', label: 'Biography', description: 'Your short introduction and tagline.', group: 'About' },
  { key: 'skills', label: 'Skills and interests', description: 'Skills, tools and technical interests you list.', group: 'About' },
  { key: 'socialLinks', label: 'Social links', description: 'GitHub, LinkedIn and portfolio links.', group: 'About' },
  { key: 'activity', label: 'Learning activity', description: 'Your activity matrix, recent activity and progress summary.', group: 'Learning' },
  { key: 'achievements', label: 'Achievements', description: 'Trophies and judged competition placements.', group: 'Learning' },
  { key: 'projects', label: 'Projects', description: 'Projects attached to your member record.', group: 'Work' },
  { key: 'membership', label: 'Membership status', description: 'That your club membership is active. Payment details always stay private.', group: 'Club' },
  { key: 'socialLists', label: 'Follower and following lists', description: 'Who follows you and who you follow. Counts stay visible when this is off.', group: 'Club' },
]

const SECTION_KEYS = SECTION_META.map((section) => section.key)

function projectTechnologies(list: string) {
  return list
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const aminaProjects = demoMemberProjects.map((project) => ({
  ...project,
  technologies: projectTechnologies(project.technologies),
}))

const aminaSkills = Array.from(new Set(aminaProjects.flatMap((project) => project.technologies)))

/** Seeded records. Approved and active demo accounts start public; unapproved
 * or deactivated accounts start private, matching the default-private rule. */
export function seedProfiles(): Record<string, MemberProfile> {
  const profiles: Record<string, MemberProfile> = {}
  for (const member of directory) {
    const isDemoOwner = member.email === demoMember.email
    profiles[member.username] = {
      username: member.username,
      memberId: member.memberId,
      displayName: member.displayName,
      fullName: member.displayName,
      tagline: isDemoOwner ? demoMember.title : '',
      bio: isDemoOwner ? demoMember.bio : '',
      skills: isDemoOwner ? aminaSkills : [],
      interests: isDemoOwner ? [...demoMember.areasOfInterest] : [],
      github: isDemoOwner ? demoMember.github : '',
      linkedin: isDemoOwner ? demoMember.linkedin : '',
      website: '',
      course: member.course,
      year: member.year,
      joined: member.joined,
      points: member.points,
      role: member.role,
      status: member.status,
      suspended: !member.active,
      /* Approved demo accounts are public for review, except Samuel Mwita,
         who seeds the private-account approval flow. Unapproved and suspended
         records stay private and are excluded from discovery. */
      visibility: member.username === 'samuel-mwita' || !member.approved || !member.active ? 'private' : 'public',
      discoverable: member.approved && member.active,
      sections: { ...DEFAULT_SECTIONS },
      updatedAt: member.joined,
    }
  }
  return profiles
}

/* ------------------------------------------------------------------ */
/* Activity, achievements and projects, derived from existing records  */
/* ------------------------------------------------------------------ */

function entriesForMember(name: string): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  const isOwner = name === demoMember.name

  if (isOwner) {
    for (const reward of demoRewardHistory) {
      const kind: ActivityEntry['kind'] =
        reward.type === 'Competition' ? 'competition' : reward.type === 'Warmup' ? 'warmup' : reward.type === 'Event' ? 'event' : 'achievement'
      entries.push({
        id: `points-${reward.id}`,
        kind,
        label: reward.reason,
        detail: `+${reward.points} club points`,
        date: reward.date,
      })
    }
    for (const trophy of demoTrophies) {
      if (!trophy.earnedOn) continue
      entries.push({
        id: `trophy-${trophy.name}`,
        kind: 'achievement',
        label: `Achievement earned — ${trophy.name}`,
        detail: trophy.description,
        date: trophy.earnedOn,
      })
    }
  }

  for (const submission of demoCompetitionSubmissions) {
    if (submission.member !== name) continue
    entries.push({
      id: `submission-${submission.id}`,
      kind: 'competition',
      label: submission.status === 'reviewed' ? 'Competition submission judged' : 'Competition submission recorded',
      detail: submission.status === 'reviewed' ? `Score ${submission.score} · rank #${submission.rank}` : 'Awaiting judging',
      date: submission.submitted,
    })
  }

  for (const enrollment of demoEnrollments) {
    if (enrollment.member !== name) continue
    entries.push({
      id: `enrollment-${enrollment.id}`,
      kind: 'competition',
      label: `Enrolled in a competition — ${enrollment.team}`,
      detail: enrollment.status === 'disqualified' ? 'Enrolment disqualified' : 'Team enrolment',
      date: enrollment.enrolled,
    })
  }

  for (const rsvp of demoRsvps) {
    if (rsvp.name !== name) continue
    entries.push({
      id: `rsvp-${rsvp.id}`,
      kind: 'event',
      label: `RSVP submitted — ${rsvp.event}`,
      detail: rsvp.checkedIn ? 'Checked in at the event' : `Status: ${rsvp.status}`,
      date: rsvp.submitted,
    })
  }

  for (const payment of demoPayments) {
    if (payment.member !== name) continue
    entries.push({
      id: `payment-${payment.id}`,
      kind: 'membership',
      label: 'Membership payment recorded',
      detail: `${payment.method} · ${payment.period}`,
      date: payment.date,
    })
  }

  for (const report of demoSessionsReports) {
    if (report.instructor !== name) continue
    entries.push({
      id: `report-${report.id}`,
      kind: 'session',
      label: `Session report submitted — ${report.session}`,
      detail: `${report.attendees} attendees · ${report.status}`,
      date: report.submitted,
    })
  }

  const member = memberByName(name)
  if (member) {
    entries.push({
      id: `joined-${member.username}`,
      kind: 'joined',
      label: 'Joined KIUT Digital Club',
      detail: member.course,
      date: member.joined,
    })
  }

  return entries
    .filter((entry) => Boolean(entry.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function activityFor(memberId: string): ActivityEntry[] {
  const member = findMemberByMemberId(memberId)
  if (!member) return []
  return entriesForMember(member.displayName)
}

export function achievementsFor(memberId: string): Achievement[] {
  const member = findMemberByMemberId(memberId)
  if (!member) return []
  const achievements: Achievement[] = []

  if (member.displayName === demoMember.name) {
    for (const trophy of demoTrophies) {
      if (!trophy.earnedOn) continue
      achievements.push({
        id: `trophy-${trophy.name}`,
        name: trophy.name,
        description: trophy.description,
        date: trophy.earnedOn,
        category: 'Club award',
        verified: true,
      })
    }
  }

  for (const submission of demoCompetitionSubmissions) {
    if (submission.member !== member.displayName) continue
    if (submission.status !== 'reviewed' || !submission.rank || submission.rank > 3) continue
    achievements.push({
      id: `placement-${submission.id}`,
      name: `Competition placement — #${submission.rank}`,
      description: `Placed #${submission.rank} with a score of ${submission.score} in a judged club competition.`,
      date: submission.submitted,
      category: 'Competition',
      verified: true,
    })
  }

  return achievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function projectsFor(memberId: string): ProfileProject[] {
  const member = findMemberByMemberId(memberId)
  if (!member || member.displayName !== demoMember.name) return []
  return aminaProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    technologies: project.technologies,
    link: project.link,
    visibility: project.visibility,
    status: project.status,
    updated: project.updated,
  }))
}

export function learningFor(memberId: string): LearningSummary {
  const member = findMemberByMemberId(memberId)
  if (!member) return {}
  if (member.displayName === demoMember.name) {
    return {
      warmups: demoMember.warmupsCompleted,
      competitions: demoMember.competitions,
      points: demoMember.points,
      rank: demoMember.rank,
      bestRank: demoMember.bestRank,
      team: demoMember.team,
    }
  }
  const row = demoRankings.find((entry) => entry.name === member.displayName)
  if (!row) return { points: member.points }
  return {
    warmups: row.warmups,
    competitions: row.competitions,
    points: row.points,
    rank: row.rank,
    bestRank: row.best,
    team: row.team,
  }
}

export function membershipFor(memberId: string) {
  const member = findMemberByMemberId(memberId)
  if (!member) return null
  if (member.displayName === demoMember.name) {
    return {
      active: demoMember.membership.status === 'valid',
      since: demoMember.membership.startDate,
      until: demoMember.membership.endDate,
    }
  }
  const payment = demoPayments.find((entry) => entry.member === member.displayName)
  if (!payment) return null
  return { active: true, since: payment.date, until: undefined }
}

export const SOCIAL_SECTION_KEYS = SECTION_KEYS
