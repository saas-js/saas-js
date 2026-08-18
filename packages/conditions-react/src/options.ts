import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ConditionOption } from '@saas-js/conditions'

import type {
  AnyConditionsDefinition,
  ConditionsController,
  DefinitionFieldId,
} from './types.ts'

export interface UseConditionOptionsOptions<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  field: DefinitionFieldId<TDefinition>
  /**
   * Current condition value, forwarded to async option sources for context.
   * Changing it does not trigger a refetch; sources receive the latest value
   * when they run.
   */
  value?: unknown
  initialQuery?: string
  /** Debounce applied to query-driven refetches of async sources. */
  debounceMs?: number
}

export interface ConditionOptionsResult<TValue = unknown, TMeta = unknown> {
  options: readonly ConditionOption<TValue, TMeta>[]
  query: string
  setQuery(query: string): void
  loading: boolean
  error: Error | undefined
  reload(): void
}

const defaultBooleanOptions: readonly ConditionOption<boolean>[] = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
]

export function useConditionOptions<
  TDefinition extends AnyConditionsDefinition,
  TValue = unknown,
  TMeta = unknown,
>(
  conditions: ConditionsController<TDefinition>,
  options: UseConditionOptionsOptions<TDefinition>,
): ConditionOptionsResult<TValue, TMeta> {
  const field = conditions.definition.fields[options.field]
  const source =
    field?.options ??
    (field?.type === 'boolean' ? defaultBooleanOptions : undefined)
  const debounceMs = options.debounceMs ?? 0
  const [query, setQuery] = useState(options.initialQuery ?? '')
  const [reloadIndex, setReloadIndex] = useState(0)
  const requestId = useRef(0)
  const valueRef = useRef(options.value)
  const requestedQueryRef = useRef<string | undefined>(undefined)
  const staticOptions = Array.isArray(source)
    ? (source as readonly ConditionOption<TValue, TMeta>[])
    : undefined
  const [result, setResult] = useState<{
    options: readonly ConditionOption<TValue, TMeta>[]
    loading: boolean
    error: Error | undefined
  }>(() => ({
    options: staticOptions ?? [],
    loading: false,
    error: undefined,
  }))

  useEffect(() => {
    valueRef.current = options.value
  })

  useEffect(() => {
    if (!source) {
      setResult({ options: [], loading: false, error: undefined })
      return
    }
    if (Array.isArray(source)) {
      setResult({
        options: source as readonly ConditionOption<TValue, TMeta>[],
        loading: false,
        error: undefined,
      })
      return
    }

    const controller = new AbortController()
    const currentRequest = ++requestId.current
    const isQueryRefetch =
      requestedQueryRef.current !== undefined &&
      requestedQueryRef.current !== query
    requestedQueryRef.current = query
    setResult((current) => ({ ...current, loading: true, error: undefined }))

    const load = () => {
      Promise.resolve(
        source({
          field: options.field,
          query,
          value: valueRef.current,
          signal: controller.signal,
        }),
      ).then(
        (loaded) => {
          if (
            controller.signal.aborted ||
            currentRequest !== requestId.current
          ) {
            return
          }
          setResult({
            options: loaded as readonly ConditionOption<TValue, TMeta>[],
            loading: false,
            error: undefined,
          })
        },
        (reason: unknown) => {
          if (
            controller.signal.aborted ||
            currentRequest !== requestId.current
          ) {
            return
          }
          setResult({
            options: [],
            loading: false,
            error: reason instanceof Error ? reason : new Error(String(reason)),
          })
        },
      )
    }

    if (isQueryRefetch && debounceMs > 0) {
      const timeout = setTimeout(load, debounceMs)
      return () => {
        clearTimeout(timeout)
        controller.abort()
      }
    }

    load()
    return () => controller.abort()
  }, [source, options.field, query, reloadIndex, debounceMs])

  const reload = useCallback(() => setReloadIndex((value) => value + 1), [])
  return useMemo(
    () => ({ ...result, query, setQuery, reload }),
    [query, reload, result],
  )
}
