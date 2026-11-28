import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { usePublicTheme } from './features/settings/preferences'
import { ToastProvider } from './context/ToastContext'
import { TooltipProvider } from './components/ui/tooltip'
import { SiteHeader } from './components/site/SiteHeader'
import { SiteFooter } from './components/site/SiteFooter'
import { AppShell, type NavSection } from './components/app/AppShell'
import { memberApi } from './lib/memberApi'
import {
  Activity,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  FileText,
  FolderGit2,
  Gauge,
  GraduationCap,
  Handshake,
  House,
  IdCard,
  Images,
  Layers,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
  Vote,
  Wallet,
} from 'lucide-react'
import { Home } from './pages/public/Home'
import { About } from './pages/public/About'
import { Projects } from './pages/public/Projects'
import { Topics } from './pages/public/Topics'
import { Learn } from './pages/public/Learn'
import { Leaders } from './pages/public/Leaders'
import { Events } from './pages/public/Events'
import { EventRsvp } from './pages/public/EventRsvp'
import { News, NewsDetail } from './pages/public/News'
import { Blogs, BlogPost } from './pages/public/Blogs'
import { Gallery } from './pages/public/Gallery'
import { Contact } from './pages/public/Contact'
import { Members, Students, Alumni } from './pages/public/Members'
import { MemberProfilePage } from './pages/public/MemberProfile'
import { Elections, ElectionDetail } from './pages/public/Elections'
import { VerifyId } from './pages/public/VerifyId'
import { AuthLayout } from './pages/auth/AuthLayout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { NotFound } from './pages/public/NotFound'
import { MemberDashboard } from './pages/member/Dashboard'
import { LearningHub } from './pages/member/LearningHub'
import { ActivitiesHub } from './pages/member/ActivitiesHub'
import { MemberProfile } from './pages/member/Profile'
import { EditProfile } from './pages/member/EditProfile'
import { ChangePassword } from './pages/member/ChangePassword'
import { MyProjects } from './pages/member/MyProjects'
import { ProjectForm } from './pages/member/ProjectForm'
import { DigitalId } from './pages/member/DigitalId'
import { Rewards } from './pages/member/Rewards'
import { Membership } from './pages/member/Membership'
import { Teams } from './pages/member/Teams'
import { CompetitionDetail, CompetitionLeaderboard } from './pages/member/Competitions'
import { CompetitionsHub } from './pages/member/CompetitionHub'
import { RankingsHub } from './pages/member/Rankings'
import { MemberSettings } from './pages/member/Settings'
import { PointsTransactions } from './pages/member/PointsTransactions'
import { MemberNotifications, MemberNotificationDetail } from './pages/member/Notifications'
import { MemberEvents } from './pages/member/Events'
import { SessionsTimetable, SessionInstructors, SessionReport } from './pages/member/Sessions'
import { Warmups, WarmupDetail, WarmupTake, WarmupResult, WarmupLeaderboard } from './pages/member/Warmups'
import { MemberElections, MemberElectionDetail, ElectionApply, ElectionVote, ElectionResults } from './pages/member/Elections'
import { QuizmasterDashboard, QuizBuilder, CreateQuiz } from './pages/quizmaster/Quizmaster'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminReports } from './pages/admin/Reports'
import { AdminMembers, AdminMemberDetail } from './pages/admin/Members'
import { AdminMemberIds, AdminScanId } from './pages/admin/MemberIds'
import { AdminPayments } from './pages/admin/Payments'
import { AdminFinance, AdminFinancialPeriod, AdminFinancialCategories, AdminFinancialReports } from './pages/admin/Finance'
import { AdminRewards, AdminTrophies } from './pages/admin/Rewards'
import { AdminNews } from './pages/admin/News'
import { AdminBlogs } from './pages/admin/Blogs'
import { AdminLeaders } from './pages/admin/Leaders'
import { AdminGallery } from './pages/admin/Gallery'
import { AdminEvents, AdminEventCheckin } from './pages/admin/Events'
import { AdminRsvps } from './pages/admin/Rsvps'
import { AdminSessions, AdminSessionReports } from './pages/admin/Sessions'
import { AdminElections, AdminPositions, AdminElectionDetail } from './pages/admin/Elections'
import { AdminCompetitions, AdminCompetitionDetail } from './pages/admin/Competitions'
import { AdminQuizzes, AdminQuizDetail, AdminQuizAnalytics, AdminQuizSettings } from './pages/admin/Quizzes'
import { AdminProjects } from './pages/admin/Projects'
import { AdminTechnologies } from './pages/admin/Technologies'
import { AdminTeams, AdminTeamDetail } from './pages/admin/Teams'
import { AdminMessages, AdminMessageDetail } from './pages/admin/Messages'
import { AdminNewsletter } from './pages/admin/Newsletter'
import { AdminSettings, AdminProfile } from './pages/admin/Settings'
import { KiutbotProvider, KiutbotWidget } from './features/kiutbot'

