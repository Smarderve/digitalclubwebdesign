import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, Handshake } from 'lucide-react'
import { ABOUT, ACHIEVEMENTS, CLUB_FACTS, LEADERSHIP_STRUCTURE, PARTNERS } from '../../data/site'
import { JoinBand, LinkArrow, SectionHead } from '../../components/site/primitives'
import { EditorialFigure, PageHero, media } from '../../components/site/hero'
import { Accordion } from '../../components/ui/accordion'
import { Badge } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { LeaderCard } from '../../components/site/cards'
import { LEADERS } from '../../data/site'

const aboutHero = media(
  '/images/learning/developer-portrait',
  'A developer working at a laptop by a window',
  'Stock photograph · Pexels. Not KIUT members or a club activity.',
)
const aboutLibrary = media(
  '/images/lab/lab-rows',
  'Rows of computers in a university laboratory',
  'Stock photograph · Pexels.',
)
const aboutWorkshop = media(
  '/images/learning/electronics-workshop',
  'Students working with electronic components during a hands-on workshop',
  'Stock photograph · Pexels.',
)

const mentorship = [
  { title: '1-on-1 sessions', description: 'Personalised mentoring sessions tailored to your learning goals and career aspirations.' },
  { title: 'Code reviews', description: 'Get feedback on your projects and code from experienced developers to improve your skills.' },
  { title: 'Career guidance', description: 'Receive advice on resume building, interview preparation, and career path planning.' },
  { title: 'Industry connections', description: 'Connect with alumni and professionals working at top tech companies worldwide.' },
]

