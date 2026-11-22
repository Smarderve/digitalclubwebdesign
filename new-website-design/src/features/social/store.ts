import {
  DEFAULT_SECTIONS,
  activityFor,
  directory,
  findMemberByEmail,
  findMemberByUsername,
  seedProfiles,
} from './directory'
import type {
  FollowRequest,
  MemberProfile,
  MemberSearchItem,
  ProfileAccess,
  Relationship,
  Report,
  ReportReason,
  SectionKey,
  SocialErrorCode,
  SocialNotification,
  SocialResult,
  SocialState,
  VisibilityMap,
} from './types'

/**
 * The social service. This prototype has no HTTP server, so this module is the
 * single trusted data layer the UI talks to: every read applies the viewer's
 * authorization and privacy rules, and every write validates the actor before
 * records change. It persists to the device so relationships survive a reload,
 * exactly like the existing demo session does.
 */

const STORAGE_KEY = 'kiut-social-v1'

export const GUEST = '__guest__'

const ALL_SECTIONS: SectionKey[] = [
  'fullName',
  'course',
  'bio',
  'skills',
  'activity',
  'achievements',
  'projects',
  'membership',
  'socialLists',
  'socialLinks',
]

const hiddenSections: VisibilityMap = {
  fullName: false,
  course: false,
  bio: false,
  skills: false,
  activity: false,
  achievements: false,
  projects: false,
  membership: false,
  socialLists: false,
  socialLinks: false,
}

const openSections: VisibilityMap = {
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

function emptyState(): SocialState {
  return {
    version: 1,
    profiles: seedProfiles(),
    follows: [],
    requests: [],
    blocks: [],
    reports: [],
    notifications: [],
    audit: [],
    meta: { search: [], follow: [] },
  }
}

function loadState(): SocialState {
  const fresh = emptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<SocialState>
    if (!parsed || parsed.version !== 1) return fresh
    /* Seeded profiles are merged by member ID so a renamed username is not
       resurrected as a duplicate record on the next page load. */
    const profiles = { ...fresh.profiles }
    for (const stored of Object.values(parsed.profiles ?? {})) {
      for (const [key, candidate] of Object.entries(profiles)) {
        if (candidate.memberId === stored.memberId) delete profiles[key]
      }
      profiles[stored.username] = stored
    }
    return {
      version: 1,
      profiles,
      follows: Array.isArray(parsed.follows) ? parsed.follows : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      meta: { search: [], follow: [] },
    }
  } catch {
    return fresh
  }
}

let state: SocialState = loadState()
const listeners = new Set<() => void>()

/** In-memory throttles. Search and follow actions are rate limited per session. */
const searchHits: number[] = []
const followHits: number[] = []

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getState() {
  return state
}

/** Apply a state written by another tab, so two open sessions stay consistent. */
export function syncFromStorage() {
  const next = loadState()
  state = next
  listeners.forEach((listener) => listener())
}

function commit(next: SocialState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* storage can be blocked; the session still works in memory */
  }
  listeners.forEach((listener) => listener())
}

function now() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function within(times: number[], limit: number, windowMs: number) {
  const cutoff = Date.now() - windowMs
  const recent = times.filter((time) => time > cutoff)
  if (recent.length >= limit) {
    times.length = 0
    times.push(...recent)
    return false
  }
  recent.push(Date.now())
  times.length = 0
  times.push(...recent)
  return true
}

