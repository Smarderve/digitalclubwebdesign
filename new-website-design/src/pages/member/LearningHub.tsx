import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/app/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { Warmups } from './Warmups'
import { SessionsTimetable } from './Sessions'

const TABS = ['warmups', 'sessions'] as const

/**
 * Learning Hub: the existing warmup quizzes and session timetable, side by side.
 * Both views are the original member components — nothing is reimplemented here.
 */
export function LearningHub() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab = TABS.includes(requested as (typeof TABS)[number]) ? (requested as string) : 'warmups'

  return (
    <>
      <PageHeader
        title="Learning hub"
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params)
          if (value === 'warmups') next.delete('tab')
          else next.set('tab', value)
          setParams(next, { replace: true })
        }}
      >
        <TabsList ariaLabel="Learning hub sections">
          <TabsTrigger value="warmups">Warmups</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="warmups">
          <div className="pt-5">
            <Warmups embedded />
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="pt-5">
            <SessionsTimetable embedded />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default LearningHub
