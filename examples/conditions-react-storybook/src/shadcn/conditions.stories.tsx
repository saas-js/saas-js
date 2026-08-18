import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import {
  type ContactsQuery,
  advancedQuery,
  compactQuery,
  customEditorQuery,
  ownerQuery,
} from '../shared/definition.ts'
import { ShadcnBuilder } from './conditions.tsx'
import './globals.css'

const meta = {
  title: 'Conditions/shadcn',
  component: ShadcnBuilder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A compact shadcn filter rail with searchable menus and segmented chips that edit fields, operators, and values in place.',
      },
    },
  },
} satisfies Meta<typeof ShadcnBuilder>

export default meta
type Story = StoryObj<typeof meta>

export const CompactContactFilters: Story = {
  args: { defaultValue: compactQuery, eyebrow: 'Compact · shadcn' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Filter' }))
    await userEvent.type(page.getByPlaceholderText('Add filter…'), 'Company')
    await userEvent.click(page.getByRole('option', { name: /Company/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Choose value…' }))
    await userEvent.type(
      page.getByRole('textbox', { name: 'Condition value' }),
      'Labs',
    )
    await userEvent.click(page.getByRole('button', { name: 'Apply filter' }))
    await expect(canvas.getByText('Labs')).toBeInTheDocument()
  },
}

export const EnumValueSubmenu: Story = {
  args: { eyebrow: 'Enum submenu · shadcn' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Filter' }))

    const status = page.getByRole('option', { name: 'Status' })
    const company = page.getByRole('option', { name: 'Company' })
    await expect(status).toHaveAttribute('aria-haspopup', 'menu')
    await expect(company).not.toHaveAttribute('aria-haspopup')

    await userEvent.hover(status)
    const lead = page.getByRole('menuitem', { name: 'Lead' })
    await userEvent.hover(lead)
    await new Promise((resolve) => setTimeout(resolve, 180))
    await expect(lead).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Customer' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Churned' })).toBeVisible()
  },
}

export const AdvancedNestedAndOrGroups: Story = {
  args: { defaultValue: advancedQuery, eyebrow: 'Nested logic · shadcn' },
}

export const CustomCurrencyValueEditor: Story = {
  args: {
    defaultValue: customEditorQuery,
    eyebrow: 'Field-specific editor · shadcn',
  },
}

export const AsyncOwnerOptions: Story = {
  args: {
    defaultValue: ownerQuery,
    eyebrow: 'Abortable option source · shadcn',
  },
}

function ControlledExample() {
  const [value, setValue] = useState<ContactsQuery>(compactQuery)
  return (
    <ShadcnBuilder
      value={value}
      onValueChange={setValue}
      eyebrow="Controlled state · shadcn"
    />
  )
}

export const ControlledState: Story = {
  render: () => <ControlledExample />,
}
