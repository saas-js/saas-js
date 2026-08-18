import { format } from 'date-fns'

import type { ValueEditorProps } from '@saas-js/conditions-react'

import { Input } from './components/ui/input.tsx'

export function StringEditor({
  value,
  onValueChange,
  error,
}: ValueEditorProps<string>) {
  return (
    <Input
      autoFocus
      aria-label="Condition value"
      aria-invalid={Boolean(error)}
      placeholder="Enter a value…"
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value)}
    />
  )
}

export function CurrencyEditor({
  value,
  onValueChange,
  operator,
  error,
}: ValueEditorProps<number | readonly [number, number]>) {
  const values = Array.isArray(value) ? value : [value]
  const update = (index: number, next: string) => {
    const parsed = next === '' ? undefined : Number(next)
    if (operator.valueMode === 'range') {
      const range = [values[0], values[1]]
      range[index] = parsed
      onValueChange(range as unknown as readonly [number, number])
    } else {
      onValueChange(parsed as number)
    }
  }
  return (
    <div className="flex gap-2">
      {(operator.valueMode === 'range' ? [0, 1] : [0]).map((index) => (
        <label key={index} className="relative flex-1">
          <span className="absolute left-3 top-2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            autoFocus={index === 0}
            className="pl-7"
            aria-label={index ? 'Maximum ARR' : 'ARR value'}
            aria-invalid={Boolean(error)}
            type="number"
            value={values[index] == null ? '' : String(values[index])}
            onChange={(event) => update(index, event.target.value)}
          />
        </label>
      ))}
    </div>
  )
}

export function DateEditor({
  value,
  onValueChange,
  operator,
}: ValueEditorProps<Date | readonly [Date, Date]>) {
  const values = Array.isArray(value) ? value : [value]
  const update = (index: number, next: string) => {
    const parsed = next ? new Date(`${next}T00:00:00`) : undefined
    if (operator.valueMode === 'range') {
      const range = [values[0], values[1]]
      range[index] = parsed
      onValueChange(range as unknown as readonly [Date, Date])
    } else {
      onValueChange(parsed as Date)
    }
  }
  return (
    <div className="flex gap-2">
      {(operator.valueMode === 'range' ? [0, 1] : [0]).map((index) => {
        const item = values[index]
        return (
          <Input
            key={index}
            autoFocus={index === 0}
            type="date"
            aria-label={index ? 'Range end' : 'Condition date'}
            value={item instanceof Date ? format(item, 'yyyy-MM-dd') : ''}
            onChange={(event) => update(index, event.target.value)}
          />
        )
      })}
    </div>
  )
}
