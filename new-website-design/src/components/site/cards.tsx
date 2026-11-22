import { Link } from 'react-router-dom'
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import { Avatar, Badge } from '../ui'
import type { Article } from '../../data/site'
import { TypeCover } from './primitives'

export function ArticleCard({ article, index }: { article: Article; index?: number }) {
  return (
    <Link
      to={`/blogs/${article.slug}`}
      className="group grid gap-4 border-b border-line py-6 transition-colors first:pt-0 hover:bg-ink-50/40 sm:grid-cols-[92px_1fr_auto] sm:items-start sm:gap-6 sm:px-2"
    >
      <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400 sm:block">
        <span className="text-brand-700">{article.category}</span>
        {typeof index === 'number' ? <span className="tabular sm:mt-1 sm:block">No. {String(index + 1).padStart(2, '0')}</span> : null}
      </div>
      <div className="min-w-0">
        <h3 className="max-w-[52ch] text-[1.0625rem] font-semibold leading-snug tracking-tight text-ink-950 group-hover:text-brand-800">
          {article.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-[0.8125rem] leading-6 text-ink-500">{article.excerpt}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-400">
          <span>{formatDate(article.date)}</span>
          {article.readingTime ? (
            <>
              <span aria-hidden>·</span>
              <span>{article.readingTime}</span>
            </>
          ) : null}
          {article.views ? (
            <>
              <span aria-hidden>·</span>
              <span className="tabular">{article.views.toLocaleString()} views</span>
            </>
          ) : null}
        </div>
      </div>
      <ArrowUpRight className="hidden h-4 w-4 text-ink-300 transition-colors group-hover:text-brand-700 sm:mt-1 sm:block" aria-hidden />
    </Link>
  )
}

export function ProjectFeature({
  title,
  summary,
  technologies,
  to,
  metrics,
  index,
  note,
}: {
  title: string
  summary: string
  technologies: string[]
  to: string
  metrics?: { label: string; value: string }[]
  index: string
  note?: string
}) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-[0.92fr_1.08fr]">
      <TypeCover title={title} label="Featured project" index={index} className="min-h-[260px] lg:min-h-full" />
      <div className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Featured</Badge>
            <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">KIUT Digital Club</span>
          </div>
          <h3 className="mt-3 text-h2 text-ink-950">{title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-7 text-ink-600">{summary}</p>
          {technologies.length ? (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
              {technologies.map((tech) => (
                <li key={tech} className="rounded-[4px] border border-line bg-ink-50 px-2 py-1 text-[0.6875rem] font-medium text-ink-600">
                  {tech}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-6">
          {metrics?.length ? (
            <dl className="mb-5 grid grid-cols-2 gap-y-3 border-y border-line py-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{metric.label}</dt>
                  <dd className="mt-0.5 text-[0.9375rem] font-semibold tabular text-ink-900">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <Link
              to={to}
              className="group inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
            >
              View project
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            {note ? <span className="text-[0.625rem] text-ink-400">{note}</span> : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export function EventRow({
  title,
  date,
  time,
  location,
  description,
  tags,
  to,
  status,
  actionLabel,
}: {
  title: string
  date: string
  time?: string
  location: string
  description?: string
  tags?: string[]
  to?: string
  status?: { label: string; tone: 'green' | 'amber' | 'neutral' | 'red' }
  actionLabel?: string
}) {
  const dateValue = new Date(date)
  return (
    <article className="grid gap-5 border-b border-line py-6 last:border-b-0 sm:grid-cols-[104px_1fr_auto] sm:items-start">
      <div className="flex items-baseline gap-2 sm:block">
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-ink-950 tabular">
          {dateValue.toLocaleDateString('en-GB', { day: '2-digit' })}
        </p>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500 sm:mt-1">
          {dateValue.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
        </p>
        {time ? <p className="mt-1 text-[0.75rem] text-ink-400 tabular">{time}</p> : null}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[1.0625rem] font-semibold text-ink-950">{title}</h3>
          {status ? (
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          ) : null}
        </div>
        {description ? <p className="mt-1.5 max-w-[64ch] text-[0.8125rem] leading-6 text-ink-500">{description}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            {location}
          </span>
          {time ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-ink-400" aria-hidden />
              {time}
            </span>
          ) : null}
        </div>
        {tags?.length ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag} className="rounded-[4px] border border-line px-1.5 py-0.5 text-[0.625rem] font-medium text-ink-500">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="inline-flex h-8 items-center justify-center gap-1.5 self-start rounded-sm border border-ink-200 px-3 text-[0.75rem] font-medium text-ink-700 transition-colors hover:border-brand-600 hover:text-brand-800"
        >
          {actionLabel ?? 'View event'}
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      ) : null}
    </article>
  )
}

export function LeaderCard({
  name,
  position,
  programme,
  year,
  bio,
  className,
}: {
  name: string
  position: string
  programme: string
  year?: string
  bio?: string
  className?: string
}) {
  return (
    <article className={cn('flex flex-col border-t border-line pt-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <Avatar name={name} size="lg" />
        <span className="rounded-[4px] border border-brand-200 bg-brand-50 px-2 py-0.5 text-[0.625rem] font-semibold text-brand-800">
          {position}
        </span>
      </div>
      <h3 className="mt-4 text-[1.0625rem] font-semibold leading-snug text-ink-950">{name}</h3>
      <p className="mt-1 text-[0.75rem] text-ink-500">
        {programme}
        {year ? ` · ${year}` : ''}
      </p>
      {bio ? <p className="mt-3 line-clamp-3 text-[0.8125rem] leading-6 text-ink-600">“{bio}”</p> : null}
    </article>
  )
}

export function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="flex h-full flex-col justify-between border-t border-line pt-5">
      <blockquote className="text-[0.9375rem] leading-7 text-ink-700">“{quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <Avatar name={name} size="sm" />
        <div>
          <p className="text-[0.8125rem] font-semibold text-ink-900">{name}</p>
          <p className="text-[0.6875rem] text-ink-500">{role}</p>
        </div>
      </figcaption>
    </figure>
  )
}
