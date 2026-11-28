import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Plus, Save, ShieldCheck } from 'lucide-react'
import { COURSES, YEARS } from '../../data/site'
import { api, ApiError } from '../../lib/api'
import type { ProfileCompletion, SelfProfile } from '../../lib/memberApi'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Avatar, Badge, Card, CardBody, CardHeader, Field, Input, Progress, Select, Textarea } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

type ProfileValues = {
  full_name: string
  title: string
  phone: string
  course: string
  year: string
  bio: string
  interests: string
  github: string
  linkedin: string
}

function fromList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const FIELD_KEYS: Record<string, keyof ProfileValues> = {
  full_name: 'full_name',
  phone: 'phone',
  course: 'course',
  year: 'year',
}

export function EditProfile() {
  const { data, loading, error, reload } = useMemberData(
    () => Promise.all([memberApi.profile(), api.me()]).then(([profile, me]) => ({ profile, me })),
    [],
  )

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Edit profile" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile', to: '/member/profile' }, { label: 'Edit' }]} />
        <LoadingBlock rows={5} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Edit profile" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile', to: '/member/profile' }, { label: 'Edit' }]} />
        <ErrorBlock message={error ?? 'Your profile could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  return (
    <EditProfileForm
      profile={data.profile}
      completion={data.me.profile_completion}
      onSaved={reload}
    />
  )
}

