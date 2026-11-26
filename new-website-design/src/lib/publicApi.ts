/**
 * Public website reads (`/api/v1/public/*`, contract PU1–PU23).
 *
 * These endpoints are unauthenticated and identical for every visitor, so the
 * responses may be cached by the browser or a CDN. The rest of the client —
 * identity, CSRF, mutations — stays in `lib/api.ts`.
 */

import { apiRequest } from './api'

export type PublicStats = {
  members: { total: number; students: number; alumni: number }
  projects: { total: number; published: number }
  events: { total: number; upcoming: number }
  competitions: { total: number }
  sessions: { total: number }
}

export type PublicProject = {
  id: number
  title: string
  summary: string
  cover_url: string | null
  technologies: string[]
  owner_display_name: string
  year: string | null
}

export type PublicProjectDetail = PublicProject & {
  description: string
  links: { label: string; url: string }[]
  created_at: string | null
}

export type PublicNews = {
  id: number
  title: string
  summary: string
  image_url: string | null
  published_at: string | null
}

export type PublicNewsDetail = PublicNews & {
  body: string
  author: { display_name: string }
}

export type PublicBlog = {
  id: number
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  published_at: string | null
  views: number
  author: string
  tags: string[]
}

export type PublicBlogDetail = PublicBlog & { body_html_sanitised: string }

export type PublicEvent = {
  id: number
  title: string
  slug: string
  starts_at: string | null
  ends_at: string | null
  venue: string | null
  category: string
  cover_url: string | null
  description: string
  target_audience?: string
  rsvp: { state: 'open' | 'closed'; opens_at: string | null; closes_at: string | null }
}

export type PublicEventDetail = PublicEvent & {
  requirements: string[]
  capacity: number | null
  registered_count: number
}

export type PublicGalleryItem = {
  id: number
  title: string
  image_url: string | null
  thumb_url: string | null
  category: string
  captured_at: string | null
}

export type PublicLeader = {
  id: number
  name: string
  position: string
  programme: string | null
  year: string | null
  photo_url: string | null
  bio: string | null
  term: string | null
}

export type PublicMember = {
  public_slug: string
  display_name: string
  course: string | null
  year: string | null
  status: string | null
  avatar_url: string | null
}

export type PublicMemberProfile = PublicMember & {
  joined_year: number | null
  bio: string | null
  skills: string[]
  interests: string[]
  links: Record<string, string>
  projects: { id: number; title: string; summary: string; technologies: string[]; cover_url: string | null; year: string | null }[]
  achievements: { name: string; description: string | null; earned_at: string | null }[]
  learning: Record<string, unknown>
}

export type PublicElection = {
  id: number
  slug: string
  title: string
  term: string | null
  status: string
  phase: string
  applications: { open: string | null; close: string | null }
  voting: { open: string | null; close: string | null }
  positions_count: number
}

export type PublicElectionDetail = PublicElection & {
  description: string | null
  eligibility: string
  positions: {
    id: number
    title: string
    seats: number
    description: string | null
    candidates: {
      id: number
      display_name: string
      year: string | null
      manifesto: string | null
      photo_url: string | null
    }[]
  }[]
}

export type PublicHome = {
  stats: PublicStats
  featured_projects: PublicProject[]
  upcoming_events: PublicEvent[]
  latest_news: PublicNews[]
  latest_blog: PublicBlog[]
}

export type PublicContact = {
  address: string[]
  phone: string
  email: string
  hours: string
  social: Record<string, string>
  meeting_times: string
}

export type PublicSite = {
  club_name: string
  tagline: string
  social: Record<string, string>
  feature_flags: Record<string, boolean | number>
}

export type Pagination = { page: number; per_page: number; total: number }
export type Paginated<T> = { items: T[]; pagination: Pagination }

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

function withPagination<T>(request: () => Promise<{ data: T[]; meta?: { pagination?: Pagination } }>): Promise<Paginated<T>> {
  return request().then((body) => ({
    items: body.data ?? [],
    pagination: body.meta?.pagination ?? { page: 1, per_page: (body.data ?? []).length, total: (body.data ?? []).length },
  }))
}

export const publicApi = {
  home: () => apiRequest<PublicHome>('/public/home'),
  stats: () => apiRequest<PublicStats>('/public/stats'),

  news: (params?: Query) => withPagination<PublicNews>(() => apiRequest('/public/news' + queryString(params), { envelope: true })),
  newsDetail: (id: string) => apiRequest<PublicNewsDetail>(`/public/news/${encodeURIComponent(id)}`),

  blogs: (params?: Query) => withPagination<PublicBlog>(() => apiRequest('/public/blogs' + queryString(params), { envelope: true })),
  blogPost: (slug: string) => apiRequest<PublicBlogDetail>(`/public/blogs/${encodeURIComponent(slug)}`),

  events: (params?: Query) => withPagination<PublicEvent>(() => apiRequest('/public/events' + queryString(params), { envelope: true })),
  eventDetail: (id: string) => apiRequest<PublicEventDetail>(`/public/events/${encodeURIComponent(id)}`),
  rsvp: (id: string, input: { fullName: string; email: string; phone: string; studentId?: string; turnstileToken: string }) =>
    apiRequest<{ rsvp: { status: string } }>(`/public/events/${encodeURIComponent(id)}/rsvp`, {
      method: 'POST',
      body: {
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        student_id: input.studentId || undefined,
        turnstile_token: input.turnstileToken,
      },
    }),

  projects: (params?: Query) => withPagination<PublicProject>(() => apiRequest('/public/projects' + queryString(params), { envelope: true })),
  projectDetail: (id: string) => apiRequest<PublicProjectDetail>(`/public/projects/${encodeURIComponent(id)}`),

  gallery: (params?: Query) => withPagination<PublicGalleryItem>(() => apiRequest('/public/gallery' + queryString(params), { envelope: true })),
  leaders: () => apiRequest<PublicLeader[]>('/public/leaders'),
  topics: () =>
    apiRequest<{ topics: { id: number; name: string; slug: string; description: string | null }[]; technologies: { id: number; name: string; category: string; icon: string | null }[] }>(
      '/public/topics',
    ),

  elections: () => apiRequest<PublicElection[]>('/public/elections'),
  electionDetail: (idOrSlug: string) => apiRequest<PublicElectionDetail>(`/public/elections/${encodeURIComponent(idOrSlug)}`),

  members: (params?: Query) => withPagination<PublicMember>(() => apiRequest('/public/members' + queryString(params), { envelope: true })),
  memberProfile: (slug: string) => apiRequest<PublicMemberProfile>(`/public/members/${encodeURIComponent(slug)}`),

  verifyId: (memberNumber: string) =>
    apiRequest<{ valid: boolean; member?: { display_name: string; course: string | null; year: string | null; status: string | null; member_since: string | null; id_valid_until: string | null } }>(
      `/public/verify-id/${encodeURIComponent(memberNumber)}`,
    ),

  contact: () => apiRequest<PublicContact>('/public/contact'),
  site: () => apiRequest<PublicSite>('/public/site'),
  newsletter: (email: string) =>
    apiRequest<{ subscribed: boolean }>('/public/newsletter/subscribe', { method: 'POST', body: { email } }),
}
