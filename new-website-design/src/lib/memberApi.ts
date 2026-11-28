/**
 * Member panel API (`/api/v1/member/*`, contract MD1–MD50).
 *
 * Every call here is same-origin and authenticated by the Flask-Login session.
 * The server resolves the member from the session, so no function accepts a
 * member id: one member can never ask for another member's record.
 *
 * Payload types mirror `app/api/member.py` exactly. Where the server returns a
 * value the screen does not use, it is still typed so a contract change is a
 * compile error rather than a silent `undefined`.
 */

import { apiRequest } from './api'

export type PaginationMeta = {
  page: number
  per_page: number
  total: number
  pages: number
}

export type Membership = {
  state: 'valid' | 'expired' | 'none'
  valid_from: string | null
  valid_until: string | null
  days_remaining: number | null
}

export type Tier = { name: string; points_required: number }
export type NextTier = Tier & { points_remaining: number }

export type ProfileCompletion = {
  required: boolean
  missing_fields: string[]
  percent: number
}

/* ------------------------------------------------------------------ MD1 */

export type DashboardTeam = {
  id: number
  name: string
  is_leader: boolean
  members_count: number
}

export type DashboardData = {
  greeting_name: string
  membership: Membership
  points: number
  rank: number
  tier: Tier | null
  next_tier: NextTier | null
  profile_completion: ProfileCompletion
  active_quiz: null | {
    id: number
    title: string
    topic: string | null
    scheduled_start_at: string | null
    duration_minutes: number
  }
  next_event: null | { id: number; title: string; starts_at: string; venue: string | null }
  current_week: null | { id: number; title: string; week_start: string | null; week_end: string | null }
  recent_rewards: RewardTransaction[]
  team: DashboardTeam | null
  unread: number
}

/* ------------------------------------------------------------- MD2 / MD3 */

export type SelfProfile = {
  id: number
  full_name: string
  title: string | null
  bio: string | null
  email: string
  phone: string | null
  course: string | null
  year: string | null
  status: string | null
  avatar_url: string | null
  github: string | null
  linkedin: string | null
  areas_of_interest: string[]
  projects: string[]
  member_number: string | null
  joined_at: string | null
  updated_at: string | null
  membership: Membership
}

export type ProfileUpdateInput = {
  full_name: string
  title?: string | null
  bio?: string | null
  phone: string
  course: string
  year: string
  status?: 'student' | 'alumni'
  github?: string | null
  linkedin?: string | null
  areas_of_interest?: string[]
  projects?: string[]
}

/* ---------------------------------------------------------- MD6 / MD8 */

export type DigitalId = {
  member_number: string | null
  display_name: string
  course: string | null
  year: string | null
  status: 'active' | 'pending'
  issued_at: string | null
  valid_until: string | null
  verify_url: string | null
  qr_payload: string | null
  image_urls: { front: string | null; back: string | null }
}

/* -------------------------------------------------------------- MD9 */

export type MembershipPayment = {
  id: number
  amount: number
  method: string
  period: { start: string | null; end: string | null }
  recorded_at: string | null
  active: boolean
  days_remaining: number | null
}

export type MembershipData = Membership & {
  days_expired: number
  latest_payment: MembershipPayment | null
  payments: MembershipPayment[]
}

/* -------------------------------------------------------- MD10 / MD11 */

export type RewardTransaction = {
  id: number
  points: number
  reason: string
  type: string
  awarded_at: string
}

export type Trophy = {
  id: number
  name: string
  description: string | null
  points_required: number
  earned: boolean
  earned_at: string | null
}

export type RewardsData = {
  points: number
  rank: number
  tier: Tier | null
  next_trophy: NextTier | null
  trophies: Trophy[]
}

/* ------------------------------------------------------- MD12–MD15 */

export type MemberProject = {
  id: number
  title: string
  description: string | null
  cover_url: string | null
  technologies: string[]
  links: { github: string | null; demo: string | null }
  is_public: boolean
  is_featured: boolean
  created_at: string | null
}

export type ProjectInput = {
  title: string
  description?: string | null
  github_link?: string | null
  demo_link?: string | null
  technologies?: string[] | string
  is_public?: boolean
}

export type SubmittedProject = MemberProject & {
  status: 'published'
  review_required: false
}

/* ---------------------------------------------------- MD16–MD18 */