class SocialFailure extends Error {
  code: SocialErrorCode
  constructor(code: SocialErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

function fail(code: SocialErrorCode, message: string): never {
  throw new SocialFailure(code, message)
}

function run(action: () => void): SocialResult {
  try {
    action()
    return { ok: true, data: undefined }
  } catch (error) {
    if (error instanceof SocialFailure) return { ok: false, error: error.message, code: error.code }
    throw error
  }
}

function runData<T>(action: () => T): SocialResult<T> {
  try {
    return { ok: true, data: action() }
  } catch (error) {
    if (error instanceof SocialFailure) return { ok: false, error: error.message, code: error.code }
    throw error
  }
}

function mutate(updater: (draft: SocialState) => void) {
  const next: SocialState = {
    ...state,
    profiles: { ...state.profiles },
    follows: [...state.follows],
    requests: [...state.requests],
    blocks: [...state.blocks],
    reports: [...state.reports],
    notifications: [...state.notifications],
    audit: [...state.audit],
    meta: { ...state.meta },
  }
  updater(next)
  commit(next)
}

function pushNotification(
  next: SocialState,
  notification: Omit<SocialNotification, 'id' | 'createdAt' | 'read'>,
) {
  next.notifications.unshift({
    ...notification,
    id: uid('social-notification'),
    createdAt: now(),
    read: false,
  })
}

function pushAudit(next: SocialState, actor: string, action: string, target: string, detail: string) {
  next.audit.unshift({ id: uid('audit'), actor, action, target, detail, at: now() })
}

/* ------------------------------------------------------------------ */
/* Identity and access                                                 */
/* ------------------------------------------------------------------ */

function usernameForMember(member: { username: string; memberId: string }) {
  const direct = state.profiles[member.username]
  if (direct && direct.memberId === member.memberId) return member.username
  const renamed = Object.values(state.profiles).find(
    (profile) => profile.memberId === member.memberId,
  )
  return renamed?.username ?? member.username
}

export function viewerFromUser(user: { email: string; name: string } | null): string | null {
  if (!user) return null
  const byEmail = findMemberByEmail(user.email)
  if (byEmail) return usernameForMember(byEmail)
  const byName = directory.find((member) => member.displayName === user.name)
  return byName ? usernameForMember(byName) : null
}

export function profileOf(username: string | null | undefined): MemberProfile | undefined {
  if (!username) return undefined
  return state.profiles[username]
}

export function displayNameFor(username: string) {
  return state.profiles[username]?.displayName ?? findMemberByUsername(username)?.displayName ?? username
}

function requireActor(actor: string | null): MemberProfile {
  if (!actor) fail('AUTH_REQUIRED', 'Sign in to use member discovery.')
  const profile = state.profiles[actor]
  if (!profile) fail('AUTH_REQUIRED', 'Sign in to use member discovery.')
  if (profile.suspended) fail('SUSPENDED', 'This account is suspended.')
  return profile
}

function requireTarget(username: string | null): MemberProfile {
  const profile = username ? state.profiles[username] : undefined
  if (!profile) fail('NOT_FOUND', 'This member could not be found.')
  return profile
}

export function isBlockedPair(a: string | null, b: string) {
  if (!a) return false
  return state.blocks.some(
    (block) =>
      (block.blocker === a && block.blocked === b) || (block.blocker === b && block.blocked === a),
  )
}

export function relationshipFor(actor: string | null, target: string): Relationship {
  if (!actor) return { state: 'none', isFollower: false, hasPendingRequest: false }
  if (actor === target) return { state: 'self', isFollower: false, hasPendingRequest: false }
  if (isBlockedPair(actor, target)) {
    return { state: 'blocked', isFollower: false, hasPendingRequest: false }
  }
  const isFollower = state.follows.some(
    (follow) => follow.follower === actor && follow.following === target,
  )
  const outgoing = state.requests.find(
    (request) => request.from === actor && request.to === target && request.status === 'pending',
  )
  const incoming = state.requests.find(
    (request) => request.from === target && request.to === actor && request.status === 'pending',
  )
  const relationshipState: Relationship['state'] = isFollower
    ? 'following'
    : outgoing
      ? 'request_pending'
      : incoming
        ? 'requested_you'
        : 'none'
  return {
    state: relationshipState,
    isFollower,
    hasPendingRequest: Boolean(outgoing),
    incomingRequestId: incoming?.id,
    outgoingRequestId: outgoing?.id,
  }
}

export function followerCount(username: string) {
  return state.follows.filter((follow) => follow.following === username).length
}

export function followingCount(username: string) {
  return state.follows.filter((follow) => follow.follower === username).length
}

export function memberCounts(username: string) {
  return { followers: followerCount(username), following: followingCount(username) }
}

/**
 * The single authorization decision for a profile view. A public profile is
 * still filtered by its per-section settings; a private profile shows nothing
 * beyond the header until the viewer is an approved follower.
 */
export function accessProfile(actor: string | null, username: string): ProfileAccess {
  const profile = state.profiles[username]
  const isOwner = actor === username
  const relationship = relationshipFor(actor, username)
  const counts = { followers: followerCount(username), following: followingCount(username) }

  if (!profile) {
    return { status: 'not_found', isOwner: false, relationship, counts, visible: hiddenSections }
  }
  if (isBlockedPair(actor, username)) {
    return { status: 'unavailable', isOwner: false, relationship, counts: null, visible: hiddenSections }
  }
  if (profile.suspended) {
    return {
      status: 'suspended',
      profile,
      isOwner,
      relationship,
      counts: null,
      visible: hiddenSections,
    }
  }

  const fullAccess = isOwner || profile.visibility === 'public' || relationship.isFollower
  const visible: VisibilityMap = { ...hiddenSections }
  if (isOwner) {
    ALL_SECTIONS.forEach((key) => {
      visible[key] = true
    })
  } else if (fullAccess) {
    ALL_SECTIONS.forEach((key) => {
      visible[key] = profile.sections[key]
    })
  }

  return {
    status: fullAccess ? 'ok' : 'private',
    profile,
    isOwner,
    relationship,
    counts,
    visible,
  }
}

export function canSeeSection(access: ProfileAccess, section: SectionKey) {
  return Boolean(access.visible[section])
}

function lastActivityAt(username: string) {
  const profile = state.profiles[username]
  const entries = profile ? activityFor(profile.memberId) : []
  return entries[0]?.date ?? profile?.joined ?? '1970-01-01'
}

function summaryItem(actor: string | null, profile: MemberProfile): MemberSearchItem {
  const access = accessProfile(actor, profile.username)
  const isPrivate = profile.visibility === 'private' && !access.relationship.isFollower && !access.isOwner
  return {
    username: profile.username,
    displayName: profile.displayName,
    tagline: access.visible.bio ? profile.tagline || null : null,
    skills: access.visible.skills ? profile.skills.slice(0, 3) : [],
    isPrivate,
    relationship: access.relationship.state,
    countsVisible: !isPrivate,
    followers: isPrivate ? null : followerCount(profile.username),
  }
}

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

export type MemberSearchResponse = {
  items: MemberSearchItem[]
  total: number
  hasMore: boolean
}

export function searchMembers(
  actor: string | null,
  rawQuery: string,
  options?: { offset?: number; limit?: number },
): SocialResult<MemberSearchResponse> {
  return runData(() => {
    const viewer = requireActor(actor)
    if (!within(searchHits, 30, 10_000)) {
      fail('RATE_LIMITED', 'You have searched a lot in a short time. Wait a few seconds and try again.')
    }
    const query = rawQuery.trim().toLowerCase()
    const tokens = query.split(/\s+/).filter(Boolean)
    const offset = Math.max(0, options?.offset ?? 0)
    const limit = Math.min(20, Math.max(1, options?.limit ?? 6))

    const matches: { profile: MemberProfile; score: number }[] = []

    for (const profile of Object.values(state.profiles)) {
      if (profile.username === viewer.username) continue
      if (profile.suspended || !profile.discoverable) continue
      if (isBlockedPair(viewer.username, profile.username)) continue

      const access = accessProfile(viewer.username, profile.username)
      const isPrivate = profile.visibility === 'private' && !access.relationship.isFollower
      const showFullName = access.visible.fullName
      const showBio = access.visible.bio
      const showSkills = access.visible.skills

      const haystack: { value: string; weight: number }[] = [
        { value: profile.username, weight: 60 },
        { value: profile.displayName, weight: 50 },
      ]
      if (showFullName) haystack.push({ value: profile.fullName, weight: 50 })
      if (showBio) haystack.push({ value: profile.tagline, weight: 20 })
      if (showSkills) {
        profile.skills.forEach((skill) => haystack.push({ value: skill, weight: 30 }))
        profile.interests.forEach((interest) => haystack.push({ value: interest, weight: 25 }))
      }

      let score = 0
      let matchesAll = true
      for (const token of tokens) {
        let tokenScore = 0
        for (const field of haystack) {
          if (!field.value) continue
          const value = field.value.toLowerCase()
          if (value === token) tokenScore = Math.max(tokenScore, field.weight + 40)
          else if (value.startsWith(token)) tokenScore = Math.max(tokenScore, field.weight + 20)
          else if (value.includes(token)) tokenScore = Math.max(tokenScore, field.weight)
        }
        if (tokenScore === 0) {
          matchesAll = false
          break
        }
        score += tokenScore
      }
      if (!matchesAll) continue
      // Private accounts remain discoverable by name, but only as a private row.
      if (isPrivate) score = Math.min(score, 30)
      matches.push({ profile, score })
    }

    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(lastActivityAt(b.profile.username)).getTime() - new Date(lastActivityAt(a.profile.username)).getTime()
    })

    const slice = matches.slice(offset, offset + limit)
    return {
      items: slice.map((match) => summaryItem(viewer.username, match.profile)),
      total: matches.length,
      hasMore: offset + limit < matches.length,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Relationship operations                                             */
/* ------------------------------------------------------------------ */

function assertCanInteract(actor: MemberProfile, target: MemberProfile) {
  if (actor.username === target.username) fail('SELF_ACTION', 'You cannot do that on your own account.')
  if (target.suspended) fail('SUSPENDED', 'This account is suspended.')
  if (isBlockedPair(actor.username, target.username)) fail('BLOCKED', 'This profile is not available.')
}

function rateLimitFollowActions() {
  if (!within(followHits, 12, 60_000)) {
    fail('RATE_LIMITED', 'Too many follow actions in a short time. Try again in a minute.')
  }
}

export function followMember(actor: string | null, username: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const them = requireTarget(username)
    assertCanInteract(me, them)
    rateLimitFollowActions()
    if (state.follows.some((follow) => follow.follower === me.username && follow.following === them.username)) {
      fail('ALREADY_FOLLOWING', 'You already follow this member.')
    }
    if (them.visibility === 'private') {
      fail('INVALID', 'This account is private. Send a follow request instead.')
    }
    mutate((next) => {
      next.follows.push({ follower: me.username, following: them.username, createdAt: now() })
      next.requests = next.requests.map((request) =>
        request.from === me.username && request.to === them.username && request.status === 'pending'
          ? { ...request, status: 'cancelled', updatedAt: now() }
          : request,
      )
      next.notifications = next.notifications.filter(
        (notification) => !(notification.owner === them.username && notification.requestId),
      )
      pushNotification(next, {
        owner: them.username,
        kind: 'follow',
        title: 'New follower',
        body: `${me.displayName} started following you.`,
        actor: me.username,
      })
    })
  })
}

export function unfollowMember(actor: string | null, username: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const them = requireTarget(username)
    if (me.username === them.username) fail('SELF_ACTION', 'You cannot unfollow your own account.')
    const existing = state.follows.some(
      (follow) => follow.follower === me.username && follow.following === them.username,
    )
    if (!existing) fail('NOT_FOLLOWING', 'You do not follow this member.')
    mutate((next) => {
      next.follows = next.follows.filter(
        (follow) => !(follow.follower === me.username && follow.following === them.username),
      )
    })
  })
}

