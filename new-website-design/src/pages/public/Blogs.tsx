import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, PenLine, Search } from 'lucide-react'
import { ARTICLES, ARTICLE_CATEGORIES, POPULAR_TOPICS } from '../../data/site'
import type { Article } from '../../data/site'
import { PageNotFoundInline, TypeCover } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Alert, Badge, EmptyState, Pagination } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Input } from '../../components/ui/field'
import { ArticleCard } from '../../components/site/cards'
import { cn, formatDate } from '../../lib/utils'

const PER_PAGE = 6

const blogsHero = media(
  '/images/development/pair-programming',
  'Two developers discussing code on a screen',
  'Stock photograph · Pexels.',
)

export function Blogs() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const featured = ARTICLES[2]

  const filtered = ARTICLES.filter((article) => {
    const matchesQuery =
      !query.trim() ||
      `${article.title} ${article.excerpt} ${article.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory = category === 'All' || article.category === category
    return matchesQuery && matchesCategory
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const resetFilters = () => {
    setQuery('')
    setCategory('All')
    setPage(1)
  }

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Digital Club blog"
        description="Explore tech insights, tutorials and stories from our community of developers and innovators."
        media={blogsHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[300px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Write with the club</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Members and mentors contribute tutorials and technical notes. Pitch an article to the communications team.
            </p>
            <div className="mt-3">
              <ButtonLink to="/contact?topic=blog" variant="outline" size="sm" iconRight={<PenLine className="h-3.5 w-3.5" />}>
                Pitch an article
              </ButtonLink>
            </div>
          </div>
        }
      />

      <section className="border-b border-line" data-reveal>
        <div className="container-editorial py-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <Link to={`/blogs/${featured.slug}`} className="group block overflow-hidden rounded-lg border border-line">
              <TypeCover title={featured.title} label={featured.category} index="No. 03" className="min-h-[280px]" />
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
                <span aria-hidden>·</span>
                <span>{featured.readingTime ?? 'Article'}</span>
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

      <section className="section">
        <div className="container-editorial grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">All articles</p>
                <h2 className="mt-2 text-h1 text-ink-950">Latest writing</h2>
              </div>
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
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter articles by category">
              {['All', ...ARTICLE_CATEGORIES].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => {
                    setCategory(item)
                    setPage(1)
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                    category === item
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                >
                  {item}
                  <span className={cn('ml-1.5 tabular text-[0.625rem]', category === item ? 'text-brand-200' : 'text-ink-400')}>
                    {item === 'All' ? ARTICLES.length : ARTICLES.filter((article) => article.category === item).length}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-[0.75rem] text-ink-500" role="status">
              {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              {query || category !== 'All' ? ' match your filters' : ''}
            </p>

            <div className="mt-2">
              {visible.length ? (
                visible.map((article, index) => (
                  <ArticleCard key={article.slug} article={article} index={(currentPage - 1) * PER_PAGE + index} />
                ))
              ) : (
                <EmptyState
                  title="No articles found"
                  description="Try a different search term or category. All published articles are listed by date."
                  action={
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  }
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
                  <li key={topic} className="rounded-[4px] border border-line bg-white px-2 py-1 text-[0.6875rem] text-ink-600">
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
                  <dt className="text-ink-500">Editorial contact</dt>
                  <dd className="text-right font-medium text-ink-900">admin@digitalclub.kiut.ac.tz</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Signature</dt>
                  <dd className="text-right font-medium text-ink-900">KIUT Digital Club</dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.625rem] leading-4 text-ink-400">
                Author names were not published for these articles. The editorial mailbox is shown instead of inventing a
                byline.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

export function BlogPost() {
  const { slug } = useParams()
  const article = ARTICLES.find((item) => item.slug === slug)

  if (!article) {
    return <PageNotFoundInline title="Article not found" description="This article does not exist or is not published." />
  }

  const related = ARTICLES.filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3)

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
              <Badge tone="green">{article.category}</Badge>
              <span className="text-[0.75rem] text-ink-500">{formatDate(article.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {article.readingTime ? (
                <>
                  <span aria-hidden className="text-ink-300">·</span>
                  <span className="text-[0.75rem] text-ink-500">{article.readingTime}</span>
                </>
              ) : null}
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
              <span>By the KIUT Digital Club editorial team</span>
              <span aria-hidden>·</span>
              <a href="mailto:admin@digitalclub.kiut.ac.tz" className="underline decoration-ink-300 underline-offset-4 hover:text-brand-800">
                admin@digitalclub.kiut.ac.tz
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container-editorial py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,760px)_1fr] lg:items-start">
          <article>
            {article.bodyNote ? (
              <Alert tone="info" title="Article text in this prototype" className="mb-6">
                {article.bodyNote}
              </Alert>
            ) : null}

            {article.body ? (
              <div className="prose-club">
                {article.body.map((block, index) => {
                  if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>
                  if (block.type === 'h3') return <h3 key={index}>{block.text}</h3>
                  if (block.type === 'p') {
                    if (block.text?.startsWith('Tags:')) {
                      return (
                        <p key={index} className="mt-8 text-[0.75rem] text-ink-500">
                          {block.text}
                        </p>
                      )
                    }
                    return <p key={index}>{block.text}</p>
                  }
                  if (block.type === 'code') return <pre key={index} className="my-4 overflow-x-auto rounded-md bg-ink-950 p-4 font-mono text-[0.75rem] leading-6 text-brand-300"><code>{block.text}</code></pre>
                  if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>
                  if (block.type === 'ul')
                    return (
                      <ul key={index}>
                        {block.items?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )
                  if (block.type === 'ol')
                    return (
                      <ol key={index}>
                        {block.items?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    )
                  return null
                })}
              </div>
            ) : (
              <div className="prose-club">
                <p>{article.excerpt}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-line pt-5">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-[4px] border border-line bg-ink-50 px-2 py-1 text-[0.6875rem] text-ink-600">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
            <p className="mt-6 text-[0.8125rem] font-medium text-ink-600">KIUT Digital Club — KIUT Digital Club</p>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-lg border border-line bg-canvas p-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">In this article</p>
              <ul className="mt-2 space-y-1.5">
                {article.body
                  ?.filter((block) => block.type === 'h2')
                  .map((block) => (
                    <li key={block.text} className="text-[0.75rem] leading-5 text-ink-600">
                      {block.text}
                    </li>
                  ))}
                {!article.body ? <li className="text-[0.75rem] text-ink-500">Excerpt only</li> : null}
              </ul>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Keep reading</p>
              <div className="mt-2 space-y-2">
                {ARTICLES.filter((item) => item.slug !== article.slug)
                  .slice(0, 2)
                  .map((item) => (
                    <Link key={item.slug} to={`/blogs/${item.slug}`} className="block text-[0.75rem] leading-5 text-ink-600 hover:text-brand-800">
                      {item.title}
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>

        {related.length ? (
          <div className="mt-14">
            <h2 className="text-h3 text-ink-950">Related articles</h2>
            <div className="mt-4">
              {related.map((item, index) => (
                <ArticleCard key={item.slug} article={item} index={index} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

export type { Article }
export default Blogs