export type MemberEvent = {
  id: number
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue: string | null
  category: string | null
  cover_url: string | null
  capacity: number | null
  registered_count: number
  check_in_points: number
  rsvp: null | { status: string; submitted_at: string | null; checked_in: boolean }
}

/* ---------------------------------------------------- MD19 / MD21 */

export type SessionItem = {
  id: number
  date: string
  start_time: string | null
  end_time: string | null
  topic: string
  category: string | null
  mode: string | null
  meeting_link: string | null
  location: string | null
  status: string
  instructor: { id: number | null; display_name: string }
}

export type Timetable = {
  week: null | { id: number; title: string; week_start: string | null; week_end: string | null }
  days: { date: string; sessions: SessionItem[] }[]
}

export type Instructor = {
  id: number | null
  display_name: string
  avatar_url: string | null
  sessions: { id: number; date: string; start_time: string | null; topic: string }[]
}

export type SessionReportInput = {
  winner_username?: string | null
  participant_count: number
  notes?: string | null
}

export type SessionReportResult = {
  id: number
  session_id: number
  status: string
  participant_count: number
  submitted_at: string | null
}

/* -------------------------------------------------------- MD22 / MD23 */

export type RankingRow = {
  rank: number
  member_id: number
  name: string
  course: string | null
  year: string | null
  points: number
  warmups: number
  competitions: number
  team: string | null
}

export type TeamRankingRow = {
  rank: number
  id: number
  name: string
  points: number
  rating: number
  members_count: number
  participations: number
}

export type RankingsData = {
  leaderboard: RankingRow[]
  my_entry: RankingRow | null
  teams: TeamRankingRow[]
}

/* --------------------------------------------------------- MD24–MD26 */

export type MemberNotification = {
  id: number
  title: string
  message?: string
  is_read: boolean
  created_at: string
  read_at: string | null
}

export type NotificationPage = {
  items: MemberNotification[]
  unread: number
  pagination: PaginationMeta
}

/* --------------------------------------------------------- MD27–MD34 */

export type QuizAttemptSummary = {
  id: number
  status: string
  score: number | null
  correct_count: number | null
  total_count: number | null
  started_at: string | null
  expires_at: string | null
  submitted_at: string | null
}

export type QuizSummary = {
  id: number
  title: string
  description: string | null
  field_of_study: string | null
  topic: string | null
  duration_minutes: number
  total_questions: number
  scheduled_start_at: string | null
  published_at: string | null
  is_live: boolean
  attempt: QuizAttemptSummary | null
  can_start: boolean
}

export type QuizQuestion = {
  id: number
  order: number
  type: string
  scenario: string | null
  question: string
  difficulty: string | null
  options: { id: number; key: string; text: string }[]
}

export type QuizDetail = Omit<QuizSummary, 'attempt'> & {
  attempt: QuizAttemptSummary | null
  questions: QuizQuestion[]
  resources: { id: number; title: string; uploaded_at: string | null }[]
}

export type Attempt = {
  attempt_id: number
  quiz_id: number
  status: string
  started_at: string | null
  expires_at: string | null
  submitted_at: string | null
  score: number | null
  correct_count: number | null
  total_count: number | null
  violation_count: number
  confidence_adjusted_score: number | null
}

export type StartedAttempt = {
  attempt_id: number
  quiz_id: number
  status: string
  expires_at: string | null
}

export type AttemptAnswerInput = { question_id: number; choice_id: number }

export type AttemptDetail = Attempt & {
  quiz_title: string
  results_released: boolean
  rank: number | null
  points_awarded: number
  review: null | {
    question_id: number
    question_text: string
    selected_option_id: number | null
    correct_option_id: number | null
    is_correct: boolean
    answered: boolean
  }[]
}

export type QuizLeaderboard = {
  quiz: { id: number; title: string }
  participant_count: number
  rows: { rank: number; display_name: string; score: number | null; points_awarded: number }[]
  meta: PaginationMeta
}

/* --------------------------------------------------------- MD35–MD39 */

export type CompetitionSubmission = {
  id: number
  type: string
  value: string | null
  status: string
  submitted_at: string | null
  final_score: number | null
  rank: number | null
  points_awarded: number
}

export type CompetitionEntry = {
  id: number
  title: string
  category: string | null
  frequency: 'weekly' | 'monthly'
  level: number
  status: string
  starts_at: string
  ends_at: string
  submission_type: string
  requires_paid_membership: boolean
  allowed_years: string[]
  enrolled: boolean
  submission: CompetitionSubmission | null
  reasons: string[]
  leaderboard_available: boolean
}

