export type ProfileVisibility = 'public' | 'private'

/** Fields that a member can expose or hide individually. These are the only
 * profile sections that ever leave the account record. Contact details,
 * student numbers and credentials are deliberately not part of this model. */
export type SectionKey =
  | 'fullName'
  | 'course'
  | 'bio'
  | 'skills'
  | 'activity'
  | 'achievements'
  | 'projects'
  | 'membership'
  | 'socialLists'
  | 'socialLinks'

export type VisibilityMap = Record<SectionKey, boolean>

export type MemberProfile = {
  username: string
  memberId: string
  displayName: string
  fullName: string
  tagline: string
  bio: string
  skills: string[]
  interests: string[]
  github: string
  linkedin: string
  website: string
  course: string
  year: string
  joined: string
  points: number
  role: 'member' | 'admin' | 'quizmaster'
  status: 'student' | 'alumni'
  /** Inactive demo accounts are treated as suspended by the service layer. */
  suspended: boolean
  visibility: ProfileVisibility
  discoverable: boolean
  sections: VisibilityMap
  updatedAt: string
}

export type Follow = {
  follower: string
  following: string
  createdAt: string
}

export type FollowRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export type FollowRequest = {
  id: string
  from: string
  to: string
  status: FollowRequestStatus
  createdAt: string
  updatedAt: string
}

export type Block = {
  blocker: string
  blocked: string
  createdAt: string
}

export type ReportReason =
  | 'Harassment or bullying'
  | 'Impersonation'
  | 'Inappropriate profile content'
  | 'Spam or scam'
  | 'Other'

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export type Report = {
  id: string
  reporter: string
  reported: string
  reason: ReportReason
  description: string
  status: ReportStatus
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

export type SocialNotificationKind =
  | 'follow'
  | 'follow_request'
  | 'request_approved'
  | 'request_declined'
  | 'follow_removed'

export type SocialNotification = {
  id: string
  owner: string
  kind: SocialNotificationKind
  title: string
  body: string
  actor: string
  requestId?: string
  href?: string
  createdAt: string
  read: boolean
}

export type AuditEntry = {
  id: string
  actor: string
  action: string
  target: string
  detail: string
  at: string
}

export type RateLimitMeta = {
  search: number[]
  follow: number[]
}

export type SocialState = {
  version: 1
  profiles: Record<string, MemberProfile>
  follows: Follow[]
  requests: FollowRequest[]
  blocks: Block[]
  reports: Report[]
  notifications: SocialNotification[]
  audit: AuditEntry[]
  meta: RateLimitMeta
}

export type RelationshipState =
  | 'self'
  | 'following'
  | 'request_pending'
  | 'requested_you'
  | 'blocked'
  | 'none'

export type Relationship = {
  state: RelationshipState
  isFollower: boolean
  hasPendingRequest: boolean
  incomingRequestId?: string
  outgoingRequestId?: string
}

export type ProfileAccessStatus = 'ok' | 'private' | 'suspended' | 'not_found' | 'unavailable'

export type ProfileAccess = {
  status: ProfileAccessStatus
  profile?: MemberProfile
  isOwner: boolean
  relationship: Relationship
  counts: { followers: number; following: number } | null
  visible: VisibilityMap
}

export type ActivityKind =
  | 'warmup'
  | 'session'
  | 'competition'
  | 'project'
  | 'achievement'
  | 'event'
  | 'membership'
  | 'joined'

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  label: string
  detail?: string
  date: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  date: string
  category: string
  verified: boolean
}

export type ProfileProject = {
  id: number
  title: string
  description: string
  technologies: string[]
  link: string
  visibility: 'Public' | 'Private'
  status: string
  updated: string
}

export type LearningSummary = {
  warmups?: number
  competitions?: number
  points?: number
  rank?: number
  bestRank?: number
  team?: string
}

export type MemberSearchItem = {
  username: string
  displayName: string
  tagline: string | null
  skills: string[]
  isPrivate: boolean
  relationship: RelationshipState
  countsVisible: boolean
  followers: number | null
}

export type SocialErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SELF_ACTION'
  | 'ALREADY_FOLLOWING'
  | 'ALREADY_REQUESTED'
  | 'NOT_FOLLOWING'
  | 'NO_REQUEST'
  | 'BLOCKED'
  | 'SUSPENDED'
  | 'RATE_LIMITED'
  | 'INVALID'
  | 'USERNAME_TAKEN'

export type SocialResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: SocialErrorCode }
