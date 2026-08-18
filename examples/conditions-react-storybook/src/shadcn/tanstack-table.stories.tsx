import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import {
  type ContactsQuery,
  advancedQuery,
  compactQuery,
} from '../shared/definition.ts'
import { shadcnConditions } from './conditions.tsx'
import {
  ClearButton,
  ConditionTree,
  MobileFilterHeader,
} from './filter-bar.tsx'
import { TanStackContactTable } from './tanstack-table.tsx'
import './globals.css'

interface TanStackDemoProps {
  defaultValue?: ContactsQuery
  eyebrow?: string
}

function TanStackDemo({
  defaultValue,
  eyebrow = 'TanStack Table · shadcn',
}: TanStackDemoProps) {
  const conditions = shadcnConditions.useConditions({ defaultValue })
  return (
    <main className="min-h-screen bg-[#f7f7f8] text-zinc-950">
      <conditions.Root>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
            <div>
              <p className="text-base font-semibold tracking-tight">Contacts</p>
              <p className="text-xs text-muted-foreground">{eyebrow}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
              SJ
            </div>
          </div>
        </header>
        <div className="border-b bg-zinc-100/80">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-8">
            <MobileFilterHeader />
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ConditionTree />
              </div>
              <div className="hidden sm:block">
                <ClearButton />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <TanStackContactTable />
        </div>
      </conditions.Root>
    </main>
  )
}

const meta = {
  title: 'Conditions/TanStack Table',
  component: TanStackDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A TanStack (React) Table v9 whose global filter is the condition query, via @saas-js/conditions-tanstack-table. Sorting is plain TanStack Table; filtering flows from the chips above.',
      },
    },
  },
} satisfies Meta<typeof TanStackDemo>

export default meta
type Story = StoryObj<typeof meta>

export const FilteredBySavedSegment: Story = {
  args: { defaultValue: compactQuery },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // compactQuery filters to status = customer: 2 of 5 contacts.
    await expect(canvas.getByText('2 of 5')).toBeInTheDocument()
    await expect(canvas.getByText('Maya Chen')).toBeInTheDocument()
    await expect(canvas.getByText('Priya Shah')).toBeInTheDocument()
    await expect(canvas.queryByText('Jon Bell')).toBeNull()

    // Sorting stays plain TanStack Table (numeric columns sort desc first).
    await userEvent.click(canvas.getByRole('button', { name: 'ARR' }))
    await expect(canvas.getAllByText(/\$\d/)[0]).toHaveTextContent('$132,000')
    await userEvent.click(canvas.getByRole('button', { name: 'ARR' }))
    await expect(canvas.getAllByText(/\$\d/)[0]).toHaveTextContent('$84,000')
  },
}

export const NestedGroups: Story = {
  args: {
    defaultValue: advancedQuery,
    eyebrow: 'Nested logic · TanStack Table',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3 of 5')).toBeInTheDocument()
  },
}

export const Unfiltered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('5 of 5')).toBeInTheDocument()
  },
}
