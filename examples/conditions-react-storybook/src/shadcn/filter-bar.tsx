import { memo, useEffect, useRef, useState } from 'react'

import {
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Layers3,
  RotateCcw,
  X,
} from 'lucide-react'

import { type ConditionGroup, isConditionGroup } from '@saas-js/conditions'

import { fieldEntries } from '../shared/fields.ts'
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
  PopoverTrigger,
} from './components/ui/popover.tsx'
import { base } from './conditions-hook.ts'
import { DraftChip, FieldIcon, FilterChip } from './filter-chip.tsx'
import { cn } from './lib/utils.ts'

export function AddFilterMenu({ parentId }: { parentId: string }) {
  const conditions = base.useConditionsContext()
  const [open, setOpen] = useState(false)
  const [enumFieldId, setEnumFieldId] = useState<string | null>(null)
  const submenuCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const cancelSubmenuClose = () => {
    if (submenuCloseTimer.current) clearTimeout(submenuCloseTimer.current)
  }
  useEffect(() => cancelSubmenuClose, [])
  const showSubmenu = (fieldId: string) => {
    cancelSubmenuClose()
    setEnumFieldId(fieldId)
  }
  const hideSubmenuSoon = () => {
    cancelSubmenuClose()
    submenuCloseTimer.current = setTimeout(() => setEnumFieldId(null), 120)
  }
  const close = () => {
    cancelSubmenuClose()
    setOpen(false)
    setEnumFieldId(null)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setEnumFieldId(null)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2.5 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-950"
        >
          <CirclePlus className="h-4 w-4" /> Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 overflow-hidden p-0"
        align="start"
        sideOffset={8}
      >
        <Command>
          <CommandInput placeholder="Add filter…" />
          <CommandList className="p-1.5">
            <CommandEmpty>No field found.</CommandEmpty>
            {fieldEntries.map(([id, field]) => {
              const hasSubmenu =
                field.type === 'enum' && Array.isArray(field.options)
              if (hasSubmenu) {
                return (
                  <Popover key={id} open={enumFieldId === id}>
                    <PopoverAnchor asChild>
                      <CommandItem
                        value={`${field.label ?? id} ${id}`}
                        className="gap-2.5 px-2.5 py-2"
                        aria-haspopup="menu"
                        onMouseEnter={() => showSubmenu(id)}
                        onMouseLeave={hideSubmenuSoon}
                        onSelect={() => showSubmenu(id)}
                      >
                        <FieldIcon
                          field={id}
                          className="text-muted-foreground"
                        />
                        <span className="flex-1">{field.label ?? id}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                      </CommandItem>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-56 p-1.5"
                      side="right"
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      onMouseEnter={cancelSubmenuClose}
                      onMouseLeave={hideSubmenuSoon}
                    >
                      <div
                        role="menu"
                        aria-label={`${field.label ?? id} values`}
                      >
                        {field.options.map((option) => (
                          <button
                            key={String(option.value)}
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
                            onClick={() => {
                              conditions.actions.addCondition(
                                { field: id, value: option.value } as any,
                                { parentId },
                              )
                              close()
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              }
              return (
                <CommandItem
                  key={id}
                  value={`${field.label ?? id} ${id}`}
                  className="gap-2.5 px-2.5 py-2"
                  onSelect={() => {
                    close()
                    conditions.draft.beginAddCondition({
                      parentId,
                      field: id,
                    })
                  }}
                >
                  <FieldIcon field={id} className="text-muted-foreground" />
                  <span className="flex-1">{field.label ?? id}</span>
                </CommandItem>
              )
            })}
            <div className="my-1 border-t" />
            <CommandItem
              value="nested filter group"
              className="gap-2.5 px-2.5 py-2"
              onSelect={() => {
                close()
                conditions.actions.addGroup({ combinator: 'and' }, { parentId })
              }}
            >
              <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
              Add filter group
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CombinatorMenu({
  group,
  hideOnMobile = false,
}: {
  group: ConditionGroup
  hideOnMobile?: boolean
}) {
  const conditions = base.useConditionsContext()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100',
            hideOnMobile ? 'hidden sm:flex' : 'flex',
          )}
        >
          {group.combinator === 'and' ? 'All' : 'Any'}{' '}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="start">
        {(['and', 'or'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
            onClick={() =>
              conditions.actions.updateGroup(group.id, { combinator: value })
            }
          >
            <span className="flex-1">
              {value === 'and' ? 'Match all' : 'Match any'}
            </span>
            {group.combinator === value ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * One group node. Subscribes to its own group and to a boolean "has add
 * draft" flag — never to draft contents — so keystrokes inside a chip editor
 * do not rerender the tree. `memo` stops parent rerenders at unchanged
 * subtrees.
 */
export const GroupNode = memo(function GroupNode({
  id,
  root = false,
}: {
  id: string
  root?: boolean
}) {
  const conditions = base.useConditionsContext()
  const group = conditions.useGroup(id)
  const hasAddDraft = conditions.useHasAddDraft(id)
  if (!group) return null
  return (
    <conditions.ConditionGroupScope id={id}>
      <section
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-2',
          !root &&
            'w-full rounded-xl border border-zinc-200 bg-white p-2 pl-3 shadow-sm',
        )}
        aria-label={`${group.combinator.toUpperCase()} condition group`}
      >
        {!root || group.items.length > 1 ? (
          <CombinatorMenu group={group} hideOnMobile={root} />
        ) : null}
        {group.items.map((item) =>
          isConditionGroup(item) ? (
            <GroupNode key={item.id} id={item.id} />
          ) : (
            <conditions.ConditionScope key={item.id} id={item.id}>
              <FilterChip />
            </conditions.ConditionScope>
          ),
        )}
        {hasAddDraft ? <DraftChip parentId={id} /> : null}
        <AddFilterMenu parentId={id} />
        {!root ? (
          <button
            type="button"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Remove group"
            onClick={() => conditions.actions.remove(id)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </section>
    </conditions.ConditionGroupScope>
  )
})

export function ConditionTree() {
  const conditions = base.useConditionsContext()
  const rootId = base.useConditionsSelector(
    conditions,
    (state) => state.value.root.id,
  )
  return <GroupNode id={rootId} root />
}

export function ClearButton() {
  const conditions = base.useConditionsContext()
  const isEmpty = conditions.useIsEmpty()
  if (isEmpty) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-zinc-500"
      onClick={() => conditions.actions.clear()}
    >
      <RotateCcw className="h-3.5 w-3.5" /> Clear
    </Button>
  )
}

export function MobileFilterHeader() {
  const conditions = base.useConditionsContext()
  const root = conditions.useRoot()
  return (
    <div className="mb-2 flex items-center justify-between sm:hidden">
      {root.items.length > 1 ? (
        <CombinatorMenu group={root} />
      ) : (
        <span className="px-2 text-xs font-medium text-zinc-500">Filters</span>
      )}
      <ClearButton />
    </div>
  )
}
