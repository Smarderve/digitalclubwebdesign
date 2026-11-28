import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, PenLine, Search } from 'lucide-react'
import type { Article } from '../../data/site'
import { POPULAR_TOPICS } from '../../data/site'
import { PageNotFoundInline, TypeCover } from '../../components/site/primitives'
import { BlogsMasthead } from '../../components/site/mastheads'
import { Alert, Badge, EmptyState, Pagination } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Input } from '../../components/ui/field'
import { ArticleCard } from '../../components/site/cards'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi, type PublicBlog } from '../../lib/publicApi'
import { cn, formatDate } from '../../lib/utils'

const PER_PAGE = 6
function asArticle(blog: PublicBlog): Article {
  return {
    slug: blog.slug,
    title: blog.title,
    category: blog.tags[0] ?? 'Article',
    date: blog.published_at ?? '',
    views: blog.views,
    excerpt: blog.excerpt,
    tags: blog.tags,
    body: null,
  }
}

export function Blogs() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error } = usePublicData(() => publicApi.blogs({ per_page: 50 }), [])
  const blogs = data?.items ?? []
  const articles = blogs.map(asArticle)

  const featuredBlog = blogs[0]
  const featured = featuredBlog ? asArticle(featuredBlog) : null

  const filtered = articles.filter((article) => {
    return (
      !query.trim() ||
      `${article.title} ${article.excerpt} ${article.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
    )
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <>
      <BlogsMasthead />

      {error ? (
        <div className="container-editorial py-10">
          <Alert tone="warning" title="Articles could not be loaded">
            {error}
          </Alert>
        </div>
      ) : null}

      {featured ? (
        <section className="border-b border-line" data-reveal>
          <div className="container-editorial py-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <Link to={`/blogs/${featured.slug}`} className="group block overflow-hidden rounded-lg border border-line">
                {featuredBlog.cover_url ? (
                  <img src={featuredBlog.cover_url} alt={featured.title} className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <TypeCover title={featured.title} label={featured.category} index="No. 01" className="min-h-[280px]" />
                )}
              </Link>
              <div>
                <p className="eyebrow">Featured article</p>
                <h2 className="mt-3 text-display-md text-ink-950">
                  <Link to={`/blogs/${featured.slug}`} className="hover:text-brand-800">
                    {featured.title}
                  </Link>
                </h2>
                <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">{featured.excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-400">
                  <Badge tone="green">{featured.category}</Badge>
                  <span>{formatDate(featured.date)}</span>
                  {featured.views ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular">{featured.views.toLocaleString()} views</span>
                    </>
                  ) : null}
                </div>
                <div className="mt-5">
                  <Link
                    to={`/blogs/${featured.slug}`}
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                  >
                    Read article
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container-editorial grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div>
              <p className="eyebrow">All articles</p>
              <h2 className="mt-2 text-h1 text-ink-950">Latest writing</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <label htmlFor="blog-search" className="sr-only">
                  Search articles
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
                <Input
                  id="blog-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search articles by title, excerpt or tag…"
                  className="pl-9"
                />
              </div>
            </div>

            <p className="mt-4 text-[0.75rem] text-ink-500" role="status">
              {loading ? 'Loading articles…' : `${filtered.length} ${filtered.length === 1 ? 'article' : 'articles'}`}
              {query ? ' match your search' : ''}
            </p>

            <div className="mt-2">
              {visible.length ? (
                visible.map((article, index) => (
                  <ArticleCard key={article.slug} article={article} index={(currentPage - 1) * PER_PAGE + index} />
                ))
              ) : (
                <EmptyState
                  title={loading ? 'Loading articles…' : 'No articles found'}
                  description="Try a different search term. All published articles are listed by date."
                  className="mt-4"
                />
              )}
            </div>

            {visible.length ? (
              <div className="mt-5">
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  onChange={setPage}
                  totalLabel={`Page ${currentPage} of ${pageCount}`}
                />
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-line bg-canvas p-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Popular topics</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {POPULAR_TOPICS.map((topic) => (
                  <li key={topic} className="rounded-[4px] border border-line bg-surface px-2 py-1 text-[0.6875rem] text-ink-600">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Article metadata</p>
              <dl className="mt-3 space-y-2 text-[0.75rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Publisher</dt>
                  <dd className="text-right font-medium text-ink-900">KIUT Digital Club</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Records</dt>
                  <dd className="text-right font-medium text-ink-900">{loading ? '—' : `${blogs.length} published`}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.625rem] leading-4 text-ink-400">
                Views are counted by the server each time an article is opened.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

export function BlogPost() {
  const { slug = '' } = useParams()
  const { data: article, loading, error } = usePublicData(() => publicApi.blogPost(slug), [slug])
  const { data: recent } = usePublicData(() => publicApi.blogs({ per_page: 4 }), [])

  if (loading) {
    return (
      <div className="container-editorial py-12 text-center text-[0.8125rem] text-ink-400" role="status">
        Loading article…
      </div>
    )
  }

  if (error || !article) {
    return <PageNotFoundInline title="Article not found" description="This article does not exist or is not published." />
  }

  const others = (recent?.items ?? []).filter((item) => item.slug !== article.slug)

  return (
    <>
      <div className="border-b border-line bg-canvas/50">
        <div className="container-editorial py-8 lg:py-10">
          <Link to="/blogs" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            All articles
          </Link>
          <div className="mt-5 max-w-[860px]">
            <div className="flex flex-wrap items-center gap-2">
              {article.tags[0] ? <Badge tone="green">{article.tags[0]}</Badge> : null}
              <span className="text-[0.75rem] text-ink-500">
                {article.published_at ? formatDate(article.published_at, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </span>
              {article.views ? (
                <>
                  <span aria-hidden className="text-ink-300">·</span>
                  <span className="text-[0.75rem] text-ink-500 tabular">{article.views.toLocaleString()} views</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-4 text-display-lg text-ink-950">{article.title}</h1>
            <p className="mt-4 max-w-[70ch] text-lead text-ink-600">{article.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[0.75rem] text-ink-500">
              <span>By {article.author || 'the KIUT Digital Club editorial team'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-editorial py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,760px)_1fr] lg:items-start">
          <article>
            <div
              className="prose-club"
              // Server-sanitised by app/api/sanitize.py before it reaches the browser.
              dangerouslySetInnerHTML={{ __html: article.body_html_sanitised }}
            />

            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-line pt-5">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-[4px] border border-line bg-ink-50 px-2 py-1 text-[0.6875rem] text-ink-600">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-lg border border-line p-4">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Keep reading</p>
              <div className="mt-2 space-y-2">
                {others.length ? (
                  others.map((item) => (
                    <Link key={item.slug} to={`/blogs/${item.slug}`} className="block text-[0.75rem] leading-5 text-ink-600 hover:text-brand-800">
                      {item.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-[0.75rem] text-ink-500">More articles will appear here.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

export type { Article }
export default Blogs