export function About() {
  return (
    <>
      <PageHero
        eyebrow="About the club"
        title={ABOUT.title}
        description={ABOUT.description}
        media={aboutHero}
        actions={
          <ButtonLink to="/auth/register" size="md" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            Join the club
          </ButtonLink>
        }
        aside={
          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">At a glance</p>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-[0.6875rem] text-ink-500">University</dt>
                <dd className="text-[0.8125rem] font-medium text-ink-900">Kampala International University in Tanzania</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-ink-500">Membership</dt>
                <dd className="text-[0.8125rem] font-medium text-ink-900">Free for KIUT students</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-ink-500">Based in</dt>
                <dd className="text-[0.8125rem] font-medium text-ink-900">Gongo la Mboto, Dar es Salaam</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <LinkArrow to="/contact">Visit or contact the club</LinkArrow>
            </div>
          </div>
        }
      />

      {/* Mission and vision */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Mission & vision"
            title="Driving innovation and skill development for Tanzania's digital future"
          />
          <div className="mt-9 grid gap-10 md:grid-cols-2">
            <div className="border-t border-brand-500 pt-5">
              <p className="text-micro uppercase tracking-[0.12em] text-brand-700">Our mission</p>
              <p className="mt-3 text-[1.0625rem] leading-8 text-ink-700">{ABOUT.mission}</p>
            </div>
            <div className="border-t border-ink-950 pt-5">
              <p className="text-micro uppercase tracking-[0.12em] text-ink-500">Our vision</p>
              <p className="mt-3 text-[1.0625rem] leading-8 text-ink-700">{ABOUT.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="section border-b border-line bg-canvas/60" data-reveal>
        <div className="container-editorial">
          <SectionHead
            eyebrow="What we do"
            title="Comprehensive programmes to develop tech talent"
            description="Four areas of activity, run by members and supported by mentors and partners."
          />
          <div className="mt-9 grid gap-x-12 gap-y-0 sm:grid-cols-2">
            {ABOUT.whatWeDo.map((item, index) => (
              <article key={item.title} className="grid grid-cols-[40px_1fr] gap-4 border-t border-line py-6">
                <span className="font-mono text-[0.6875rem] text-ink-400">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[1.0625rem] font-semibold text-ink-950">{item.title}</h3>
                  <p className="mt-1.5 max-w-[48ch] text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2" data-reveal data-reveal-kind="image">
            <EditorialFigure media={aboutLibrary} ratio="aspect-[4/3]" />
            <EditorialFigure media={aboutWorkshop} ratio="aspect-[4/3]" className="sm:mt-10" />
          </div>
        </div>
      </section>

      {/* Mentorship */}
      <section className="section border-b border-line">
        <div className="container-editorial grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Mentorship</p>
            <h2 className="mt-3 text-display-md text-ink-950">Guidance from people a few steps ahead.</h2>
            <p className="mt-4 max-w-[44ch] text-[0.9375rem] leading-7 text-ink-600">
              Get personalised guidance from experienced professionals and alumni. Mentorship runs alongside the club's
              workshops and project teams.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <ButtonLink to="/contact?topic=mentee" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Join as mentee
              </ButtonLink>
              <ButtonLink to="/contact?topic=mentor" size="sm" variant="outline">
                Become a mentor
              </ButtonLink>
            </div>
            <p className="mt-3 text-[0.6875rem] text-ink-400">
              These actions open the contact form. The current site does not publish a separate application form.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {mentorship.map((item) => (
              <div key={item.title} className="border-t border-line pt-4">
                <h3 className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead eyebrow="Values" title="Principles that guide everything we do" />
          <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.values.map((value, index) => (
              <div key={value.title} className="bg-white p-5">
                <span className="font-mono text-[0.6875rem] text-brand-700">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{value.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">Our impact</p>
              <h2 className="mt-3 text-display-md text-ink-950">Making a difference in students' lives</h2>
              <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-7 text-ink-600">
                The club publishes headline figures for its community. These numbers are carried over from the current
                website and are awaiting the club's verification for the 2026/27 year.
              </p>
            </div>
            <div>
              <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
                {CLUB_FACTS.map((fact) => (
                  <div key={fact.label} className="bg-white p-5">
                    <p className="text-[2rem] font-semibold tabular leading-none tracking-tight text-ink-950">{fact.value}</p>
                    <p className="mt-1.5 text-[0.75rem] text-ink-500">{fact.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.625rem] leading-4 text-ink-400">
                Source: figures as published on the current KIUT Digital Club homepage. The current impact section
                separately displays zeros; both sets require owner confirmation before production.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition */}
      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Recognition"
            title="Achievements and partners"
            description="Published recognition and partner relationships from the current website. Partner marks are shown as names until approved logo assets are supplied."
          />
          <div className="mt-9 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-700" aria-hidden />
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent achievements</h3>
              </div>
              <div className="divide-y divide-line border-y border-line">
                {ACHIEVEMENTS.map((achievement) => (
                  <article key={achievement.title} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-[0.875rem] font-semibold text-ink-950">{achievement.title}</h4>
                      <span className="text-[0.6875rem] text-ink-400">{achievement.date}</span>
                    </div>
                    <p className="mt-1 text-[0.8125rem] leading-6 text-ink-500">{achievement.description}</p>
                  </article>
                ))}
              </div>
              <p className="mt-2 text-[0.625rem] text-ink-400">2024 claims reproduced from the current site; evidence and permission to publish need confirmation.</p>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <Handshake className="h-4 w-4 text-brand-700" aria-hidden />
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">Partners & sponsors</h3>
              </div>
              <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
                {PARTNERS.map((partner) => (
                  <div key={partner.name} className="bg-white p-4">
                    <p className="text-[0.875rem] font-semibold tracking-tight text-ink-900">{partner.name}</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">{partner.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.625rem] text-ink-400">Partner relationships and logo permissions require owner confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership preview */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Leadership"
            title="An elected student team"
            description="The club is led by students across an executive board, technical leads and department heads."
            action={{ label: 'Full leadership', to: '/leaders' }}
          />
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.slice(0, 4).map((leader) => (
              <LeaderCard
                key={leader.name}
                name={leader.name}
                position={leader.position}
                programme={leader.programme}
                year={leader.year}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {LEADERSHIP_STRUCTURE.map((item) => (
              <div key={item.title} className="bg-white p-4">
                <p className="text-[0.8125rem] font-semibold text-ink-950">{item.title}</p>
                <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container-editorial grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-3 text-display-md text-ink-950">Common questions</h2>
            <p className="mt-3 max-w-[38ch] text-[0.9375rem] leading-7 text-ink-600">
              Still unsure about something? The club answers questions by email within 24–48 hours on weekdays.
            </p>
            <div className="mt-5">
              <ButtonLink to="/contact" variant="outline" size="sm" iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}>
                Ask the club
              </ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="green">Free membership</Badge>
              <Badge tone="outline">All levels</Badge>
              <Badge tone="outline">KIUT students</Badge>
            </div>
          </div>
          <Accordion items={ABOUT.faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))} />
        </div>
      </section>

      <JoinBand
        eyebrow="Join the club"
        title="Become part of Tanzania's most innovative student tech community."
        description="Start your journey in technology today. Register with your KIUT student email, then attend an orientation session to get started."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'Contact us', to: '/contact' }}
      />
    </>
  )
}

export default About