export function requestFollow(actor: string | null, username: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const them = requireTarget(username)
    assertCanInteract(me, them)
    rateLimitFollowActions()
    if (them.visibility === 'public') {
      fail('INVALID', 'This account is public. Follow directly instead of requesting.')
    }
    if (state.follows.some((follow) => follow.follower === me.username && follow.following === them.username)) {
      fail('ALREADY_FOLLOWING', 'You already follow this member.')
    }
    if (
      state.requests.some(
        (request) => request.from === me.username && request.to === them.username && request.status === 'pending',
      )
    ) {
      fail('ALREADY_REQUESTED', 'You already have a pending request with this member.')
    }
    mutate((next) => {
      const request: FollowRequest = {
        id: uid('follow-request'),
        from: me.username,
        to: them.username,
        status: 'pending',
        createdAt: now(),
        updatedAt: now(),
      }
      next.requests.unshift(request)
      pushNotification(next, {
        owner: them.username,
        kind: 'follow_request',
        title: 'Follow request',
        body: `${me.displayName} requested to follow your private profile.`,
        actor: me.username,
        requestId: request.id,
      })
    })
  })
}

export function cancelFollowRequest(actor: string | null, requestId: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const request = state.requests.find((item) => item.id === requestId)
    if (!request) fail('NO_REQUEST', 'That request no longer exists.')
    if (request.from !== me.username) fail('FORBIDDEN', 'You can only cancel your own request.')
    if (request.status !== 'pending') fail('NO_REQUEST', 'That request has already been answered.')
    mutate((next) => {
      next.requests = next.requests.map((item) =>
        item.id === requestId ? { ...item, status: 'cancelled', updatedAt: now() } : item,
      )
      next.notifications = next.notifications.filter((notification) => notification.requestId !== requestId)
    })
  })
}

