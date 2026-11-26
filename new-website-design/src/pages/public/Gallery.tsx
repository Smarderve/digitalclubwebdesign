import { useState } from 'react'
import { ImageIcon, Images, Upload } from 'lucide-react'
import { SectionHead } from '../../components/site/primitives'
import { PageHero } from '../../components/site/hero'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'
import { cn, formatDate } from '../../lib/utils'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Photographs' },
  { value: 'video', label: 'Videos' },
]

export function Gallery() {
  const [category, setCategory] = useState('all')
  const { data, loading, error } = usePublicData(() => publicApi.gallery({ per_page: 50 }), [])
  const items = data?.items ?? []
  const shown = category === 'all' ? items : items.filter((item) => item.category === category)

  return (
    <>
      <PageHero
        layout="type"
        eyebrow="Gallery"
        title="Visual memories"
        description="Photographs and videos from club workshops, competitions and project showcases."
        actions={
          <ButtonLink to="/contact?topic=media" size="md" variant="brandSoft" className="bg-brand-500 text-ink-950 hover:bg-brand-400">
            Send club photographs
          </ButtonLink>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHead title="Club media" className="mb-0" />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter gallery by category">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={category === item.value}
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                    category === item.value
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-ink-200 bg-surface text-ink-600 hover:border-ink-300',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {error ? (
              <Alert tone="warning" title="Media could not be loaded">
                {error}
              </Alert>
            ) : loading ? (
              <p role="status" className="py-10 text-center text-[0.8125rem] text-ink-400">
                Loading media…
              </p>
            ) : shown.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                    {item.category === 'video' ? (
                      <video src={item.image_url ?? undefined} controls className="aspect-[4/3] w-full bg-ink-950 object-cover" />
                    ) : (
                      <img
                        src={item.thumb_url ?? item.image_url ?? ''}
                        alt={item.title || 'Club media'}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}
                    <figcaption className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="text-[0.875rem] font-medium text-ink-900">{item.title || 'Club media'}</p>
                        <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                          {item.captured_at ? formatDate(item.captured_at, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </p>
                      </div>
                      <Badge tone="outline">{item.category === 'video' ? 'Video' : 'Photo'}</Badge>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Images className="h-4 w-4" aria-hidden />}
                title={category === 'all' ? 'No media published yet' : `No ${category === 'video' ? 'videos' : 'photographs'} yet`}
                description="Approved club media appears here once it is published."
                action={
                  <ButtonLink to="/contact?topic=media" variant="outline" size="sm" iconRight={<Upload className="h-3.5 w-3.5" />}>
                    Share approved media
                  </ButtonLink>
                }
                className="py-16"
              />
            )}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead eyebrow="What belongs here" title="A record of the work, not decoration" />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { title: 'Workshops & sessions', text: 'Photos from weekly sessions, bootcamps and technical workshops.' },
              { title: 'Competitions', text: 'Challenge briefings, judging sessions and award moments.' },
              { title: 'Projects & community', text: 'Project showcases, team working sessions and community meetups.' },
            ].map((item) => (
              <div key={item.title} className="bg-surface p-5">
                <ImageIcon className="h-4 w-4 text-brand-700" aria-hidden />
                <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-editorial flex flex-col items-start justify-between gap-5 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Share your moments</p>
            <h2 className="mt-2 text-h2 text-ink-950">Were you at a club activity?</h2>
            <p className="mt-2 max-w-[60ch] text-[0.8125rem] leading-6 text-ink-500">
              Send approved photographs to the communications team. The club publishes media through the administration
              panel, with permission from the people in the photograph.
            </p>
          </div>
          <ButtonLink to="/contact?topic=media" className="shrink-0" iconRight={<Upload className="h-4 w-4" />}>
            Contact the team
          </ButtonLink>
        </div>
      </section>
    </>
  )
}

export default Gallery