export type CompetitionList = {
  frequency: 'weekly' | 'monthly'
  active: CompetitionEntry[]
  past: CompetitionEntry[]
}

export type CompetitionDetail = {
  id: number
  title: string
  description: string | null
  category: string | null
  frequency: 'weekly' | 'monthly'
  level: number
  status: string
  starts_at: string
  ends_at: string
  submission_type: string
  submission_max_mb: number | null
  assessment: {
    mode: string | null
    instructions: string | null
    link: string | null
    location: string | null
    date: string | null
  }
  requires_paid_membership: boolean
  allowed_years: string[]
  criteria: { id: number; name: string; description: string | null; max_points: number; weight_percent: number }[]
  rewards: {
    id: number
    rank_from: number
    rank_to: number
    percent: number | null
    points: number | null
    title: string | null
    description: string | null
  }[]
  sponsors: { name: string; is_primary: boolean }[]
  enrollment: null | { status: string; enrolled_at: string | null }
  submission: CompetitionSubmission | null
  team: null | { id: number; name: string; is_leader: boolean; enrolled: boolean }
  eligibility: { allowed: boolean; reasons: string[] }
  leaderboard_available: boolean
}

export type CompetitionLeaderboard = {
  individuals: {
    rank: number
    display_name: string
    avatar_url: string | null
    course: string | null
    year: string | null
    final_score: number | null
    is_winner: boolean
    submitted_at: string | null
  }[]
  teams: { rank: number; display_name: string; final_score: number | null; members_count: number }[]
}

/* --------------------------------------------------------- MD40–MD45 */

export type Candidacy = { id: number; position_id: number; status: string }

export type ElectionSummary = {
  id: number
  title: string
  term: string | null
  status: string
  phase: string
  applications: { open: string | null; close: string | null }
  voting: { open: string | null; close: string | null }
  positions_count: number
  can_apply: boolean
  can_vote: boolean
  has_voted: boolean
  eligibility_reason: string | null
  my_candidacies: Candidacy[]
}

export type ElectionCandidate = {
  id: number
  display_name: string
  course: string | null
  year: string | null
  manifesto: string | null
  photo_url: string | null
  vote_count: number
  status: string
}

export type ElectionPosition = {
  id: number
  title: string
  subtitle: string | null
  seats: number
  description: string | null
  responsibilities: string[]
  my_candidacy: null | { id: number; status: string; manifesto: string | null }
  voted: boolean
  candidates: ElectionCandidate[]
}

export type ElectionDetail = ElectionSummary & {
  description: string | null
  requires_paid_membership: boolean
  positions: ElectionPosition[]
}

export type ElectionResults = {
  election: { id: number; title: string; status: string }
  positions: {
    id: number
    title: string
    candidates: { id: number; display_name: string; vote_count: number; status: string; is_winner: boolean }[]
  }[]
}

export type ElectionList = {
  active: ElectionSummary[]
  upcoming: ElectionSummary[]
  past: ElectionSummary[]
}

/* --------------------------------------------------------- MD46–MD49 */

export type TeamSummary = {
  id: number
  name: string
  description: string | null
  rating: number
  points: number
  is_open: boolean
  is_suspended: boolean
  members_count: number
  leader: string | null
  created_at: string | null
}

export type TeamMemberRow = {
  member_id: number
  display_name: string
  course: string | null
  year: string | null
  avatar_url: string | null
  is_leader: boolean
}

export type TeamDetail = TeamSummary & {
  is_member: boolean
  is_leader: boolean
  members: TeamMemberRow[]
  competitions: { competition_id: number; status: string }[]
}

export type TeamsData = {
  my_team: TeamSummary | null
  my_membership: null | { is_leader: boolean; joined_at: string | null }
  my_requests: { id: number; team: TeamSummary; requested_at: string | null }[]
  leader_requests: {
    id: number
    team_id: number
    member_id: number
    display_name: string
    course: string | null
    year: string | null
    requested_at: string | null
  }[]
  open_teams: TeamSummary[]
}

/* ------------------------------------------------------------- helpers */

type Query = Record<string, string | number | undefined | null>

function queryString(params?: Query) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const rendered = search.toString()
  return rendered ? `?${rendered}` : ''
}

