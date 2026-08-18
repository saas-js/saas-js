import { memo, useState } from 'react'

import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Popover,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
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
import { base } from './conditions-hook.ts'

type ContactChip = ConditionChipApi<typeof contactsDefinition>

export function FieldIcon({ field }: { field?: string }) {
  const Icon = fieldIcon(field)
  return <Icon size={14} />
}

export const menuButtonProps = {
  variant: 'ghost',
  justifyContent: 'flex-start',
  h: '9',
  px: '2.5',
  borderRadius: 'md',
  fontWeight: 'normal',
  fontSize: 'sm',
  _hover: { bg: 'gray.100' },
} as const

export function PopupSurface({ children }: { children: React.ReactNode }) {
  return (
    <Portal>
      <Popover.Positioner>
        <Popover.Content
          w="288px"
          overflow="hidden"
          borderRadius="lg"
          bg="white"
          borderWidth="1px"
          boxShadow="0 14px 36px rgba(0, 0, 0, 0.14)"
          outline="none"
        >
          {children}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  )
}

export function FieldMenu({
  value,
  onSelect,
}: {
  value?: string
  onSelect(value: ContactFieldId): void
}) {
  const [query, setQuery] = useState('')
  const normalized = query.toLocaleLowerCase()
  const fields = fieldEntries.filter(([id, field]) =>
    `${field.label ?? ''} ${id}`.toLocaleLowerCase().includes(normalized),
  )
  return (
    <Box>
      <Box p="2" borderBottomWidth="1px">
        <Input
          autoFocus
          size="sm"
          aria-label="Search fields"
          placeholder="Search fields…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Box>
      <Stack gap="0.5" p="1.5">
        {fields.map(([id, field]) => (
          <Button key={id} {...menuButtonProps} onClick={() => onSelect(id)}>
            <Box color="gray.500">
              <FieldIcon field={id} />
            </Box>
            <Text flex="1" textAlign="left">
              {field.label ?? id}
            </Text>
            {id === value ? <Check size={14} /> : null}
          </Button>
        ))}
        {!fields.length ? (
          <Text px="3" py="6" textAlign="center" fontSize="sm" color="gray.500">
            No field found.
          </Text>
        ) : null}
      </Stack>
    </Box>
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
    <Stack gap="0.5" p="1.5">
      <Text
        px="2.5"
        py="1"
        fontSize="10px"
        fontWeight="semibold"
        letterSpacing="wide"
        color="gray.500"
        textTransform="uppercase"
      >
        Operator
      </Text>
      {operators.map((operator) => (
        <Button
          key={operator.id}
          {...menuButtonProps}
          onClick={() => onSelect(operator.id)}
        >
          <Text flex="1" textAlign="left">
            {operator.label}
          </Text>
          {operator.id === value ? <Check size={14} /> : null}
        </Button>
      ))}
    </Stack>
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
    <Box>
      {asyncOptions ? (
        <Box p="2" borderBottomWidth="1px">
          <Input
            autoFocus
            size="sm"
            aria-label={`Search ${field?.label?.toLocaleLowerCase() ?? 'options'}`}
            placeholder={`Search ${field?.label?.toLocaleLowerCase() ?? 'options'}…`}
            value={result.query}
            onChange={(event) => result.setQuery(event.target.value)}
          />
        </Box>
      ) : null}
      <Stack gap="0.5" p="1.5">
        {result.options.map((option) => {
          const checked = multiple
            ? selected.includes(option.value)
            : chip.value === option.value
          return (
            <Button
              key={String(option.value)}
              {...menuButtonProps}
              onClick={() => {
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
              <Flex
                boxSize="4"
                align="center"
                justify="center"
                borderWidth="1px"
                borderRadius="full"
                bg={checked ? 'gray.900' : 'white'}
                color="white"
              >
                {checked ? <Check size={10} /> : null}
              </Flex>
              <Text>{option.label}</Text>
            </Button>
          )
        })}
        {!result.options.length ? (
          <Text px="3" py="6" textAlign="center" fontSize="sm" color="gray.500">
            {result.loading ? 'Loading options…' : 'No option found.'}
          </Text>
        ) : null}
      </Stack>
    </Box>
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
    <Box>
      <Box px="3" py="2.5" borderBottomWidth="1px">
        <Text fontSize="xs" color="gray.500" fontWeight="medium">
          {field.label ?? 'Value'}{' '}
          <Text as="span" fontWeight="normal">
            · {operator.label}
          </Text>
        </Text>
      </Box>
      {hasOptions ? (
        <OptionValueMenu chip={chip} fieldId={fieldId} />
      ) : (
        <Stack p="3" gap="2.5">
          <conditions.ValueEditor
            field={chip.field}
            operator={chip.operator}
            value={chip.value}
            error={chip.error}
            onValueChange={chip.setValue}
          />
          {chip.error ? (
            <Text color="red.600" fontSize="xs" role="alert">
              {chip.error}
            </Text>
          ) : null}
        </Stack>
      )}
      {!hasOptions || multiple ? (
        <HStack justify="flex-end" borderTopWidth="1px" px="3" py="2">
          <Button size="sm" variant="ghost" onClick={() => chip.close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg="gray.900"
            color="white"
            aria-label="Apply filter"
            onClick={() => chip.apply()}
          >
            Apply
          </Button>
        </HStack>
      ) : null}
    </Box>
  )
}

const segmentProps = {
  variant: 'ghost',
  h: '9',
  px: '2.5',
  borderRadius: '0',
  fontSize: 'sm',
  fontWeight: 'normal',
  whiteSpace: 'nowrap',
  _hover: { bg: 'gray.50' },
} as const

function ChipShell({ chip }: { chip: ContactChip }) {
  const field = fieldDetails(chip.field)
  const operator = operatorDetails(chip.operator)
  const value = valueLabel(chip.field, chip.value)

  return (
    <Popover.Root
      open={chip.panel !== null}
      onOpenChange={(details) => !details.open && chip.close()}
      positioning={{ placement: 'bottom-start', offset: { mainAxis: 8 } }}
    >
      <Popover.Anchor asChild>
        <HStack
          display="inline-flex"
          flexShrink="0"
          gap="0"
          h="9"
          overflow="hidden"
          bg="white"
          borderWidth="1px"
          borderColor={chip.isDraft ? 'gray.400' : 'gray.200'}
          borderRadius="lg"
          boxShadow={
            chip.isDraft
              ? '0 0 0 2px var(--chakra-colors-gray-200)'
              : '0 1px 1px rgba(0,0,0,0.03)'
          }
          data-testid={chip.isDraft ? 'condition-draft' : 'filter-chip'}
        >
          <Button
            {...segmentProps}
            minW="0"
            gap="2"
            fontWeight="medium"
            onClick={() => chip.openPanel('field')}
          >
            <Box color="gray.500">
              <FieldIcon field={chip.field} />
            </Box>
            <Text truncate>{field.label}</Text>
          </Button>
          <Button
            {...segmentProps}
            borderLeftWidth="1px"
            color="gray.500"
            onClick={() => chip.openPanel('operator')}
          >
            {operatorChipLabel(chip.operator)}
          </Button>
          {operator?.valueMode !== 'none' ? (
            <Button
              {...segmentProps}
              minW="0"
              maxW="180px"
              borderLeftWidth="1px"
              color={value ? 'gray.900' : 'gray.400'}
              fontStyle={value ? 'normal' : 'italic'}
              onClick={() => chip.openPanel('value')}
            >
              <Text truncate>{value || 'Choose value…'}</Text>
            </Button>
          ) : null}
          <Button
            {...segmentProps}
            px="0"
            w="9"
            minW="9"
            borderLeftWidth="1px"
            color="gray.400"
            aria-label={`Remove ${field.label} filter`}
            onClick={() => chip.remove()}
          >
            <X size={14} />
          </Button>
        </HStack>
      </Popover.Anchor>
      <PopupSurface>
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
      </PopupSurface>
    </Popover.Root>
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
