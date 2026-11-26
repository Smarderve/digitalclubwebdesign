import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { demoMemberProjects } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Card, CardBody, Field, Input, Select, Textarea } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'

type ProjectValues = {
  title: string
  description: string
  technologies: string
  link: string
  demo: string
  visibility: string
}

export function ProjectForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const existing = demoMemberProjects.find((project) => String(project.id) === id)
  const editing = Boolean(id)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectValues>({
    defaultValues: {
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      technologies: existing?.technologies ?? '',
      link: existing?.link ?? '',
      demo: existing?.demo ?? '',
      visibility: existing?.visibility ?? 'Private',
    },
  })

  return (
    <>
      <PageHeader
        title={editing ? 'Edit project' : 'Add a project'}
        description={
          editing
            ? 'Update your project details. Changes would be reviewed before appearing publicly.'
            : 'Add a project to your member profile. You can keep it private until it is ready to share.'
        }
        breadcrumbs={[
          { label: 'Member', to: '/member' },
          { label: 'Projects', to: '/member/projects' },
          { label: editing ? 'Edit' : 'Add' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,720px)_1fr] lg:items-start">
        <Card>
          <form
            noValidate
            onSubmit={handleSubmit(async () => {
              await new Promise((resolve) => setTimeout(resolve, 700))
              push({
                tone: 'success',
                title: editing ? 'Project validated' : 'Project validated',
              })
              navigate('/member/projects')
            })}
          >
            <CardBody className="space-y-4">
              <Field label="Project title" htmlFor="project-title" required error={errors.title?.message}>
                <Input
                  id="project-title"
                  placeholder="e.g. Library Seat Finder"
                  aria-invalid={Boolean(errors.title)}
                  {...register('title', { required: 'Enter a project title.' })}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="project-description"
                required
                hint="Explain the problem, what the project does and what you learned. Avoid claiming outcomes you cannot evidence."
                error={errors.description?.message}
              >
                <Textarea
                  id="project-description"
                  rows={5}
                  placeholder="What does this project do?"
                  aria-invalid={Boolean(errors.description)}
                  {...register('description', { required: 'Describe the project.' })}
                />
              </Field>

              <Field label="Technologies" htmlFor="project-technologies" hint="Separate with commas, e.g. React, TypeScript, Firebase.">
                <Input id="project-technologies" placeholder="React, TypeScript, Firebase" {...register('technologies')} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repository link" htmlFor="project-link" optional>
                  <Input id="project-link" type="url" placeholder="https://github.com/…" {...register('link')} />
                </Field>
                <Field label="Live demo link" htmlFor="project-demo" optional>
                  <Input id="project-demo" type="url" placeholder="https://…" {...register('demo')} />
                </Field>
              </div>

              <Field
                label="Visibility"
                htmlFor="project-visibility"
                hint="Private projects are visible only to you and administrators. Public projects can be listed in the catalogue."
              >
                <Select id="project-visibility" {...register('visibility')}>
                  <option value="Private">Private</option>
                  <option value="Public">Public</option>
                </Select>
              </Field>

              <Alert tone="info" title="Project publication">
                Public projects are reviewed before they appear on the website. Do not include confidential information or
                other people's work without permission.
              </Alert>
            </CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <Link to="/member/projects" className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to projects
              </Link>
              <Button type="submit" loading={isSubmitting} iconLeft={<Save className="h-4 w-4" />}>
                {editing ? 'Save changes' : 'Add project'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardBody>
            <p className="text-[0.8125rem] font-semibold text-ink-900">A useful project record</p>
            <ul className="mt-2 space-y-2 text-[0.75rem] leading-5 text-ink-500">
              <li>State the problem the project solves, in one or two sentences.</li>
              <li>List the technologies you actually used.</li>
              <li>Link to a public repository or demo where possible.</li>
              <li>Credit teammates and any open-source work you built on.</li>
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[0.75rem] font-medium text-ink-800">Need a teammate?</p>
              <Link to="/member/teams" className="mt-1 inline-block text-[0.75rem] font-semibold text-brand-800 hover:underline">
                Open the team hub
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

export default ProjectForm
