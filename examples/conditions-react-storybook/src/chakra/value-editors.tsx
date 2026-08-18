import { Box, HStack, Input, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import type { ValueEditorProps } from '@saas-js/conditions-react'

export function ChakraStringEditor({
  value,
  onValueChange,
  error,
}: ValueEditorProps<string>) {
  return (
    <Input
      autoFocus
      size="sm"
      aria-label="Condition value"
      aria-invalid={Boolean(error)}
      placeholder="Enter a value…"
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value)}
    />
  )
}

export function ChakraCurrencyEditor({
  value,
  onValueChange,
  operator,
  error,
}: ValueEditorProps<number | readonly [number, number]>) {
  const values = Array.isArray(value) ? value : [value]
  const update = (index: number, raw: string) => {
    const parsed = raw === '' ? undefined : Number(raw)
    if (operator.valueMode === 'range') {
      const range = [values[0], values[1]]
      range[index] = parsed
      onValueChange(range as unknown as readonly [number, number])
    } else onValueChange(parsed as number)
  }
  return (
    <HStack minW="220px" gap="2">
      {(operator.valueMode === 'range' ? [0, 1] : [0]).map((index) => (
        <Box key={index} flex="1" position="relative">
          <Text
            position="absolute"
            left="2.5"
            top="1.5"
            zIndex="1"
            color="gray.500"
            fontSize="sm"
          >
            $
          </Text>
          <Input
            autoFocus={index === 0}
            size="sm"
            ps="6"
            type="number"
            aria-label={index ? 'Maximum ARR' : 'ARR value'}
            aria-invalid={Boolean(error)}
            value={values[index] == null ? '' : String(values[index])}
            onChange={(event) => update(index, event.target.value)}
          />
        </Box>
      ))}
    </HStack>
  )
}

export function ChakraDateEditor({
  value,
  onValueChange,
  operator,
}: ValueEditorProps<Date | readonly [Date, Date]>) {
  const values = Array.isArray(value) ? value : [value]
  const update = (index: number, raw: string) => {
    const parsed = raw ? new Date(`${raw}T00:00:00`) : undefined
    if (operator.valueMode === 'range') {
      const range = [values[0], values[1]]
      range[index] = parsed
      onValueChange(range as unknown as readonly [Date, Date])
    } else onValueChange(parsed as Date)
  }
  return (
    <HStack gap="2">
      {(operator.valueMode === 'range' ? [0, 1] : [0]).map((index) => (
        <Input
          key={index}
          autoFocus={index === 0}
          size="sm"
          type="date"
          aria-label={index ? 'Range end' : 'Condition date'}
          value={
            values[index] instanceof Date
              ? format(values[index], 'yyyy-MM-dd')
              : ''
          }
          onChange={(event) => update(index, event.target.value)}
        />
      ))}
    </HStack>
  )
}
