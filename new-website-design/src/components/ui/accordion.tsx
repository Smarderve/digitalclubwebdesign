import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

export function Accordion({ items }: { items: { question: string; answer: ReactNode }[] }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="divide-y divide-line border-y border-line">
      {items.map((item, index) => (
        <AccordionPrimitive.Item key={item.question} value={`item-${index}`}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-start justify-between gap-6 py-4 text-left text-[0.9375rem] font-medium text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
              {item.question}
              <Plus
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-45"
                aria-hidden
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-small leading-6 text-ink-600 data-[state=open]:animate-fade-in">
            <div className="pb-5 pr-8">{item.answer}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
