import { memo, useEffect, useRef, useState } from 'react'

import {
  Box,
  Button,
  Flex,
  Input,
  Popover,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
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
import { base } from './conditions-hook.ts'
import {
  DraftChip,
  FieldIcon,
  FilterChip,
  PopupSurface,
  menuButtonProps,
} from './filter-chip.tsx'

export function AddFilterMenu({ parentId }: { parentId: string }) {
  const conditions = base.useConditionsContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [enumFieldId, setEnumFieldId] = useState<string | null>(null)
  const submenuCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const normalized = query.toLocaleLowerCase()
  const fields = fieldEntries.filter(([id, field]) =>
    `${field.label ?? ''} ${id}`.toLocaleLowerCase().includes(normalized),
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
    setQuery('')
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open)
        if (!details.open) {
          setEnumFieldId(null)
          setQuery('')
        }
      }}
      positioning={{ placement: 'bottom-start', offset: { mainAxis: 8 } }}
    >
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          h="9"
          px="2.5"
          color="gray.600"
          _hover={{ bg: 'gray.200' }}
        >
          <CirclePlus size={16} /> Filter
        </Button>
      </Popover.Trigger>
      <PopupSurface>
        <Box>
          <Box p="2" borderBottomWidth="1px">
            <Input
              autoFocus
              size="sm"
              aria-label="Add filter"
              placeholder="Add filter…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Box>
          <Stack gap="0.5" p="1.5">
            {fields.map(([id, field]) => {
              const hasSubmenu =
                field.type === 'enum' && Array.isArray(field.options)
              if (hasSubmenu) {
                return (
                  <Popover.Root
                    key={id}
                    open={enumFieldId === id}
                    positioning={{
                      placement: 'right-start',
                      offset: { mainAxis: 4 },
                    }}
                  >
                    <Popover.Anchor asChild>
                      <Button
                        {...menuButtonProps}
                        aria-haspopup="menu"
                        onMouseEnter={() => showSubmenu(id)}
                        onMouseLeave={hideSubmenuSoon}
                        onClick={() => showSubmenu(id)}
                      >
                        <Box color="gray.500">
                          <FieldIcon field={id} />
                        </Box>
                        <Text flex="1" textAlign="left">
                          {field.label ?? id}
                        </Text>
                        <ChevronRight size={14} />
                      </Button>
                    </Popover.Anchor>
                    <Portal>
                      <Popover.Positioner>
                        <Popover.Content
                          w="224px"
                          p="1.5"
                          borderRadius="lg"
                          bg="white"
                          borderWidth="1px"
                          boxShadow="0 14px 36px rgba(0, 0, 0, 0.14)"
                          outline="none"
                          role="menu"
                          aria-label={`${field.label ?? id} values`}
                          onMouseEnter={cancelSubmenuClose}
                          onMouseLeave={hideSubmenuSoon}
                        >
                          <Stack gap="0.5">
                            {field.options.map((option) => (
                              <Button
                                key={String(option.value)}
                                {...menuButtonProps}
                                role="menuitem"
                                onClick={() => {
                                  conditions.actions.addCondition(
                                    { field: id, value: option.value } as any,
                                    { parentId },
                                  )
                                  close()
                                }}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </Stack>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Portal>
                  </Popover.Root>
                )
              }
              return (
                <Button
                  key={id}
                  {...menuButtonProps}
                  onClick={() => {
                    close()
                    conditions.draft.beginAddCondition({
                      parentId,
                      field: id,
                    })
                  }}
                >
                  <Box color="gray.500">
                    <FieldIcon field={id} />
                  </Box>
                  <Text flex="1" textAlign="left">
                    {field.label ?? id}
                  </Text>
                </Button>
              )
            })}
            {!fields.length ? (
              <Text
                px="3"
                py="6"
                textAlign="center"
                fontSize="sm"
                color="gray.500"
              >
                No field found.
              </Text>
            ) : null}
            <Box borderTopWidth="1px" my="1" />
            <Button
              {...menuButtonProps}
              onClick={() => {
                close()
                conditions.actions.addGroup({ combinator: 'and' }, { parentId })
              }}
            >
              <Box color="gray.500">
                <Layers3 size={14} />
              </Box>{' '}
              Add filter group
            </Button>
          </Stack>
        </Box>
      </PopupSurface>
    </Popover.Root>
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
    <Popover.Root
      positioning={{ placement: 'bottom-start', offset: { mainAxis: 6 } }}
    >
      <Popover.Trigger asChild>
        <Button
          display={hideOnMobile ? { base: 'none', sm: 'flex' } : undefined}
          variant="ghost"
          size="xs"
          h="8"
          px="2"
          color="gray.500"
        >
          {group.combinator === 'and' ? 'All' : 'Any'} <ChevronDown size={12} />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="190px"
            borderRadius="lg"
            bg="white"
            borderWidth="1px"
            boxShadow="lg"
            outline="none"
          >
            <Stack gap="0.5" p="1.5">
              {(['and', 'or'] as const).map((value) => (
                <Button
                  key={value}
                  {...menuButtonProps}
                  onClick={() =>
                    conditions.actions.updateGroup(group.id, {
                      combinator: value,
                    })
                  }
                >
                  <Text flex="1" textAlign="left">
                    {value === 'and' ? 'Match all' : 'Match any'}
                  </Text>
                  {group.combinator === value ? <Check size={14} /> : null}
                </Button>
              ))}
            </Stack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
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
      <Flex
        as="section"
        minW="0"
        w={!root ? 'full' : undefined}
        wrap="wrap"
        align="center"
        gap="2"
        bg={!root ? 'white' : undefined}
        borderWidth={!root ? '1px' : undefined}
        borderRadius={!root ? 'xl' : undefined}
        p={!root ? '2' : undefined}
        ps={!root ? '3' : undefined}
        boxShadow={!root ? 'sm' : undefined}
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
          <Button
            ms="auto"
            variant="ghost"
            size="xs"
            boxSize="8"
            minW="8"
            color="gray.400"
            aria-label="Remove group"
            onClick={() => conditions.actions.remove(id)}
          >
            <X size={14} />
          </Button>
        ) : null}
      </Flex>
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
      size="xs"
      h="8"
      color="gray.500"
      onClick={() => conditions.actions.clear()}
    >
      <RotateCcw size={14} /> Clear
    </Button>
  )
}

export function MobileFilterHeader() {
  const conditions = base.useConditionsContext()
  const root = conditions.useRoot()
  return (
    <Flex
      display={{ base: 'flex', sm: 'none' }}
      align="center"
      justify="space-between"
      mb="2"
    >
      {root.items.length > 1 ? (
        <CombinatorMenu group={root} />
      ) : (
        <Text px="2" fontSize="xs" fontWeight="medium" color="gray.500">
          Filters
        </Text>
      )}
      <ClearButton />
    </Flex>
  )
}
