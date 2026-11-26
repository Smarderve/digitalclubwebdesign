import { useState } from 'react'
import { CreditCard, KeyRound, Mail, Palette, Save, Settings2, ShieldCheck, Smartphone } from 'lucide-react'
import { demoAdminProfile, demoSettings } from '../../data/demo'
import { SITE } from '../../data/site'
import { PageHeader } from '../../components/app/primitives'
import { AppearancePanel } from '../../components/app/AppearancePanel'
import { Alert, Badge, Button, Card, CardHeader, DetailList, Field, Input, Select, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '../../components/ui'
import { DemoNotice } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

export function AdminSettings() {
  const [tab, setTab] = useState('general')
  const [general, setGeneral] = useState({ clubEmail: demoSettings.clubEmail, clubPhone: demoSettings.clubPhone, responseTime: SITE.responseTime, address: SITE.address.join('\n') })
  const [membership, setMembership] = useState({ fee: String(demoSettings.membershipFee), period: demoSettings.membershipPeriod, approval: demoSettings.registrationApprovalMode })
  const [channels, setChannels] = useState({ newsletter: demoSettings.newsletterEnabled, sms: demoSettings.smsEnabled })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Settings' }]}
        actions={
          <Button
            size="sm"
            iconLeft={<Save className="h-3.5 w-3.5" />}
            onClick={() => {
              const next: Record<string, string> = {}
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(general.clubEmail)) next.clubEmail = 'Enter a valid email address.'
              if (general.clubPhone.trim().length < 9) next.clubPhone = 'Enter a valid phone number.'
              setErrors(next)
              if (Object.keys(next).length) {
                push({ tone: 'error', title: 'Settings not saved', description: 'Fix the highlighted fields and try again.' })
                return
              }
              push({ tone: 'success', title: 'Settings saved' })
            }}
          >
            Save changes
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList ariaLabel="Settings sections">
          <TabsTrigger value="general">
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="h-5 w-5 shrink-0" aria-hidden />
              General
            </span>
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <span className="inline-flex items-center gap-1.5">
              <Palette className="h-5 w-5 shrink-0" aria-hidden />
              Appearance
            </span>
          </TabsTrigger>
          <TabsTrigger value="membership">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
              Membership
            </span>
          </TabsTrigger>
          <TabsTrigger value="channels">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
              Channels
            </span>
          </TabsTrigger>
          <TabsTrigger value="access">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
              Access
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {tab === 'appearance' ? (
            <div className="mt-4">
              <AppearancePanel />
            </div>
          ) : null}

          {tab === 'general' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Club contact details" />
                <div className="space-y-4 p-4">
                  <Field label="Club email" htmlFor="settings-email" required error={errors.clubEmail}>
                    <Input id="settings-email" type="email" value={general.clubEmail} onChange={(event) => setGeneral({ ...general, clubEmail: event.target.value })} />
                  </Field>
                  <Field label="Phone number" htmlFor="settings-phone" required error={errors.clubPhone}>
                    <Input id="settings-phone" value={general.clubPhone} onChange={(event) => setGeneral({ ...general, clubPhone: event.target.value })} />
                  </Field>
                  <Field label="Response time" htmlFor="settings-response">
                    <Input id="settings-response" value={general.responseTime} onChange={(event) => setGeneral({ ...general, responseTime: event.target.value })} />
                  </Field>
                  <Field label="Postal address" htmlFor="settings-address">
                    <Textarea id="settings-address" rows={4} value={general.address} onChange={(event) => setGeneral({ ...general, address: event.target.value })} />
                  </Field>
                </div>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Club identity" />
                  <div className="p-4">
                    <DetailList
                      items={[
                        { label: 'Name', value: SITE.name },
                        { label: 'University', value: SITE.university },
                        { label: 'Tagline', value: SITE.tagline },
                      ]}
                    />
                  </div>
                </Card>
                <Alert tone="info" title="Public content">
                  Names, dates and contact details are published facts. Update them here only after the club confirms the change.
                </Alert>
              </div>
            </div>
          ) : null}

          {tab === 'membership' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Membership rules" />
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <Field label="Annual fee (TZS)" htmlFor="settings-fee">
                    <Input id="settings-fee" type="number" min={0} value={membership.fee} onChange={(event) => setMembership({ ...membership, fee: event.target.value })} />
                  </Field>
                  <Field label="Membership period" htmlFor="settings-period">
                    <Select id="settings-period" value={membership.period} onChange={(event) => setMembership({ ...membership, period: event.target.value })}>
                      <option>12 months</option>
                      <option>Semester</option>
                      <option>Academic year</option>
                    </Select>
                  </Field>
                  <Field label="Registration approval" htmlFor="settings-approval" className="sm:col-span-2">
                    <Select id="settings-approval" value={membership.approval} onChange={(event) => setMembership({ ...membership, approval: event.target.value })}>
                      <option value="manual">Manual review</option>
                      <option value="auto">Automatic approval</option>
                    </Select>
                  </Field>
                </div>
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[0.6875rem] text-ink-400">Fee changes do not alter payments already recorded.</p>
                </div>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Digital IDs" />
                  <p className="px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
                    IDs are issued automatically when a member signs in without one. Validity follows the membership period.
                  </p>
                  <div className="border-t border-line px-4 py-3">
                    <Badge tone="green" dot>Issuing enabled</Badge>
                  </div>
                </Card>
                <Alert tone="warning" title="Finance records">
                  Changes to fees should match the approved club budget. Finance records are kept separately for accountability.
                </Alert>
              </div>
            </div>
          ) : null}

          {tab === 'channels' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Communication channels" />
                <div className="space-y-5 p-4">
                  <Switch checked={channels.newsletter} onCheckedChange={(value) => setChannels({ ...channels, newsletter: value })} label="Newsletter" />
                  <Switch checked={channels.sms} onCheckedChange={(value) => setChannels({ ...channels, sms: value })} label="SMS notifications" />
                  <div className="rounded-md border border-line bg-canvas/50 p-3">
                    <p className="flex items-center gap-2 text-[0.75rem] font-medium text-ink-800">
                      <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                      Transactional email is always enabled
                    </p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                      Registration, approval and password emails are essential account messages and cannot be switched off.
                    </p>
                  </div>
                </div>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Delivery providers" />
                  <div className="p-4">
                    <DetailList
                      items={[
                        { label: 'Email', value: <Badge tone="green">Configured</Badge> },
                        { label: 'SMS', value: channels.sms ? <Badge tone="green">Enabled</Badge> : <Badge tone="neutral">Disabled</Badge> },
                        { label: 'Newsletter', value: channels.newsletter ? <Badge tone="green">Enabled</Badge> : <Badge tone="neutral">Disabled</Badge> },
                      ]}
                    />
                    <p className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
                      <Smartphone className="h-3 w-3" aria-hidden />
                      Provider credentials are stored server-side and never shown in the console.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'access' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Administrator access" />
                <div className="p-4">
                  <DetailList
                    items={[
                      { label: 'Administrators', value: '1 active' },
                      { label: 'Quizmasters', value: '1 active' },
                      { label: 'Session timeout', value: '30 minutes of inactivity' },
                      { label: 'Two-factor authentication', value: <Badge tone="amber">Recommended</Badge> },
                      { label: 'Audit log retention', value: '12 months' },
                    ]}
                  />
                  <p className="mt-3 text-[0.75rem] leading-5 text-ink-500">
                    Administrator accounts are managed in the members directory. Grant the quizmaster role there rather than here.
                  </p>
                </div>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Security recommendations" />
                  <ul className="space-y-2 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
                    <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden /> Keep administrator accounts to a minimum.</li>
                    <li className="flex items-start gap-2"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden /> Change the shared club password when an officer leaves.</li>
                    <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden /> Review the audit log before publishing results or finance reports.</li>
                  </ul>
                </Card>
                <Alert tone="warning" title="Shared accounts">
                  Do not share an administrator login. Every administrator should use their own account so audit entries identify the right person.
                </Alert>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <DemoNotice />
    </>
  )
}