export const memberApi = {
  dashboard: () => apiRequest<DashboardData>('/member/dashboard'),

  profile: () => apiRequest<SelfProfile>('/member/profile'),
  updateProfile: (input: ProfileUpdateInput) =>
    apiRequest<SelfProfile>('/member/profile', { method: 'PATCH', body: input }),
  uploadAvatar: (file: File) => {
    const body = new FormData()
    body.append('avatar', file)
    return apiRequest<{ avatar_url: string | null }>('/member/profile/avatar', {
      method: 'POST',
      body,
    })
  },

  digitalId: () => apiRequest<DigitalId>('/member/digital-id'),
  regenerateDigitalId: () => apiRequest<DigitalId>('/member/digital-id/regenerate', { method: 'POST', body: {} }),

  membership: () => apiRequest<MembershipData>('/member/membership'),

  rewards: () => apiRequest<RewardsData>('/member/rewards'),
  rewardsHistory: (params?: Query) =>
    apiRequest<RewardTransaction[]>('/member/rewards/history' + queryString(params)),

  projects: () => apiRequest<MemberProject[]>('/member/projects'),
  project: (id: number) => apiRequest<MemberProject>(`/member/projects/${id}`),
  createProject: (input: ProjectInput) =>
    apiRequest<MemberProject>('/member/projects', { method: 'POST', body: input }),
  updateProject: (id: number, input: Partial<ProjectInput>) =>
    apiRequest<MemberProject>(`/member/projects/${id}`, { method: 'PATCH', body: input }),
  deleteProject: (id: number) => apiRequest<void>(`/member/projects/${id}`, { method: 'DELETE' }),
  submitProject: (id: number) =>
    apiRequest<SubmittedProject>(`/member/projects/${id}/submit`, { method: 'POST', body: {} }),

  events: (scope: 'upcoming' | 'past' | 'all' = 'upcoming') =>
    apiRequest<MemberEvent[]>('/member/events' + queryString({ scope })),
  rsvp: (eventId: number, input?: Record<string, string>) =>
    apiRequest<{ rsvp: { id: number; status: string; submitted_at: string | null } }>(
      `/member/events/${eventId}/rsvp`,
      { method: 'POST', body: input ?? {} },
    ),
  cancelRsvp: (eventId: number) => apiRequest<void>(`/member/events/${eventId}/rsvp`, { method: 'DELETE' }),

  timetable: (weekId?: number) =>
    apiRequest<Timetable>('/member/sessions/timetable' + queryString({ week: weekId })),
  instructors: () => apiRequest<Instructor[]>('/member/sessions/instructors'),
  reportSession: (sessionId: number, input: SessionReportInput) =>
    apiRequest<SessionReportResult>(`/member/sessions/${sessionId}/report`, { method: 'POST', body: input }),

  rankings: (params?: Query) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null || value === '') continue
      search.set(key, String(value))
    }
    const rendered = search.toString()
    return apiRequest<RankingsData>('/member/rankings' + (rendered ? `?${rendered}` : ''))
  },
  pointsTransactions: (params?: Query) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null || value === '') continue
      search.set(key, String(value))
    }
    const rendered = search.toString()
    return apiRequest<{ points: number; transactions: RewardTransaction[] }>(
      '/member/rankings/points-transactions' + (rendered ? `?${rendered}` : ''),
    )
  },

  notifications: async (params?: Query & { unread?: boolean }): Promise<NotificationPage> => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null || value === '' || value === false) continue
      search.set(key, String(value))
    }
    const rendered = search.toString()
    const body = await apiRequest<{
      data: MemberNotification[]
      meta?: { unread?: number; pagination?: PaginationMeta }
    }>('/member/notifications' + (rendered ? `?${rendered}` : ''), { envelope: true })
    return {
      items: body.data ?? [],
      unread: (body.meta as { unread?: number } | undefined)?.unread ?? 0,
      pagination: ((body.meta as { pagination?: PaginationMeta } | undefined)?.pagination ?? {
        page: params?.page ? Number(params.page) : 1,
        per_page: (body.data ?? []).length,
        total: (body.data ?? []).length,
        pages: 1,
      }) as PaginationMeta,
    }
  },
  notification: (id: number) => apiRequest<MemberNotification>(`/member/notifications/${id}`),
  markNotificationRead: (id: number) =>
    apiRequest<void>(`/member/notifications/${id}/read`, { method: 'POST', body: {} }),
  markAllNotificationsRead: () =>
    apiRequest<void>('/member/notifications/read-all', { method: 'POST', body: {} }),

  quizzes: () => apiRequest<QuizSummary[]>('/member/quizzes'),
  quiz: (id: number) => apiRequest<QuizDetail>(`/member/quizzes/${id}`),
  startAttempt: (quizId: number) =>
    apiRequest<StartedAttempt>(`/member/quizzes/${quizId}/attempts`, { method: 'POST', body: {} }),
  saveAnswers: (attemptId: number, answers: AttemptAnswerInput[]) =>
    apiRequest<{ saved: number; attempt_id: number }>(`/member/attempts/${attemptId}/answers`, {
      method: 'PATCH',
      body: { answers },
    }),
  reportViolation: (attemptId: number, kind: 'tab_switch' | 'blur' | 'paste' | 'inactivity', details?: string) =>
    apiRequest<{ violations: number; remaining: number; auto_submitted: boolean; status: string }>(
      `/member/attempts/${attemptId}/violation`,
      { method: 'POST', body: { kind, details } },
    ),
  submitAttempt: (attemptId: number, answers?: AttemptAnswerInput[]) =>
    apiRequest<Attempt>(`/member/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: answers ? { answers } : {},
    }),
  attempt: (attemptId: number) => apiRequest<AttemptDetail>(`/member/attempts/${attemptId}`),
  quizLeaderboard: (quizId: number) => apiRequest<QuizLeaderboard>(`/member/quizzes/${quizId}/leaderboard`),

  competitions: (frequency: 'weekly' | 'monthly' = 'weekly') =>
    apiRequest<CompetitionList>('/member/competitions' + queryString({ frequency })),
  competition: (id: number) => apiRequest<CompetitionDetail>(`/member/competitions/${id}`),
  competitionLeaderboard: (id: number) =>
    apiRequest<CompetitionLeaderboard>(`/member/competitions/${id}/leaderboard`),
  enroll: (id: number, mode: 'individual' | 'team') =>
    apiRequest<{ id: number; competition_id: number; status: string; mode: string }>(
      `/member/competitions/${id}/enroll`,
      { method: 'POST', body: { agree_terms: true, mode } },
    ),
  submitCompetition: (id: number, submissionUrl: string) =>
    apiRequest<CompetitionSubmission>(`/member/competitions/${id}/submissions`, {
      method: 'POST',
      body: { submission_url: submissionUrl },
    }),

  elections: () => apiRequest<ElectionList>('/member/elections'),
  election: (id: number) => apiRequest<ElectionDetail>(`/member/elections/${id}`),
  electionResults: (id: number) => apiRequest<ElectionResults>(`/member/elections/${id}/results`),
  applyForPosition: (electionId: number, positionId: number, manifesto: string, action: 'draft' | 'submit' = 'submit') =>
    apiRequest<{ id: number; status: string; manifesto: string | null }>(
      `/member/elections/${electionId}/apply/${positionId}`,
      { method: 'POST', body: { manifesto, action } },
    ),
  withdrawCandidacy: (electionId: number, candidateId: number) =>
    apiRequest<void>(`/member/elections/${electionId}/withdraw/${candidateId}`, {
      method: 'POST',
      body: {},
    }),
  vote: (electionId: number, votes: { position_id: number; candidate_id: number }[]) =>
    apiRequest<{ election_id: number; voted_positions: number[]; receipt: string; voted_at: string }>(
      `/member/elections/${electionId}/vote`,
      { method: 'POST', body: { votes } },
    ),

  teams: () => apiRequest<TeamsData>('/member/teams'),
  team: (id: number) => apiRequest<TeamDetail>(`/member/teams/${id}`),
  requestTeamJoin: (teamId: number) =>
    apiRequest<{ id: number; team_id: number; status: string; requested_at: string | null }>(
      `/member/teams/${teamId}/requests`,
      { method: 'POST', body: {} },
    ),
  decideTeamRequest: (teamId: number, requestId: number, decision: 'approve' | 'reject') =>
    apiRequest<{ id: number; team_id: number; member_id: number; status: string }>(
      `/member/teams/${teamId}/requests/${requestId}/decision`,
      { method: 'POST', body: { decision } },
    ),
  removeTeamMember: (teamId: number, memberId: number) =>
    apiRequest<void>(`/member/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
}