/* Member navigation: five primary destinations with Settings anchored at the
   bottom of the rail. Profile, digital ID, membership, rewards and elections are
   reached contextually; notifications stay in the navbar bell. Every route that
   existed before is preserved for existing links. */
const memberNav: NavSection[] = [
  {
    label: '',
    items: [
      { label: 'Home', to: '/member', icon: House, end: true },
      {
        label: 'Learning Hub',
        to: '/member/learning',
        icon: BookOpenCheck,
        match: ['/member/learning', '/member/quizzes', '/member/sessions'],
      },
      {
        label: 'Activities',
        to: '/member/activities',
        icon: Activity,
        match: ['/member/activities', '/member/projects'],
      },
      {
        label: 'Competitions',
        to: '/member/competitions',
        icon: Trophy,
        match: ['/member/competitions'],
      },
      {
        label: 'Rankings',
        to: '/member/rankings',
        icon: BarChart3,
        match: ['/member/rankings', '/member/teams'],
      },
    ],
  },
]

const adminNav: NavSection[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true }] },
  {
    label: 'People',
    items: [
      { label: 'Members', to: '/admin/members', icon: UserRound },
      { label: 'Member IDs', to: '/admin/member-ids', icon: IdCard },
      { label: 'Scan ID', to: '/admin/scan-id', icon: ScanLine },
      { label: 'Reports', to: '/admin/reports', icon: TriangleAlert },
    ],
  },
  {
    label: 'Programmes',
    items: [
      { label: 'Events', to: '/admin/events', icon: CalendarDays },
      { label: 'RSVPs', to: '/admin/rsvps', icon: ClipboardList },
      { label: 'Sessions', to: '/admin/sessions', icon: BookOpenCheck },
      { label: 'Competitions', to: '/admin/competitions', icon: Trophy },
      { label: 'Elections', to: '/admin/elections', icon: Vote },
      { label: 'Quizzes', to: '/admin/quizzes', icon: Sparkles },
      { label: 'Teams', to: '/admin/teams', icon: Users },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'News', to: '/admin/news', icon: Newspaper },
      { label: 'Blogs', to: '/admin/blogs', icon: FileText },
      { label: 'Leaders', to: '/admin/leaders', icon: BadgeCheck },
      { label: 'Gallery', to: '/admin/gallery', icon: Images },
      { label: 'Projects', to: '/admin/projects', icon: FolderGit2 },
      { label: 'Technologies', to: '/admin/technologies', icon: Layers },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: Wallet },
      { label: 'Finance', to: '/admin/financial', icon: FileBarChart2 },
      { label: 'Rewards', to: '/admin/rewards/history', icon: Award },
      { label: 'Messages', to: '/admin/messages', icon: MessageSquare },
      { label: 'Newsletter', to: '/admin/newsletter', icon: Mail },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Admin profile', to: '/admin/profile', icon: ShieldCheck }],
  },
]

const quizmasterNav: NavSection[] = [
  { label: 'Quizmaster', items: [{ label: 'Dashboard', to: '/quizmaster', icon: LayoutDashboard, end: true }, { label: 'Create quiz', to: '/quizmaster/quizzes/create', icon: Sparkles }] },
  { label: 'Member area', items: [{ label: 'Member dashboard', to: '/member', icon: Gauge }, { label: 'Warmups', to: '/member/quizzes', icon: BookOpenCheck }] },
]

