import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Save, ShieldCheck } from 'lucide-react'
import { COURSES, YEARS } from '../../data/site'
import { demoMember } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Card, CardBody, CardHeader, Field, Input, Progress, Select, Textarea } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { useSocial, useViewer } from '../../features/social/hooks'
import { profileCompletion, profileOf, updateProfile } from '../../features/social/store'

type ProfileValues = {
  displayName: string
  username: string
  fullName: string
  title: string
  phone: string
  course: string
  year: string
  bio: string
  skills: string
  interests: string
  github: string
  linkedin: string
  website: string
}

function fromList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function EditProfile() {
  useSocial()
  const navigate = useNavigate()
  const viewer = useViewer()
  const { push } = useToast()
  const profile = profileOf(viewer)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    defaultValues: {
      displayName: profile?.displayName ?? demoMember.name,
      username: profile?.username ?? '',
      fullName: profile?.fullName ?? '',
      title: profile?.tagline ?? '',
      phone: demoMember.phone,
      course: profile?.course ?? demoMember.course,
      year: profile?.year ?? demoMember.year,
      bio: profile?.bio ?? '',
      skills: profile?.skills.join(', ') ?? '',
      interests: profile?.interests.join(', ') ?? '',
      github: profile?.github ?? '',
      linkedin: profile?.linkedin ?? '',
      website: profile?.website ?? '',
    },
  })

  const completion = profile ? profileCompletion(profile) : 0
  const draft = profile
    ? {
        ...profile,
        skills: profile.skills,
      }
    : null

  return (
    <>
      <PageHeader
        title="Edit profile"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile', to: '/member/profile' }, { label: 'Edit' }]}
        actions={
          profile ? (
            <Link
              to={`/members/${profile.username}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-ink-200 px-3 text-[0.75rem] text-ink-700 hover:bg-ink-50"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden /> View public profile
            </Link>
          ) : null
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <Card>
          <CardHeader title="Public profile" description="Fields marked as optional only affect profile completion, not access to your account." />
          <form
            onSubmit={handleSubmit(async (values) => {
              if (!viewer) {
                push({ tone: 'error', title: 'Sign in to edit your profile.' })
                return
              }
              const result = updateProfile(viewer, {
                displayName: values.displayName,
                username: values.username,
                tagline: values.title,
                bio: values.bio,
                skills: fromList(values.skills),
                interests: fromList(values.interests),
                github: values.github,
                linkedin: values.linkedin,
                website: values.website,
                course: values.course,
                year: values.year,
              })
              if (!result.ok) {
                if (result.code === 'USERNAME_TAKEN' || result.code === 'INVALID') {
                  setError('username', { message: result.error })
                } else {
                  push({ tone: 'error', title: 'Profile not saved', description: result.error })
                }
                return
              }
              push({ tone: 'success', title: 'Profile saved', description: 'Your public profile and search listing now use these details.' })
              navigate(result.data === viewer ? '/member/profile' : `/members/${result.data}`)
            })}
            noValidate
          >
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" htmlFor="profile-name" required error={errors.displayName?.message}>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.displayName)}
                    {...register('displayName', {
                      required: 'Enter your display name.',
                      minLength: { value: 2, message: 'Use at least 2 characters.' },
                      maxLength: { value: 80, message: 'Keep this under 80 characters.' },
                    })}
                  />
                </Field>
                <Field
                  label="Username"
                  htmlFor="profile-username"
                  hint="Your profile link: /members/username"
                  error={errors.username?.message}
                >
                  <Input
                    id="profile-username"
                    autoComplete="username"
                    aria-invalid={Boolean(errors.username)}
                    {...register('username', {
                      required: 'Choose a username.',
                      pattern: {
                        value: /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/,
                        message: 'Use 3–30 lowercase letters, numbers or hyphens.',
                      },
                    })}
                  />
                </Field>
              </div>

              <Field label="Tagline" htmlFor="profile-title" hint="A short line shown under your name, e.g. Frontend developer." optional>
                <Input id="profile-title" placeholder="What do you work on?" maxLength={120} {...register('title')} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" htmlFor="profile-email" hint="Contact an administrator to change your email. Never shown publicly.">
                  <Input id="profile-email" value={demoMember.email} readOnly disabled />
                </Field>
                <Field label="Phone number" htmlFor="profile-phone" required error={errors.phone?.message}>
                  <Input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    {...register('phone', { required: 'Enter a phone number.' })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

              <Field
                label="Biography"
                htmlFor="profile-bio"
                hint="Shown on your public profile. Do not include contact details or private information."
                error={errors.bio?.message}
              >
                <Textarea
                  id="profile-bio"
                  rows={4}
                  maxLength={700}
                  placeholder="What are you learning and building?"
                  {...register('bio', { maxLength: { value: 700, message: 'Keep your bio under 700 characters.' } })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Skills and tools"
                  htmlFor="profile-skills"
                  hint="Separate with commas. These are shown as self-declared."
                >
                  <Input id="profile-skills" placeholder="React, TypeScript, Python" {...register('skills')} />
                </Field>
                <Field
                  label="Areas of interest"
                  htmlFor="profile-interests"
                  hint="Separate interests with commas."
                >
                  <Input id="profile-interests" placeholder="Web Development, UI/UX Design" {...register('interests')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="GitHub" htmlFor="profile-github" optional hint="Profile path or URL.">
                  <Input id="profile-github" placeholder="github.com/username" {...register('github')} />
                </Field>
                <Field label="LinkedIn" htmlFor="profile-linkedin" optional hint="Profile path or URL.">
                  <Input id="profile-linkedin" placeholder="linkedin.com/in/username" {...register('linkedin')} />
                </Field>
                <Field label="Portfolio" htmlFor="profile-website" optional hint="Full URL.">
                  <Input id="profile-website" placeholder="https://…" {...register('website')} />
                </Field>
              </div>

              <Alert tone="info" title="What other members see">
                Your display name, username, tagline, biography, skills, interests, links, learning activity, achievements and
                published projects follow the visibility rules in Privacy. Email, phone and member ID are never published.
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
                <Badge tone="outline">{completion}%</Badge>
              </div>
              <div className="mt-2">
                <Progress value={completion} />
              </div>
              <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
                Based on the fields you have filled in. You do not need to publish your profile to complete your account.
              </p>
              {draft ? (
                <Link to={`/members/${draft.username}?preview=1`} className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-brand-800 hover:underline">
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Preview public profile
                </Link>
              ) : null}
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
