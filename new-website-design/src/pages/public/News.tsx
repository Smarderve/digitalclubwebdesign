import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { PageNotFoundInline, SectionHead } from '../../components/site/primitives'
import { PageHero, clubMedia } from '../../components/site/hero'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'
import { formatDate } from '../../lib/utils'

const newsHero = clubMedia('/images/club/api-audience', 'Club members at the API Conference 2026')

export function News() {
  const { data, loading, error } = usePublicData(() => publicApi.news({ per_page: 50 }), [])
  const items = data?.items ?? []

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        title="Club news"
        description="Announcements, results and notices from KIUT Digital Club, published by the club office."
        media={newsHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[300px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Live records</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              These notices are read from the club database. Only published records appear; nothing is filled in with
              sample copy.
            </p>
          </div>
        }
      />

      <section className="section" data-reveal>
        <div className="container-editorial">
          <SectionHead title="Latest news" className="mb-0" />

          <div className="mt-6">
            {error ? (
              <Alert tone="warning" title="News could not be loaded">
                {error}
              </Alert>
            ) : loading ? (
              <p role="status" className="py-10 text-center text-[0.8125rem] text-ink-400">
                Loading news…
              </p>
            ) : items.length ? (
              <div className="divide-y divide-line border-y border-line">
                {items.map((item) => (
                  <article key={item.id} className="grid gap-3 py-6 sm:grid-cols-[120px_1fr_auto] sm:items-start">
                    <div className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">
                      <Badge tone="green">Published</Badge>
                      <p className="mt-2">{item.published_at ? formatDate(item.published_at) : ''}</p>
                    </div>
                    <div>
                      <h2 className="text-[1.0625rem] font-semibold text-ink-950">
                        <Link to={`/news/${item.id}`} className="hover:text-brand-800">
                          {item.title}
                        </Link>
                      </h2>
                      <p className="mt-1.5 max-w-[72ch] text-[0.8125rem] leading-6 text-ink-500">{item.summary}</p>
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
                title="No news published yet"
                description="Published notices will appear here once the club adds them."
              />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export function NewsDetail() {
  const { id = '' } = useParams()
  const { data: item, loading, error } = usePublicData(() => publicApi.newsDetail(id), [id])

  if (loading) {
    return (
      <div className="container-editorial py-12 text-center text-[0.8125rem] text-ink-400" role="status">
        Loading notice…
      </div>
    )
  }

  if (error || !item) {
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
          <Badge tone="green">Published notice</Badge>
          <span className="text-[0.75rem] text-ink-400">
            {item.published_at ? formatDate(item.published_at) : ''}
          </span>
        </div>
        <h1 className="mt-4 text-display-lg text-ink-950">{item.title}</h1>
        <div className="prose-club mt-6">
          {(item.body || '').split(/\n\n+/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-[0.8125rem] text-ink-500">
            Posted by {item.author.display_name || 'the club office'}.
          </p>
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
