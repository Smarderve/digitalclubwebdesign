import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { NEWS } from '../../data/site'
import { PageNotFoundInline, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'

const categories = ['All', 'Hackathon', 'Achievement', 'General']

const newsHero = media(
  '/images/events/speaker',
  'A speaker presenting to an audience at a conference',
  'Stock photograph · Pexels. Not a KIUT Digital Club event.',
)

export function News() {
  const [category, setCategory] = useState('All')
  const filtered = category === 'All' ? NEWS : NEWS.filter((item) => item.category === category)

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        title="Club news"
        description="Announcements, results and notices from KIUT Digital Club. Time-sensitive notices are marked with their status."
        media={newsHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[300px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Archive notice</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              The most recent published notice refers to 2025. It is kept as an archive record rather than presented as a
              current call to action.
            </p>
          </div>
        }
      />

      <section className="section" data-reveal>
        <div className="container-editorial">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHead title="Latest news" className="mb-0" />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter news by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={
                    category === item
                      ? 'rounded-full border border-brand-700 bg-brand-700 px-3 py-1.5 text-[0.75rem] font-medium text-white'
                      : 'rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-ink-600 hover:border-ink-300'
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {filtered.length ? (
              <div className="divide-y divide-line border-y border-line">
                {filtered.map((item) => (
                  <article key={item.id} className="grid gap-3 py-6 sm:grid-cols-[120px_1fr_auto] sm:items-start">
                    <div className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">
                      <Badge tone={item.archived ? 'neutral' : 'green'}>{item.archived ? 'Archived' : item.category}</Badge>
                      <p className="mt-2">{formatDate(item.date)}</p>
                    </div>
                    <div>
                      <h2 className="text-[1.0625rem] font-semibold text-ink-950">
                        <Link to={`/news/${item.id}`} className="hover:text-brand-800">
                          {item.title}
                        </Link>
                      </h2>
                      <p className="mt-1.5 max-w-[72ch] text-[0.8125rem] leading-6 text-ink-500">{item.excerpt}</p>
                    </div>
                    <Link
                      to={`/news/${item.id}`}
                      className="self-start text-[0.75rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                    >
                      Read notice
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Newspaper className="h-4 w-4" aria-hidden />}
                title="No news in this category"
                description="Published notices will appear here. Try another category to see other updates."
                action={
                  <Button variant="outline" size="sm" onClick={() => setCategory('All')}>
                    Show all news
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export function NewsDetail() {
  const { id } = useParams()
  const item = NEWS.find((news) => String(news.id) === id)

  if (!item) {
    return <PageNotFoundInline title="Notice not found" description="This news record does not exist or is no longer published." />
  }

  return (
    <div className="container-editorial py-8 lg:py-12">
      <Link to="/news" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All news
      </Link>
      <article className="mt-6 max-w-[760px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Archived notice</Badge>
          <Badge tone="outline">{item.category}</Badge>
          <span className="text-[0.75rem] text-ink-400">{formatDate(item.date)}</span>
        </div>
        <h1 className="mt-4 text-display-lg text-ink-950">{item.title}</h1>
        <Alert tone="warning" title="This notice is kept for the record" className="mt-6">
          It refers to the 2025 hackathon. The club has not confirmed whether registration remains open, so this page does
          not present a registration action. Contact the club for the current status.
        </Alert>
        <div className="prose-club mt-6">
          {item.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-[0.8125rem] text-ink-500">Looking for current updates? Technical notes and tutorials live on the club blog.</p>
          <Link
            to="/blogs"
            className="text-[0.75rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
          >
            Read the blog
          </Link>
        </div>
      </article>
    </div>
  )
}

export default News
