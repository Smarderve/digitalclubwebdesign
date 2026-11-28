import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, Flame, Medal, Trophy, Users } from 'lucide-react'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Card, CardBody, CardHeader, Progress, StatusBadge } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate, formatDayMonth } from '../../lib/utils'

export function MemberDashboard() {
  const { data, loading, error, reload } = useMemberData(
    () =>
      Promise.all([memberApi.dashboard(), memberApi.timetable(), memberApi.competitions('weekly')]).then(
        ([dashboard, timetable, weekly]) => ({ dashboard, timetable, weekly }),
      ),
    [],
  )

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your club activity at a glance." />
        <LoadingBlock rows={5} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your club activity at a glance." />
        <ErrorBlock
          message={error ?? 'Your dashboard could not be loaded. Please try again.'}
          onRetry={reload}
        />
      </>
    )
  }

  const { dashboard, timetable, weekly } = data
  const activeQuiz = dashboard.active_quiz
  const nextEvent = dashboard.next_event
  const openCompetition = weekly.active[0]
  const sessions = timetable.days.flatMap((day) => day.sessions).slice(0, 3)
  const membershipActive = dashboard.membership.state === 'valid'

  return (
    <>
      <PageHeader
        title={`Welcome back, ${dashboard.greeting_name}`}
        actions={
          <>
            <ButtonLink to="/member/competitions" variant="outline" size="sm" iconLeft={<Trophy className="h-3.5 w-3.5" />}>
              Competitions
            </ButtonLink>
            <ButtonLink to="/member/learning" size="sm" iconLeft={<BookOpenCheck className="h-3.5 w-3.5" />}>
              Learning Hub
            </ButtonLink>
          </>
        }
        badge={
          <Badge tone={membershipActive ? 'green' : 'outline'} dot>
            {membershipActive ? 'Membership active' : 'Membership inactive'}
          </Badge>
        }
      />

      {/* The single points-and-rank summary. Detailed standings live in Rankings. */}
      <Card className="mt-5">
        <CardBody>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">
                  <Flame className="h-3.5 w-3.5 text-brand-700" aria-hidden />
                  Club points
                </p>
                <p className="mt-1 text-[2rem] font-semibold leading-none tabular tracking-tight text-ink-950">
                  {dashboard.points}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">
                  <Medal className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                  Club rank
                </p>
                <p className="mt-1 text-[2rem] font-semibold leading-none tabular tracking-tight text-ink-950">
                  #{dashboard.rank}
                </p>
                <p className="mt-1 text-[0.6875rem] text-ink-400">
                  {dashboard.tier ? dashboard.tier.name : 'No tier yet'}
                </p>
              </div>
            </div>
            <Link
              to="/member/rankings"
              className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800 hover:underline"
            >
              View club rankings
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 max-w-[440px]">
            {dashboard.next_tier ? (
              <Progress
                value={dashboard.points}
                max={dashboard.next_tier.points_required}
                label={`Next tier ${dashboard.next_tier.name} at ${dashboard.next_tier.points_required} points`}
              />
            ) : (
              <p className="text-[0.75rem] text-ink-500">You have reached the highest club tier.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="min-w-0 space-y-5">
          {/* Next up: the next things the member can act on right now. */}
          <Card>
            <CardHeader title="Next up" />
            <div className="divide-y divide-line">
              {activeQuiz ? (
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex gap-3">
                    <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
                    <div>
                      <p className="text-[0.8125rem] font-semibold text-ink-900">{activeQuiz.title}</p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-500">
                        {activeQuiz.topic ?? 'Warmup quiz'} · {activeQuiz.duration_minutes} minutes
                        {activeQuiz.scheduled_start_at
                          ? ` · opened ${formatDate(activeQuiz.scheduled_start_at)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <ButtonLink
                    to={`/member/quizzes/${activeQuiz.id}`}
                    size="sm"
                    variant="outline"
                    iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Open warmup
                  </ButtonLink>
                </div>
              ) : (
                <div className="px-5 py-4 text-[0.75rem] text-ink-500">
                  No warmup quiz is open for you right now.
                </div>
              )}

              {nextEvent ? (
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-ink-600" aria-hidden />
                    <div>
                      <p className="text-[0.8125rem] font-semibold text-ink-900">{nextEvent.title}</p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-500">
                        {formatDate(nextEvent.starts_at, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {nextEvent.venue ? ` · ${nextEvent.venue}` : ''}
                      </p>
                    </div>
                  </div>
                  <ButtonLink
                    to="/member/events"
                    size="sm"
                    variant="ghost"
                    iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    View event
                  </ButtonLink>
                </div>
              ) : (
                <div className="px-5 py-4 text-[0.75rem] text-ink-500">
                  No member events are scheduled right now.
                </div>
              )}
            </div>
          </Card>

          {/* This week: the schedule preview only. */}
          <Card>
            <CardHeader
              title={timetable.week ? `This week · ${timetable.week.title}` : 'This week'}
              description={
                timetable.week
                  ? `${formatDayMonth(timetable.week.week_start ?? '')}–${formatDayMonth(timetable.week.week_end ?? '')}`
                  : 'No session week has been published yet.'
              }
              action={
                <Link to="/member/sessions/timetable" className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                  Full timetable
                </Link>
              }
            />
            {sessions.length ? (
              <div className="divide-y divide-line">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="w-[52px] shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-400">
                        {formatDate(session.date, { weekday: 'short' })}
                      </span>
                      <div>
                        <p className="text-[0.8125rem] font-medium text-ink-900">{session.topic}</p>
                        <p className="text-[0.6875rem] text-ink-500">
                          {session.start_time ? formatDate(session.start_time, { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {session.end_time ? `–${formatDate(session.end_time, { hour: '2-digit', minute: '2-digit' })}` : ''}
                          {session.location ? ` · ${session.location}` : ''} · {session.instructor.display_name}
                        </p>
                      </div>
                    </div>
                    <Badge tone={session.category === 'core' ? 'amber' : 'outline'} className="self-start">
                      {session.category ?? session.mode ?? 'Session'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-[0.75rem] text-ink-500">
                The published timetable has no sessions to show yet.
              </div>
            )}
            <div className="border-t border-line px-5 py-3">
              <Link
                to="/member/sessions/instructors"
                className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800"
              >
                <Users className="h-3.5 w-3.5" aria-hidden />
                See session instructors
              </Link>
            </div>
          </Card>

          {/* Active competition preview: one record, linked to its brief and leaderboard. */}
          {openCompetition ? (
            <Card>
              <CardHeader
                title="Active competition"
                description={`${openCompetition.frequency === 'weekly' ? 'Weekly' : 'Monthly'} · Level ${openCompetition.level}${openCompetition.category ? ` · ${openCompetition.category}` : ''}`}
                action={<StatusBadge status={openCompetition.status} />}
              />
              <CardBody className="space-y-3">
                <p className="text-[0.9375rem] font-semibold text-ink-950">{openCompetition.title}</p>
                {openCompetition.reasons.length ? (
                  <p className="text-[0.8125rem] leading-6 text-ink-600">{openCompetition.reasons[0]}</p>
                ) : null}
                <p className="text-[0.6875rem] text-ink-400">
                  Closes {formatDate(openCompetition.ends_at)} · {openCompetition.submission_type}
                  {openCompetition.enrolled ? ' · enrolled' : ' · not enrolled yet'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ButtonLink to={`/member/competitions/${openCompetition.id}`} size="sm" variant="outline">
                    View brief
                  </ButtonLink>
                  {openCompetition.leaderboard_available ? (
                    <ButtonLink to={`/member/competitions/${openCompetition.id}/leaderboard`} size="sm" variant="ghost">
                      Leaderboard
                    </ButtonLink>
                  ) : null}
                  <Link
                    to="/member/competitions"
                    className="inline-flex items-center gap-1 self-center text-[0.75rem] font-medium text-brand-800 hover:underline"
                  >
                    All competitions
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-5">
          {/* Recent rewards preview; the full history lives in the account area. */}
          <Card>
            <CardHeader
              title="Recent rewards"
              action={
                <Link to="/member/rankings/points-transactions" className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                  History
                </Link>
              }
            />
            <div className="divide-y divide-line">
              {dashboard.recent_rewards.length ? (
                dashboard.recent_rewards.slice(0, 4).map((reward) => (
                  <div key={reward.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[0.75rem] font-medium text-ink-800">{reward.reason}</p>
                      <p className="mt-0.5 text-[0.625rem] text-ink-400">
                        {reward.type} · {formatDate(reward.awarded_at)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.75rem] font-semibold tabular text-brand-700">
                      {reward.points > 0 ? '+' : ''}
                      {reward.points}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-4 text-[0.75rem] text-ink-500">No points have been awarded yet.</p>
              )}
            </div>
          </Card>

          {/* Profile completion reminder only; the editor stays in Profile. */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.8125rem] font-semibold text-ink-900">Profile completion</p>
                <span className="text-[0.75rem] font-medium tabular text-ink-600">
                  {dashboard.profile_completion.percent}%
                </span>
              </div>
              <Progress value={dashboard.profile_completion.percent} />
              <p className="text-[0.75rem] leading-5 text-ink-500">
                {dashboard.profile_completion.missing_fields.length
                  ? `Add ${dashboard.profile_completion.missing_fields.join(', ')} to complete your profile.`
                  : 'Every required profile field is filled in.'}
              </p>
              <ButtonLink to="/member/edit-profile" variant="outline" size="sm" className="w-full">
                {dashboard.profile_completion.required ? 'Complete profile' : 'Edit profile'}
              </ButtonLink>
            </CardBody>
          </Card>

          {/* Team preview comes from the member's actual team record. */}
          <Card>
            <CardBody className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                <p className="text-[0.8125rem] font-semibold text-ink-900">
                  {dashboard.team ? dashboard.team.name : 'No team yet'}
                </p>
                {dashboard.team ? <Badge tone="outline">{dashboard.team.members_count} members</Badge> : null}
              </div>
              <p className="text-[0.6875rem] text-ink-500">
                {dashboard.team
                  ? dashboard.team.is_leader
                    ? 'You lead this team.'
                    : 'You are a member of this team.'
                  : 'Join an open team to take part in team competitions.'}
              </p>
              <Link
                to="/member/teams"
                className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-brand-800 hover:underline"
              >
                Open team hub
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[0.8125rem] font-semibold text-ink-900">Membership</p>
                <StatusBadge status={membershipActive ? 'approved' : 'pending'} />
              </div>
              <p className="text-[0.75rem] leading-5 text-ink-500">
                {dashboard.membership.valid_until
                  ? `Valid through ${formatDate(dashboard.membership.valid_until)}.`
                  : 'No membership payment has been recorded yet.'}
              </p>
              <div className="flex gap-2">
                <ButtonLink to="/member/digital-id" variant="outline" size="sm" className="flex-1">
                  Digital ID
                </ButtonLink>
                <ButtonLink to="/member/membership" variant="ghost" size="sm" className="flex-1">
                  Details
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default MemberDashboard