function EditProfileForm({
  profile,
  completion,
  onSaved,
}: {
  profile: SelfProfile
  completion: ProfileCompletion
  onSaved: () => void
}) {
  const navigate = useNavigate()
  const { push } = useToast()
  const { refresh } = useAuth()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [avatar, setAvatar] = useState(profile.avatar_url)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    defaultValues: {
      full_name: profile.full_name ?? '',
      title: profile.title ?? '',
      phone: profile.phone ?? '',
      course: profile.course ?? '',
      year: profile.year ?? '',
      bio: profile.bio ?? '',
      interests: profile.areas_of_interest.join(', '),
      github: profile.github ?? '',
      linkedin: profile.linkedin ?? '',
    },
  })

  async function uploadAvatar(file: File) {
    setUploading(true)
    try {
      const result = await memberApi.uploadAvatar(file)
      setAvatar(result.avatar_url)
      push({ tone: 'success', title: 'Photo updated', description: 'Your profile photo and digital ID now use this image.' })
      await refresh()
      onSaved()
    } catch (err) {
      push({
        tone: 'error',
        title: 'Photo not saved',
        description: err instanceof ApiError ? err.message : 'The image could not be uploaded.',
      })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <>
      <PageHeader
        title="Edit profile"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile', to: '/member/profile' }, { label: 'Edit' }]}
        actions={
          <Link
            to="/member/profile"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-ink-200 px-3 text-[0.75rem] text-ink-700 hover:bg-ink-50"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden /> View profile
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <Card>
          <CardHeader title="Public profile" description="Fields marked as optional only affect profile completion, not access to your account." />
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                await memberApi.updateProfile({
                  full_name: values.full_name,
                  title: values.title || null,
                  phone: values.phone,
                  course: values.course,
                  year: values.year,
                  bio: values.bio || null,
                  github: values.github || null,
                  linkedin: values.linkedin || null,
                  areas_of_interest: fromList(values.interests),
                })
              } catch (err) {
                if (err instanceof ApiError) {
                  let matched = false
                  for (const [field, message] of Object.entries(err.details)) {
                    const key = FIELD_KEYS[field]
                    if (key) {
                      setError(key, { message })
                      matched = true
                    }
                  }
                  if (!matched) {
                    push({ tone: 'error', title: 'Profile not saved', description: err.message })
                  }
                  return
                }
                push({ tone: 'error', title: 'Profile not saved', description: 'Check your connection and try again.' })
                return
              }
              push({ tone: 'success', title: 'Profile saved', description: 'Your profile now uses these details.' })
              await refresh()
              onSaved()
              navigate('/member/profile')
            })}
            noValidate
          >
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-canvas/40 p-4">
                <Avatar name={profile.full_name} src={avatar} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-semibold text-ink-900">Profile photo</p>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-500">PNG, JPG or GIF up to 2 MB. Your digital ID is rebuilt with it.</p>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="sr-only"
                  id="profile-photo"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadAvatar(file)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInput.current?.click()}
                  iconLeft={<Plus className="h-3.5 w-3.5" />}
                >
                  Change photo
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="profile-name" required error={errors.full_name?.message}>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.full_name)}
                    {...register('full_name', {
                      required: 'Enter your full name.',
                      minLength: { value: 2, message: 'Use at least 2 characters.' },
                      maxLength: { value: 100, message: 'Keep this under 100 characters.' },
                    })}
                  />
                </Field>
                <Field label="Email address" htmlFor="profile-email" hint="Contact an administrator to change your email.">
                  <Input id="profile-email" value={profile.email} readOnly disabled />
                </Field>
              </div>

              <Field label="Tagline" htmlFor="profile-title" hint="A short line shown under your name, e.g. Frontend developer." optional>
                <Input id="profile-title" placeholder="What do you work on?" maxLength={100} {...register('title')} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number" htmlFor="profile-phone" required error={errors.phone?.message}>
                  <Input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    {...register('phone', { required: 'Enter a phone number.', maxLength: { value: 20, message: 'Keep this under 20 characters.' } })}
                  />
                </Field>
                <Field label="Year of study" htmlFor="profile-year" required error={errors.year?.message}>
                  <Select id="profile-year" {...register('year', { required: 'Select your year of study.' })}>
                    <option value="">Select year</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Course" htmlFor="profile-course" required error={errors.course?.message}>
                <Select id="profile-course" {...register('course', { required: 'Select your course.' })}>
                  <option value="">Select course</option>
                  {COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Biography"
                htmlFor="profile-bio"
                hint="Shown on your profile. Do not include contact details or private information."
                error={errors.bio?.message}
              >
                <Textarea
                  id="profile-bio"
                  rows={4}
                  maxLength={2000}
                  placeholder="What are you learning and building?"
                  {...register('bio', { maxLength: { value: 2000, message: 'Keep your bio under 2000 characters.' } })}
                />
              </Field>

              <Field
                label="Areas of interest"
                htmlFor="profile-interests"
                hint="Separate interests with commas."
              >
                <Input id="profile-interests" placeholder="Web Development, UI/UX Design" {...register('interests')} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GitHub" htmlFor="profile-github" optional hint="Profile path or URL.">
                  <Input id="profile-github" placeholder="github.com/username" {...register('github', { maxLength: { value: 200, message: 'Keep this under 200 characters.' } })} />
                </Field>
                <Field label="LinkedIn" htmlFor="profile-linkedin" optional hint="Profile path or URL.">
                  <Input id="profile-linkedin" placeholder="linkedin.com/in/username" {...register('linkedin', { maxLength: { value: 200, message: 'Keep this under 200 characters.' } })} />
                </Field>
              </div>

              <Alert tone="info" title="What other members see">
                Your name, tagline, biography, interests and links follow the visibility rules in Privacy. Email, phone and member
                ID are never published.
              </Alert>
            </CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <Link to="/member/profile" className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to profile
              </Link>
              <Button type="submit" loading={isSubmitting} iconLeft={<Save className="h-4 w-4" />}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.8125rem] font-semibold text-ink-900">Profile completion</p>
                <Badge tone="outline">{completion.percent}%</Badge>
              </div>
              <div className="mt-2">
                <Progress value={completion.percent} />
              </div>
              <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
                {completion.missing_fields.length
                  ? `Still needed: ${completion.missing_fields.join(', ')}.`
                  : 'Every required field is filled in.'}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
                <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden /> Privacy
              </p>
              <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                Choose whether your profile is public or private and which sections approved followers can see.
              </p>
              <Link to="/member/profile?tab=privacy" className="mt-2 inline-block text-[0.75rem] font-semibold text-brand-800 hover:underline">
                Manage privacy settings
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-[0.8125rem] font-semibold text-ink-900">Why this matters</p>
              <ul className="mt-2 space-y-2 text-[0.75rem] leading-5 text-ink-500">
                <li>Your course and phone are required before accessing the dashboard.</li>
                <li>Competition eligibility can depend on your year of study.</li>
                <li>Your member ID and membership status cannot be edited here.</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default EditProfile