export function AdminProfile() {
  const [name, setName] = useState(demoAdminProfile.name)
  const [phone, setPhone] = useState(demoAdminProfile.phone)
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Administrator profile"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Admin profile' }]}
        actions={
          <Button size="sm" iconLeft={<Save className="h-3.5 w-3.5" />} onClick={() => push({ tone: 'success', title: 'Profile saved' })}>
            Save profile
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Account details" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="admin-name">
                <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Email" htmlFor="admin-email" hint="Used to sign in. Contact support to change it.">
                <Input id="admin-email" value={demoAdminProfile.email} readOnly disabled />
              </Field>
              <Field label="Phone" htmlFor="admin-phone">
                <Input id="admin-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </Field>
              <Field label="Role" htmlFor="admin-role">
                <Input id="admin-role" value={demoAdminProfile.role} readOnly disabled />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Password" />
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-[0.75rem] text-ink-500">Last changed on 2 September 2026.</p>
              <Button variant="outline" size="sm" iconLeft={<KeyRound className="h-3.5 w-3.5" />} onClick={() => push({ tone: 'info', title: 'Password change is available from your account settings' })}>
                Change password
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Account record" />
            <div className="p-4">
              <DetailList
                items={[
                  { label: 'Role', value: demoAdminProfile.role },
                  { label: 'Administrator since', value: formatDate(demoAdminProfile.since) },
                  { label: 'Last sign-in', value: formatDate(demoAdminProfile.lastLogin, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Two-factor', value: <Badge tone="amber">Not enabled</Badge> },
                ]}
              />
            </div>
          </Card>
          <Alert tone="info" title="Account security">
            Sign out on shared computers. Administrator sessions expire after 30 minutes of inactivity.
          </Alert>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}