export function approveFollowRequest(actor: string | null, requestId: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const request = state.requests.find((item) => item.id === requestId)
    if (!request) fail('NO_REQUEST', 'That request no longer exists.')
    if (request.to !== me.username) fail('FORBIDDEN', 'Only the profile owner can approve this request.')
    if (request.status !== 'pending') fail('NO_REQUEST', 'That request has already been answered.')
    if (isBlockedPair(request.from, request.to)) fail('BLOCKED', 'This member is blocked.')
    mutate((next) => {
      next.requests = next.requests.map((item) =>
        item.id === requestId ? { ...item, status: 'accepted', updatedAt: now() } : item,
      )
      if (
        !next.follows.some(
          (follow) => follow.follower === request.from && follow.following === request.to,
        )
      ) {
        next.follows.push({ follower: request.from, following: request.to, createdAt: now() })
      }
      next.notifications = next.notifications.map((notification) =>
        notification.requestId === requestId ? { ...notification, read: true } : notification,
      )
      pushNotification(next, {
        owner: request.from,
        kind: 'request_approved',
        title: 'Follow request approved',
        body: `${me.displayName} approved your request to follow them.`,
        actor: me.username,
      })
    })
  })
}

export function rejectFollowRequest(actor: string | null, requestId: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const request = state.requests.find((item) => item.id === requestId)
    if (!request) fail('NO_REQUEST', 'That request no longer exists.')
    if (request.to !== me.username) fail('FORBIDDEN', 'Only the profile owner can decline this request.')
    if (request.status !== 'pending') fail('NO_REQUEST', 'That request has already been answered.')
    mutate((next) => {
      next.requests = next.requests.map((item) =>
        item.id === requestId ? { ...item, status: 'rejected', updatedAt: now() } : item,
      )
      next.notifications = next.notifications.map((notification) =>
        notification.requestId === requestId ? { ...notification, read: true } : notification,
      )
      pushNotification(next, {
        owner: request.from,
        kind: 'request_declined',
        title: 'Follow request declined',
        body: `${me.displayName} declined your request to follow them.`,
        actor: me.username,
      })
    })
  })
}

