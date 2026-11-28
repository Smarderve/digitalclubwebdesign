import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { PageNotFoundInline, SectionHead } from '../../components/site/primitives'
import { NewsMasthead } from '../../components/site/mastheads'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'
import { formatDate } from '../../lib/utils'

export function News() {
  const { data, loading, error } = usePublicData(() => publicApi.news({ per_page: 50 }), [])
  const items = data?.items ?? []

  return (
    <>
      <NewsMasthead />

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
              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <article className="border-t-2 border-ink-900/70 pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="green">Lead notice</Badge>
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
                      {items[0].published_at ? formatDate(items[0].published_at) : ''}
                    </span>
                  </div>
                  <h2 className="mt-3 max-w-[22ch] text-h1 text-ink-950">
                    <Link to={`/news/${items[0].id}`} className="hover:text-brand-800">
                      {items[0].title}
                    </Link>
                  </h2>
                  <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-600">{items[0].summary}</p>
                  <Link
                    to={`/news/${items[0].id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                  >
                    Read the notice
                  </Link>
                </article>

                <div className="border-t border-line">
                  {items.slice(1).map((item) => (
                    <article key={item.id} className="grid gap-1 border-b border-line py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink-400">
                          {item.published_at ? formatDate(item.published_at) : ''}
                        </p>
                        <span className="text-[0.625rem] text-ink-300">Notice</span>
                      </div>
                      <h3 className="text-[0.9375rem] font-semibold leading-6 text-ink-950">
                        <Link to={`/news/${item.id}`} className="hover:text-brand-800">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-[0.75rem] leading-5 text-ink-500">{item.summary}</p>
                    </article>
                  ))}
                  {items.length === 1 ? (
                    <p className="py-4 text-[0.75rem] text-ink-400">No further notices have been published.</p>
                  ) : null}
                </div>
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