function PublicLayout() {
  const { pathname } = useLocation()

  /* Public pages use the shared day/night mode: fresh by day, midnight by night. */
  usePublicTheme()

  /* Scroll reveals: elements opt in with data-reveal. Re-observed after each route change. */
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!nodes.length) return

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.setAttribute('data-revealed', 'true'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute('data-revealed', 'true')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, status } = useAuth()
  /* The session is read from the server on every page load. Until that answer
     arrives, redirecting would bounce a signed-in member to the login page. */
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas" role="status">
        <span className="text-[0.8125rem] text-ink-400">Checking your session…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/auth/login" replace />
  if (!roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="max-w-[480px] rounded-lg border border-line bg-white p-8 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-ink-400" aria-hidden />
          <h1 className="mt-3 text-h3 text-ink-950">You don't have access to this area</h1>
          <p className="mt-2 text-[0.8125rem] leading-6 text-ink-500">
            This section requires a different account role. Sign in as a member or administrator from the
            login screen.
          </p>
          <a href="/member" className="mt-5 inline-flex h-9 items-center rounded-sm bg-brand-700 px-4 text-[0.8125rem] font-medium text-white">
            Go to member dashboard
          </a>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

/** The notification badge counts what the server reports; it never shows a sample number. */
function useUnreadNotifications() {
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    let active = true
    memberApi
      .notifications()
      .then((page) => {
        if (active) setUnread(page.unread)
      })
      .catch(() => {
        if (active) setUnread(0)
      })
    return () => {
      active = false
    }
  }, [])
  return unread
}

function MemberLayout() {
  const unread = useUnreadNotifications()
  return (
    <AppShell
      nav={memberNav}
      areaLabel="Member dashboard"
      areaTone="member"
      homeTo="/member"
      profileTo="/member/profile"
      notificationsTo="/member/notifications"
      settingsTo="/member/settings"
      unread={unread}
    />
  )
}

function AdminLayout() {
  return (
    <AppShell
      nav={adminNav}
      areaLabel="Admin dashboard"
      areaTone="admin"
      homeTo="/admin"
      profileTo="/admin/profile"
      notificationsTo="/admin/messages"
      settingsTo="/admin/settings"
      unread={4}
    />
  )
}

