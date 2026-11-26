import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, Flame, Medal, Trophy, Users } from 'lucide-react'
import { demoMember, demoMemberEvents, demoRewardHistory, demoSessions, demoCompetitions, demoQuizzes, demoTeam } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { DemoNotice } from '../../components/app/DemoBadge'
import { Badge, Card, CardBody, CardHeader, Progress, StatusBadge } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate, formatDayMonth } from '../../lib/utils'

export function MemberDashboard() {
  const activeQuiz = demoQuizzes.find((quiz) => quiz.status === 'published')
  const openCompetition = demoCompetitions.find((competition) => competition.status === 'published')
  const nextEvent = demoMemberEvents
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${demoMember.name.split(' ')[0]}`}
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
          <Badge tone="green" dot>
            {demoMember.membership.status === 'valid' ? 'Membership active' : 'Membership inactive'}
          </Badge>
        }
      />

      <DemoNotice />

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
                  {demoMember.points}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">
                  <Medal className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                  Club rank
                </p>
                <p className="mt-1 text-[2rem] font-semibold leading-none tabular tracking-tight text-ink-950">
                  #{demoMember.rank}
                </p>
                <p className="mt-1 text-[0.6875rem] text-ink-400">Best #{demoMember.bestRank}</p>
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
            <Progress value={demoMember.points} max={800} label="Next club tier at 800 points" />
          </div>
        </CardBody>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="min-w-0 space-y-5">
          {/* Next up: the next things the member can act on right now. */}
          <Card>
            <CardHeader title="Next up" />
            <div className="divide-y divide-line">
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="flex gap-3">
                  <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-ink-900">{activeQuiz?.title}</p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-500">
                      {activeQuiz?.questions} questions · {activeQuiz?.duration} minutes · closes{' '}
                      {activeQuiz ? formatDate(activeQuiz.closesAt) : ''}
                    </p>
                  </div>
                </div>
                <ButtonLink to={`/member/quizzes/${activeQuiz?.id}`} size="sm" variant="outline" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                  Open warmup
                </ButtonLink>
              </div>

              {nextEvent ? (
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-ink-600" aria-hidden />
                    <div>
                      <p className="text-[0.8125rem] font-semibold text-ink-900">{nextEvent.title}</p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-500">
                        {formatDate(nextEvent.date, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {nextEvent.location}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                        {nextEvent.rsvp === 'none' ? 'No RSVP yet' : `RSVP ${nextEvent.rsvp}`}
                      </p>
                    </div>
                  </div>
                  <ButtonLink to="/member/activities?tab=events" size="sm" variant="ghost" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                    View event
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </Card>

          {/* This week: the schedule preview only. */}
          <Card>
            <CardHeader
              title={`This week · ${demoSessions.week.label}`}
              description={`${demoSessions.week.theme} · ${formatDayMonth(demoSessions.week.start)}–${formatDayMonth(demoSessions.week.end)}`}
              action={
                <Link to="/member/learning?tab=sessions" className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                  Full timetable
                </Link>
              }
            />
            <div className="divide-y divide-line">
              {demoSessions.sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="w-[52px] shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-400">
                      {formatDate(session.date, { weekday: 'short' })}
                    </span>
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">{session.title}</p>
                      <p className="text-[0.6875rem] text-ink-500">
                        {session.start}–{session.end} · {session.venue} · {session.instructor}
                      </p>
                    </div>
                  </div>
                  <Badge tone={session.attendance === 'Required' ? 'amber' : 'outline'} className="self-start">
                    {session.attendance}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-5 py-3">
              <Link to="/member/sessions/instructors" className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
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
                description={`${openCompetition.frequency === 'weekly' ? 'Weekly' : 'Monthly'} · Level ${openCompetition.level} · ${openCompetition.category}`}
                action={<StatusBadge status={openCompetition.status} />}
              />
              <CardBody className="space-y-3">
                <p className="text-[0.9375rem] font-semibold text-ink-950">{openCompetition.title}</p>
                <p className="text-[0.8125rem] leading-6 text-ink-600">{openCompetition.description}</p>
                <p className="text-[0.6875rem] text-ink-400">
                  Closes {formatDate(openCompetition.endsAt)} · {openCompetition.submissionType} · {openCompetition.enrolled} enrolled
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ButtonLink to={`/member/competitions/${openCompetition.id}`} size="sm" variant="outline">
                    View brief
                  </ButtonLink>
                  <ButtonLink to={`/member/competitions/${openCompetition.id}/leaderboard`} size="sm" variant="ghost">
                    Leaderboard
                  </ButtonLink>
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
                <Link to="/member/profile?tab=rewards" className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                  History
                </Link>
              }
            />
            <div className="divide-y divide-line">
              {demoRewardHistory.slice(0, 4).map((reward) => (
                <div key={reward.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.75rem] font-medium text-ink-800">{reward.reason}</p>
                    <p className="mt-0.5 text-[0.625rem] text-ink-400">
                      {reward.type} · {formatDate(reward.date)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.75rem] font-semibold tabular text-brand-700">+{reward.points}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Profile completion reminder only; the editor stays in Profile. */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.8125rem] font-semibold text-ink-900">Profile completion</p>
                <span className="text-[0.75rem] font-medium tabular text-ink-600">{demoMember.profileCompletion}%</span>
              </div>
              <Progress value={demoMember.profileCompletion} />
              <p className="text-[0.75rem] leading-5 text-ink-500">
                Add your LinkedIn profile and a project demo link to complete your public profile.
              </p>
              <ButtonLink to="/member/edit-profile" variant="outline" size="sm" className="w-full">
                Complete profile
              </ButtonLink>
            </CardBody>
          </Card>

          {/* Team preview comes from the member's actual team record. */}
          <Card>
            <CardBody className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                <p className="text-[0.8125rem] font-semibold text-ink-900">{demoTeam.name}</p>
                <Badge tone="outline">{demoTeam.members.length} members</Badge>
              </div>
              <p className="text-[0.6875rem] text-ink-500">{demoTeam.tagline}</p>
              <Link
                to="/member/rankings?tab=teams"
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
                <StatusBadge status="approved" />
              </div>
              <p className="text-[0.75rem] leading-5 text-ink-500">
                Valid through {formatDate(demoMember.membership.endDate)}. Your digital ID is active.
              </p>
              <div className="flex gap-2">
                <ButtonLink to="/member/profile?tab=digital-id" variant="outline" size="sm" className="flex-1">
                  Digital ID
                </ButtonLink>
                <ButtonLink to="/member/profile?tab=membership" variant="ghost" size="sm" className="flex-1">
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
