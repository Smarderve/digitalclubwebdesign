import { useState } from 'react'
import { ImageIcon, Images, Upload } from 'lucide-react'
import { SectionHead } from '../../components/site/primitives'
import { PageHero } from '../../components/site/hero'
import { Badge, EmptyState } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { cn } from '../../lib/utils'

const categories = ['All', 'Workshops', 'Competitions', 'Projects', 'Community']

export function Gallery() {
  const [category, setCategory] = useState('All')

  return (
    <>
      <PageHero
        layout="type"
        eyebrow="Gallery"
        title="Visual memories"
        description="Photographs and videos from club workshops, competitions and project showcases. Media is published by the club administration."
        actions={
          <ButtonLink to="/contact?topic=media" size="md" variant="brandSoft" className="bg-brand-500 text-ink-950 hover:bg-brand-400">
            Send club photographs
          </ButtonLink>
        }
        aside={
          <p className="text-[0.8125rem] leading-6 text-white/70">
            No genuine club media has been supplied for this redesign, so the gallery stays empty rather than borrowing
            stock images as club memories.
          </p>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHead title="Club media" className="mb-0" />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter gallery by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                    category === item
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <EmptyState
              icon={<Images className="h-4 w-4" aria-hidden />}
              title={category === 'All' ? 'No media published yet' : `No ${category.toLowerCase()} media yet`}
              description={
                category === 'All'
                  ? 'The current gallery records, captions and categories were not included in the supplied content, and no genuine club photographs were available to the redesign. Media appears here once approved assets are published.'
                  : 'There are no published items in this category. Try another category or view all club media.'
              }
              action={
                category !== 'All' ? (
                  <Button variant="outline" size="sm" onClick={() => setCategory('All')}>
                    Show all media
                  </Button>
                ) : (
                  <ButtonLink to="/contact?topic=media" variant="outline" size="sm" iconRight={<Upload className="h-3.5 w-3.5" />}>
                    Share approved media
                  </ButtonLink>
                )
              }
              className="py-16"
            />
          </div>
          <p className="mt-2 text-center text-[0.6875rem] text-ink-400">
            No stock or generated photographs are used in place of real club activity imagery.
          </p>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="What belongs here"
            title="A record of the work, not decoration"
            description="Gallery records are organised by the activity they document, with a caption and date supplied by the club."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { title: 'Workshops & sessions', text: 'Photos from weekly sessions, bootcamps and technical workshops.' },
              { title: 'Competitions', text: 'Challenge briefings, judging sessions and award moments.' },
              { title: 'Projects & community', text: 'Project showcases, team working sessions and community meetups.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5">
                <ImageIcon className="h-4 w-4 text-brand-700" aria-hidden />
                <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-editorial flex flex-col items-start justify-between gap-5 rounded-lg border border-line bg-white p-6 sm:flex-row sm:items-center">
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