function QuizmasterLayout() {
  const unread = useUnreadNotifications()
  return (
    <AppShell
      nav={quizmasterNav}
      areaLabel="Quizmaster"
      areaTone="quizmaster"
      homeTo="/quizmaster"
      profileTo="/member/profile"
      notificationsTo="/member/notifications"
      unread={unread}
    />
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <TooltipProvider>
            {/* KIUTBOT is mounted once, globally, exactly like the original
                widget in the site-wide base template. */}
            <KiutbotProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/about" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/leaders" element={<Leaders />} />
                <Route path="/members" element={<Members />} />
                <Route path="/members/:username" element={<MemberProfilePage />} />
                <Route path="/students" element={<Students />} />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/elections" element={<Elections />} />
                <Route path="/elections/:id" element={<ElectionDetail />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id/rsvp" element={<EventRsvp />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/:slug" element={<BlogPost />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/verify-id" element={<VerifyId />} />
                <Route path="/verify-id/:memberId" element={<VerifyId />} />
              </Route>

              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password/:token" element={<ResetPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
              </Route>

              <Route
                path="/member"
                element={
                  <RequireRole roles={['member', 'admin', 'quizmaster']}>
                    <MemberLayout />
                  </RequireRole>
                }
              >
                <Route index element={<MemberDashboard />} />
                <Route path="settings" element={<MemberSettings />} />
                <Route path="members/:username" element={<MemberProfilePage embedded />} />
                <Route path="learning" element={<LearningHub />} />
                <Route path="activities" element={<ActivitiesHub />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="projects" element={<MyProjects />} />
                <Route path="projects/add" element={<ProjectForm />} />
                <Route path="projects/edit/:id" element={<ProjectForm />} />
                <Route path="digital-id" element={<DigitalId />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="membership" element={<Membership />} />
                <Route path="teams" element={<Teams />} />
                <Route path="competitions" element={<CompetitionsHub />} />
                <Route path="competitions/weekly" element={<CompetitionsHub />} />
                <Route path="competitions/monthly" element={<CompetitionsHub />} />
                <Route path="competitions/:id" element={<CompetitionDetail />} />
                <Route path="competitions/:id/leaderboard" element={<CompetitionLeaderboard />} />
                <Route path="rankings" element={<RankingsHub />} />
                <Route path="rankings/points-transactions" element={<PointsTransactions />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="notifications/:id" element={<MemberNotificationDetail />} />
                <Route path="events" element={<MemberEvents />} />
                <Route path="sessions/timetable" element={<SessionsTimetable />} />
                <Route path="sessions/instructors" element={<SessionInstructors />} />
                <Route path="sessions/:id/report" element={<SessionReport />} />
                <Route path="quizzes" element={<Warmups />} />
                <Route path="quizzes/:id" element={<WarmupDetail />} />
                <Route path="quizzes/:id/take" element={<WarmupTake />} />
                <Route path="quizzes/:id/result" element={<WarmupResult />} />
                <Route path="quizzes/:id/leaderboard" element={<WarmupLeaderboard />} />
                <Route path="elections" element={<MemberElections />} />
                <Route path="elections/:id" element={<MemberElectionDetail />} />
                <Route path="elections/:id/apply/:positionId" element={<ElectionApply />} />
                <Route path="elections/:id/vote" element={<ElectionVote />} />
                <Route path="elections/:id/results" element={<ElectionResults />} />
              </Route>

              <Route
                path="/admin"
                element={
                  <RequireRole roles={['admin']}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="members/:id" element={<AdminMemberDetail />} />
                <Route path="member-ids" element={<AdminMemberIds />} />
                <Route path="scan-id" element={<AdminScanId />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="financial" element={<AdminFinance />} />
                <Route path="financial/categories" element={<AdminFinancialCategories />} />
                <Route path="financial/reports" element={<AdminFinancialReports />} />
                <Route path="financial/:periodId" element={<AdminFinancialPeriod />} />
                <Route path="rewards/history" element={<AdminRewards />} />
                <Route path="rewards/trophies" element={<AdminTrophies />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="leaders" element={<AdminLeaders />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:eventId/checkin" element={<AdminEventCheckin />} />
                <Route path="rsvps" element={<AdminRsvps />} />
                <Route path="sessions" element={<AdminSessions />} />
                <Route path="sessions/reports" element={<AdminSessionReports />} />
                <Route path="elections" element={<AdminElections />} />
                <Route path="elections/positions" element={<AdminPositions />} />
                <Route path="elections/:id" element={<AdminElectionDetail />} />
                <Route path="competitions" element={<AdminCompetitions />} />
                <Route path="competitions/:id" element={<AdminCompetitionDetail />} />
                <Route path="quizzes" element={<AdminQuizzes />} />
                <Route path="quizzes/analytics" element={<AdminQuizAnalytics />} />
                <Route path="quizzes/settings" element={<AdminQuizSettings />} />
                <Route path="quizzes/:id" element={<AdminQuizDetail />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="technologies" element={<AdminTechnologies />} />
                <Route path="teams" element={<AdminTeams />} />
                <Route path="teams/:id" element={<AdminTeamDetail />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="messages/:batchId" element={<AdminMessageDetail />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              <Route
                path="/quizmaster"
                element={
                  <RequireRole roles={['quizmaster', 'admin']}>
                    <QuizmasterLayout />
                  </RequireRole>
                }
              >
                <Route index element={<QuizmasterDashboard />} />
                <Route path="quizzes/create" element={<CreateQuiz />} />
                <Route path="quizzes/:id/builder" element={<QuizBuilder />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <KiutbotWidget />
            </KiutbotProvider>
          </TooltipProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
