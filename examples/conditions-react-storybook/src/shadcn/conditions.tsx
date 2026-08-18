import { type ContactsQuery } from '../shared/definition.ts'
import { base } from './conditions-hook.ts'
import { ContactTable, QueryDetails } from './contact-table.tsx'
import {
  ClearButton,
  ConditionTree,
  GroupNode,
  MobileFilterHeader,
} from './filter-bar.tsx'
import { FilterChip } from './filter-chip.tsx'
import { CurrencyEditor, DateEditor, StringEditor } from './value-editors.tsx'

export const shadcnConditions = base.extendConditions({
  valueEditors: { string: StringEditor, date: DateEditor },
  fieldValueEditors: { arr: CurrencyEditor },
  conditionComponents: { FilterChip },
  groupComponents: { GroupNode },
  conditionsComponents: { ConditionTree, ClearButton },
})

export interface ShadcnBuilderProps {
  defaultValue?: ContactsQuery
  value?: ContactsQuery
  onValueChange?(value: ContactsQuery): void
  eyebrow?: string
}

export function ShadcnBuilder({
  defaultValue,
  value,
  onValueChange,
  eyebrow = 'Contact filters',
}: ShadcnBuilderProps) {
  const conditions = shadcnConditions.useConditions({
    defaultValue,
    value,
    onValueChange: (details) => onValueChange?.(details.value),
  })

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
                <conditions.ConditionTree />
              </div>
              <div className="hidden sm:block">
                <conditions.ClearButton />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-8 sm:py-8">
          <ContactTable />
          <QueryDetails />
        </div>
      </conditions.Root>
    </main>
  )
}