export function removeFollower(actor: string | null, followerUsername: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    if (me.username === followerUsername) fail('SELF_ACTION', 'You cannot remove yourself as a follower.')
    const existing = state.follows.some(
      (follow) => follow.follower === followerUsername && follow.following === me.username,
    )
    if (!existing) fail('NOT_FOLLOWING', 'That member is not following you.')
    mutate((next) => {
      next.follows = next.follows.filter(
        (follow) => !(follow.follower === followerUsername && follow.following === me.username),
      )
      pushNotification(next, {
        owner: followerUsername,
        kind: 'follow_removed',
        title: 'Removed from followers',
        body: `${me.displayName} removed you from their followers.`,
        actor: me.username,
      })
    })
  })
}

/* ------------------------------------------------------------------ */
/* Blocking, reporting and moderation                                  */
/* ------------------------------------------------------------------ */

export const REPORT_REASONS: ReportReason[] = [
  'Harassment or bullying',
  'Impersonation',
  'Inappropriate profile content',
  'Spam or scam',
  'Other',
]

export function blockMember(actor: string | null, username: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const them = requireTarget(username)
    if (me.username === them.username) fail('SELF_ACTION', 'You cannot block your own account.')
    if (state.blocks.some((block) => block.blocker === me.username && block.blocked === them.username)) {
      fail('INVALID', 'You have already blocked this member.')
    }
    mutate((next) => {
      next.blocks.push({ blocker: me.username, blocked: them.username, createdAt: now() })
      next.follows = next.follows.filter(
        (follow) =>
          !(
            (follow.follower === me.username && follow.following === them.username) ||
            (follow.follower === them.username && follow.following === me.username)
          ),
      )
      next.requests = next.requests.map((request) =>
        request.status === 'pending' &&
        ((request.from === me.username && request.to === them.username) ||
          (request.from === them.username && request.to === me.username))
          ? { ...request, status: 'cancelled', updatedAt: now() }
          : request,
      )
      next.notifications = next.notifications.filter(
        (notification) =>
          !(notification.owner === me.username && notification.requestId) &&
          !(notification.owner === them.username && notification.actor === me.username && notification.kind === 'follow_request'),
      )
      pushAudit(next, me.username, 'Blocked member', them.username, 'Block removed follow relationships between the accounts.')
    })
  })
}

