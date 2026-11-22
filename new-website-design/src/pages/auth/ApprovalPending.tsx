import { Link } from 'react-router-dom'
import { Clock, Mail, UserCheck } from 'lucide-react'
import { SITE } from '../../data/site'
import { ButtonLink } from '../../components/ui/button'
import { AuthLogo } from './AuthHeading'

export function ApprovalPending() {
  let registeredEmail = ''
  try {
    const stored = sessionStorage.getItem('kiut-demo-registration')
    registeredEmail = stored ? (JSON.parse(stored).email as string) : ''
  } catch {
    registeredEmail = ''
  }

  return (
    <>
      <AuthLogo />

      <div className="mt-7">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#F5D9A8] bg-[#FFFAF0] text-[#A15C07]">
          <Clock className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-brand-700">Registration sent</p>
        <h1 className="mt-2 text-[1.6875rem] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-950 sm:text-[1.875rem]">
          Your account is pending approval
        </h1>
        <p className="mt-2 text-[0.875rem] leading-6 text-ink-500">
          Registration was submitted in the prototype. On the live system, a club administrator reviews new accounts
          before they can sign in.
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-canvas/60 p-5">
        <dl className="space-y-3">
          <div>
            <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Account</dt>
            <dd className="mt-0.5 break-words text-[0.8125rem] font-medium text-ink-900">
              {registeredEmail || 'No registration in this session'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Status</dt>
            <dd className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#F5D9A8] bg-[#FFFAF0] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#8A4B05]">
              <Clock className="h-3 w-3" aria-hidden />
              Awaiting administrator review
            </dd>
          </div>
        </dl>
      </div>

      <ol className="mt-6 space-y-4">
        {[
          { icon: Mail, title: 'Check your email', text: 'The live system contacts you once a decision is made. This prototype sends nothing.' },
          { icon: UserCheck, title: 'Complete your profile', text: 'After approval, sign in and complete your course, phone and bio before using the dashboard.' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-500">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div>
                <p className="text-[0.8125rem] font-semibold text-ink-900">{item.title}</p>
                <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{item.text}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <ButtonLink to="/auth/login" className="w-full">
          Go to sign in
        </ButtonLink>
        <ButtonLink to="/contact" variant="outline" className="w-full">
          Contact the club
        </ButtonLink>
      </div>

      <div className="mt-5 border-t border-line pt-4 text-center">
        <p className="text-[0.6875rem] leading-5 text-ink-400">
          Questions about approval? Email{' '}
          <a href={`mailto:${SITE.email}`} className="underline decoration-ink-300 underline-offset-2 hover:text-brand-800">
            {SITE.email}
          </a>
          .
        </p>
        <p className="mt-1.5 text-[0.6875rem] text-ink-400">
          Want to explore the interface now?{' '}
          <Link to="/auth/login" className="font-medium text-brand-800 hover:underline">
            Use the prototype member account
          </Link>
          .
        </p>
      </div>
    </>
  )
}

export default ApprovalPending
