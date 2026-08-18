import { memo } from 'react'

import { Check, X } from 'lucide-react'

import { getConditionFieldOperators } from '@saas-js/conditions'
import type { ConditionChipApi } from '@saas-js/conditions-react'

import { contactsDefinition } from '../shared/definition.ts'
import {
  type ContactFieldId,
  fieldDetails,
  fieldEntries,
  fieldIcon,
  operatorChipLabel,
  operatorDetails,
  valueLabel,
} from '../shared/fields.ts'
import { Button } from './components/ui/button.tsx'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './components/ui/command.tsx'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from './components/ui/popover.tsx'
import { base } from './conditions-hook.ts'
import { cn } from './lib/utils.ts'

type ContactChip = ConditionChipApi<typeof contactsDefinition>

export function FieldIcon({
  field,
  className,
}: {
  field?: string
  className?: string
}) {
  const Icon = fieldIcon(field)
  return <Icon className={cn('h-3.5 w-3.5 shrink-0', className)} />
}

export function FieldMenu({
  value,
  onSelect,
}: {
  value?: string
  onSelect(value: ContactFieldId): void
}) {
  return (
    <Command>
      <CommandInput placeholder="Search fields…" />
      <CommandList className="p-1.5">
        <CommandEmpty>No field found.</CommandEmpty>
        {fieldEntries.map(([id, field]) => (
          <CommandItem
            key={id}
            value={`${field.label ?? id} ${id}`}
            className="gap-2.5 px-2.5 py-2"
            onSelect={() => onSelect(id)}
          >
            <FieldIcon field={id} className="text-muted-foreground" />
            <span className="flex-1">{field.label ?? id}</span>
            {id === value ? <Check className="h-3.5 w-3.5" /> : null}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}

function OperatorMenu({
  fieldId,
  value,
  onSelect,
}: {
  fieldId?: string
  value?: string
  onSelect(value: string): void
}) {
  const field = fieldDetails(fieldId).field
  const operators = field
    ? getConditionFieldOperators(contactsDefinition, field)
    : []
  return (
    <div className="p-1.5">
      <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Operator
      </p>
      {operators.map((operator) => (
        <button
          key={operator.id}
          type="button"
          className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
          onClick={() => onSelect(operator.id)}
        >
          <span className="flex-1">{operator.label}</span>
          {operator.id === value ? <Check className="h-3.5 w-3.5" /> : null}
        </button>
      ))}
    </div>
  )
}

function OptionValueMenu({
  chip,
  fieldId,
}: {
  chip: ContactChip
  fieldId: ContactFieldId
}) {
  const conditions = base.useConditionsContext()
  const field = fieldDetails(fieldId).field
  const asyncOptions = typeof field?.options === 'function'
  const result = base.useConditionOptions(conditions, {
    field: fieldId,
    value: chip.value,
    debounceMs: 150,
  })
  const multiple = operatorDetails(chip.operator)?.valueMode === 'multiple'
  const selected = Array.isArray(chip.value) ? chip.value : []

  return (
    <Command shouldFilter={!asyncOptions && !result.loading}>
      {asyncOptions ? (
        <CommandInput
          placeholder={`Search ${field?.label?.toLocaleLowerCase() ?? 'options'}…`}
          value={result.query}
          onValueChange={result.setQuery}
        />
      ) : null}
      <CommandList className="p-1.5">
        <CommandEmpty>
          {result.loading ? 'Loading options…' : 'No option found.'}
        </CommandEmpty>
        {result.options.map((option) => {
          const checked = multiple
            ? selected.includes(option.value)
            : chip.value === option.value
          return (
            <CommandItem
              key={String(option.value)}
              value={String(option.label)}
              className="gap-2.5 px-2.5 py-2"
              onSelect={() => {
                if (multiple) {
                  chip.setValue(
                    checked
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value],
                  )
                } else {
                  chip.apply({ value: option.value })
                }
              }}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border',
                  checked && 'border-zinc-900 bg-zinc-900 text-white',
                )}
              >
                {checked ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              {option.label}
            </CommandItem>
          )
        })}
      </CommandList>
    </Command>
  )
}

function ValuePanel({ chip }: { chip: ContactChip }) {
  const conditions = base.useConditionsContext()
  const field = fieldDetails(chip.field).field
  const operator = operatorDetails(chip.operator)
  const fieldId = chip.field
  if (!fieldId || !field || !operator) return null
  const hasOptions = Boolean(field.options) || field.type === 'boolean'
  const multiple = operator.valueMode === 'multiple'

  return (
    <div>
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {field.label ?? 'Value'}{' '}
          <span className="font-normal">· {operator.label}</span>
        </p>
      </div>
      {hasOptions ? (
        <OptionValueMenu chip={chip} fieldId={fieldId} />
      ) : (
        <div className="space-y-2.5 p-3">
          <conditions.ValueEditor
            field={chip.field}
            operator={chip.operator}
            value={chip.value}
            error={chip.error}
            onValueChange={chip.setValue}
          />
          {chip.error ? (
            <p className="text-xs text-destructive" role="alert">
              {chip.error}
            </p>
          ) : null}
        </div>
      )}
      {!hasOptions || multiple ? (
        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <Button size="sm" variant="ghost" onClick={() => chip.close()}>
            Cancel
          </Button>
          <Button size="sm" aria-label="Apply filter" onClick={() => chip.apply()}>
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ChipShell({ chip }: { chip: ContactChip }) {
  const field = fieldDetails(chip.field)
  const operator = operatorDetails(chip.operator)
  const value = valueLabel(chip.field, chip.value)

  return (
    <Popover
      open={chip.panel !== null}
      onOpenChange={(open) => !open && chip.close()}
    >
      <PopoverAnchor asChild>
        <div
          className={cn(
            'inline-flex h-9 shrink-0 items-stretch overflow-hidden whitespace-nowrap rounded-lg border bg-white text-sm shadow-[0_1px_1px_rgba(0,0,0,0.03)]',
            chip.isDraft && 'border-zinc-400 ring-2 ring-zinc-200',
          )}
          data-testid={chip.isDraft ? 'condition-draft' : 'filter-chip'}
        >
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 px-2.5 hover:bg-zinc-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
            onClick={() => chip.openPanel('field')}
          >
            <FieldIcon field={chip.field} className="text-zinc-500" />
            <span className="truncate font-medium">{field.label}</span>
          </button>
          <button
            type="button"
            className="border-l px-2.5 text-zinc-500 hover:bg-zinc-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
            onClick={() => chip.openPanel('operator')}
          >
            {operatorChipLabel(chip.operator)}
          </button>
          {operator?.valueMode !== 'none' ? (
            <button
              type="button"
              className={cn(
                'min-w-0 border-l px-2.5 text-left hover:bg-zinc-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500',
                !value && 'italic text-zinc-400',
              )}
              onClick={() => chip.openPanel('value')}
            >
              <span className="block max-w-44 truncate">
                {value || 'Choose value…'}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-9 items-center justify-center border-l text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
            aria-label={`Remove ${field.label} filter`}
            onClick={() => chip.remove()}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-72 overflow-hidden p-0"
        align="start"
        sideOffset={8}
      >
        {chip.panel === 'field' ? (
          <FieldMenu value={chip.field} onSelect={chip.selectField} />
        ) : null}
        {chip.panel === 'operator' ? (
          <OperatorMenu
            fieldId={chip.field}
            value={chip.operator}
            onSelect={chip.selectOperator}
          />
        ) : null}
        {chip.panel === 'value' && chip.isDraft ? (
          <ValuePanel chip={chip} />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/**
 * A committed condition chip. Subscribes only to its own condition (via the
 * surrounding `ConditionScope`) and to the draft while it is being edited, so
 * sibling changes and draft keystrokes elsewhere never rerender it.
 */
export const FilterChip = memo(function FilterChip() {
  const { conditions, id } = base.useConditionContext()
  const condition = conditions.useCondition(id)
  const draft = conditions.useEditDraft(id)
  const chip = base.useConditionChip(conditions, { condition, draft })
  if (!condition) return null
  return <ChipShell chip={chip} />
})

/** The in-progress "add condition" chip for one group. */
export function DraftChip({ parentId }: { parentId: string }) {
  const conditions = base.useConditionsContext()
  const draft = conditions.useAddDraft(parentId)
  const chip = base.useConditionChip(conditions, { draft })
  if (!draft) return null
  return <ChipShell chip={chip} />
}