export function unblockMember(actor: string | null, username: string): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const exists = state.blocks.some(
      (block) => block.blocker === me.username && block.blocked === username,
    )
    if (!exists) fail('INVALID', 'You have not blocked this member.')
    mutate((next) => {
      next.blocks = next.blocks.filter(
        (block) => !(block.blocker === me.username && block.blocked === username),
      )
      pushAudit(next, me.username, 'Unblocked member', username, 'Block removed.')
    })
  })
}

export function blockedMembers(actor: string | null) {
  if (!actor) return []
  return state.blocks
    .filter((block) => block.blocker === actor)
    .map((block) => ({
      block,
      profile: state.profiles[block.blocked],
    }))
    .filter((entry): entry is { block: (typeof state.blocks)[number]; profile: MemberProfile } => Boolean(entry.profile))
}

export function reportMember(
  actor: string | null,
  username: string,
  reason: ReportReason,
  description: string,
): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    const them = requireTarget(username)
    if (me.username === them.username) fail('SELF_ACTION', 'You cannot report your own account.')
    if (!REPORT_REASONS.includes(reason)) fail('INVALID', 'Choose a report reason.')
    if (description.length > 1000) fail('INVALID', 'Keep the description under 1,000 characters.')
    mutate((next) => {
      const report: Report = {
        id: uid('report'),
        reporter: me.username,
        reported: them.username,
        reason,
        description: description.trim(),
        status: 'pending',
        createdAt: now(),
      }
      next.reports.unshift(report)
      pushAudit(next, me.username, 'Reported member', them.username, reason)
    })
  })
}

export function allReports(actor: string | null): Report[] {
  const me = actor ? state.profiles[actor] : undefined
  if (!me || me.role !== 'admin') return []
  return [...state.reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function reviewReport(
  actor: string | null,
  reportId: string,
  status: 'reviewed' | 'dismissed',
): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    if (me.role !== 'admin') fail('FORBIDDEN', 'Only administrators can review reports.')
    const report = state.reports.find((item) => item.id === reportId)
    if (!report) fail('NOT_FOUND', 'That report could not be found.')
    mutate((next) => {
      next.reports = next.reports.map((item) =>
        item.id === reportId
          ? { ...item, status, reviewedBy: me.username, reviewedAt: now() }
          : item,
      )
      pushAudit(
        next,
        me.username,
        status === 'reviewed' ? 'Resolved member report' : 'Dismissed member report',
        report.reported,
        report.reason,
      )
    })
  })
}

export function auditLog(actor: string | null) {
  const me = actor ? state.profiles[actor] : undefined
  if (!me || me.role !== 'admin') return []
  return state.audit
}

/* ------------------------------------------------------------------ */
/* Followers, following and follow requests                            */
/* ------------------------------------------------------------------ */

export function listFollowers(actor: string | null, username: string): SocialResult<MemberSearchItem[]> {
  return runData(() => {
    const access = accessProfile(actor, username)
    if (access.status === 'not_found') fail('NOT_FOUND', 'This member could not be found.')
    if (!access.isOwner && !(access.status === 'ok' && access.visible.socialLists)) {
      fail('FORBIDDEN', 'This member keeps their follower list private.')
    }
    return state.follows
      .filter((follow) => follow.following === username)
      .filter((follow) => !isBlockedPair(actor, follow.follower))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((follow) => state.profiles[follow.follower])
      .filter((profile): profile is MemberProfile => Boolean(profile) && !profile!.suspended)
      .map((profile) => summaryItem(actor, profile))
  })
}

export function listFollowing(actor: string | null, username: string): SocialResult<MemberSearchItem[]> {
  return runData(() => {
    const access = accessProfile(actor, username)
    if (access.status === 'not_found') fail('NOT_FOUND', 'This member could not be found.')
    if (!access.isOwner && !(access.status === 'ok' && access.visible.socialLists)) {
      fail('FORBIDDEN', 'This member keeps their following list private.')
    }
    return state.follows
      .filter((follow) => follow.follower === username)
      .filter((follow) => !isBlockedPair(actor, follow.following))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((follow) => state.profiles[follow.following])
      .filter((profile): profile is MemberProfile => Boolean(profile) && !profile!.suspended)
      .map((profile) => summaryItem(actor, profile))
  })
}

export type RequestView = {
  id: string
  createdAt: string
  direction: 'incoming' | 'outgoing'
  profile: MemberSearchItem
}

export function requestViews(actor: string | null): { incoming: RequestView[]; outgoing: RequestView[] } {
  if (!actor) return { incoming: [], outgoing: [] }
  const map = (request: FollowRequest, direction: 'incoming' | 'outgoing'): RequestView | null => {
    const counterpart = direction === 'incoming' ? request.from : request.to
    const profile = state.profiles[counterpart]
    if (!profile || isBlockedPair(actor, counterpart)) return null
    return {
      id: request.id,
      createdAt: request.createdAt,
      direction,
      profile: summaryItem(actor, profile),
    }
  }
  return {
    incoming: state.requests
      .filter((request) => request.to === actor && request.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((request) => map(request, 'incoming'))
      .filter((view): view is RequestView => Boolean(view)),
    outgoing: state.requests
      .filter((request) => request.from === actor && request.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((request) => map(request, 'outgoing'))
      .filter((view): view is RequestView => Boolean(view)),
  }
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function notificationsFor(username: string | null): SocialNotification[] {
  if (!username) return []
  return state.notifications
    .filter((notification) => notification.owner === username)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function unreadSocialCount(username: string | null) {
  return notificationsFor(username).filter((notification) => !notification.read).length
}

export function markSocialNotificationsRead(username: string | null, id?: string) {
  if (!username) return
  mutate((next) => {
    next.notifications = next.notifications.map((notification) =>
      notification.owner === username && (!id || notification.id === id)
        ? { ...notification, read: true }
        : notification,
    )
  })
}

/* ------------------------------------------------------------------ */
/* Profile and privacy settings                                        */
/* ------------------------------------------------------------------ */

export type ProfilePatch = {
  displayName?: string
  username?: string
  tagline?: string
  bio?: string
  skills?: string[]
  interests?: string[]
  github?: string
  linkedin?: string
  website?: string
  course?: string
  year?: string
}

function cleanList(list: string[] | undefined, max: number) {
  if (!list) return undefined
  return Array.from(
    new Set(
      list
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, max)
        .map((item) => item.slice(0, 40)),
    ),
  )
}

export function updateProfile(actor: string | null, patch: ProfilePatch): SocialResult<string> {
  return runData(() => {
    const me = requireActor(actor)
    const displayName = patch.displayName?.trim()
    if (displayName !== undefined && (displayName.length < 2 || displayName.length > 80)) {
      fail('INVALID', 'Display name must be between 2 and 80 characters.')
    }
    if (patch.tagline && patch.tagline.length > 120) fail('INVALID', 'Keep your tagline under 120 characters.')
    if (patch.bio && patch.bio.length > 700) fail('INVALID', 'Keep your bio under 700 characters.')

    const requestedUsername = patch.username?.trim().toLowerCase()
    if (requestedUsername && requestedUsername !== me.username) {
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(requestedUsername)) {
        fail(
          'INVALID',
          'Usernames use 3–30 lowercase letters, numbers or hyphens and cannot start or end with a hyphen.',
        )
      }
      if (state.profiles[requestedUsername]) fail('USERNAME_TAKEN', 'That username is already in use.')
    }

    const nextUsername = requestedUsername || me.username

    mutate((next) => {
      const updated: MemberProfile = {
        ...me,
        displayName: displayName ?? me.displayName,
        fullName: displayName && !me.fullName ? displayName : me.fullName,
        username: nextUsername,
        tagline: patch.tagline ?? me.tagline,
        bio: patch.bio ?? me.bio,
        skills: cleanList(patch.skills, 12) ?? me.skills,
        interests: cleanList(patch.interests, 10) ?? me.interests,
        github: patch.github ?? me.github,
        linkedin: patch.linkedin ?? me.linkedin,
        website: patch.website ?? me.website,
        course: patch.course ?? me.course,
        year: patch.year ?? me.year,
        updatedAt: now(),
      }
      if (nextUsername === me.username) {
        next.profiles[nextUsername] = updated
        return
      }
      delete next.profiles[me.username]
      next.profiles[nextUsername] = updated
      next.follows = next.follows.map((follow) => ({
        ...follow,
        follower: follow.follower === me.username ? nextUsername : follow.follower,
        following: follow.following === me.username ? nextUsername : follow.following,
      }))
      next.requests = next.requests.map((request) => ({
        ...request,
        from: request.from === me.username ? nextUsername : request.from,
        to: request.to === me.username ? nextUsername : request.to,
      }))
      next.blocks = next.blocks.map((block) => ({
        ...block,
        blocker: block.blocker === me.username ? nextUsername : block.blocker,
        blocked: block.blocked === me.username ? nextUsername : block.blocked,
      }))
      next.reports = next.reports.map((report) => ({
        ...report,
        reporter: report.reporter === me.username ? nextUsername : report.reporter,
        reported: report.reported === me.username ? nextUsername : report.reported,
        reviewedBy: report.reviewedBy === me.username ? nextUsername : report.reviewedBy,
      }))
      next.notifications = next.notifications.map((notification) => ({
        ...notification,
        owner: notification.owner === me.username ? nextUsername : notification.owner,
        actor: notification.actor === me.username ? nextUsername : notification.actor,
      }))
      pushAudit(next, nextUsername, 'Changed username', nextUsername, `Previously ${me.username}.`)
    })

    return nextUsername
  })
}

export type PrivacyPatch = {
  visibility?: 'public' | 'private'
  discoverable?: boolean
  sections?: Partial<VisibilityMap>
}

export function updatePrivacy(actor: string | null, patch: PrivacyPatch): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    if (patch.visibility && patch.visibility !== 'public' && patch.visibility !== 'private') {
      fail('INVALID', 'Choose public or private visibility.')
    }
    if (patch.discoverable && me.suspended) {
      fail('SUSPENDED', 'Suspended accounts cannot appear in member discovery.')
    }
    mutate((next) => {
      const current = next.profiles[me.username]
      next.profiles[me.username] = {
        ...current,
        visibility: patch.visibility ?? current.visibility,
        discoverable: patch.discoverable ?? current.discoverable,
        sections: { ...current.sections, ...(patch.sections ?? {}) },
        updatedAt: now(),
      }
    })
  })
}

export function resetPrivacyDefaults(actor: string | null): SocialResult {
  return run(() => {
    const me = requireActor(actor)
    mutate((next) => {
      next.profiles[me.username] = {
        ...next.profiles[me.username],
        sections: { ...DEFAULT_SECTIONS },
        visibility: 'private',
        discoverable: false,
        updatedAt: now(),
      }
    })
  })
}

export function profileCompletion(profile: MemberProfile) {
  const checks = [
    Boolean(profile.displayName),
    Boolean(profile.tagline),
    Boolean(profile.bio),
    profile.skills.length > 0,
    profile.interests.length > 0,
    Boolean(profile.github || profile.linkedin || profile.website),
    Boolean(profile.course),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function socialSectionVisibility(profile: MemberProfile): VisibilityMap {
  return { ...profile.sections }
}
