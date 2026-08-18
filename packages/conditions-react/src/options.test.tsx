import { useEffect } from 'react'

import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { type ConditionOption, defineConditions } from '@saas-js/conditions'

import { createConditionsController } from './controller.ts'
import { type ConditionOptionsResult, useConditionOptions } from './options.ts'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('async condition options', () => {
  it('starts lazily, aborts obsolete loads, and ignores stale results', async () => {
    const first = deferred<readonly ConditionOption<string>[]>()
    const second = deferred<readonly ConditionOption<string>[]>()
    const signals: AbortSignal[] = []
    const loader = vi.fn(({ query, signal }) => {
      signals.push(signal)
      return query ? second.promise : first.promise
    })
    const definition = defineConditions({
      fields: {
        owner: {
          type: 'string',
          schema: z.string(),
          options: loader,
        },
      },
    })
    const conditions = createConditionsController({ definition })

    expect(loader).not.toHaveBeenCalled()
    let result!: ConditionOptionsResult<string>
    function Editor() {
      result = useConditionOptions<
        string extends never ? never : typeof definition,
        string
      >(conditions, { field: 'owner' })
      return (
        <output>
          {result.loading
            ? 'loading'
            : result.options.map((item) => item.label).join(',')}
        </output>
      )
    }

    render(<Editor />)
    expect(loader).toHaveBeenCalledOnce()
    expect(screen.getByText('loading')).toBeTruthy()

    act(() => result.setQuery('ada'))
    expect(loader).toHaveBeenCalledTimes(2)
    expect(signals[0]?.aborted).toBe(true)

    await act(async () => {
      first.resolve([{ value: 'old', label: 'Old' }])
      await first.promise
    })
    expect(screen.queryByText('Old')).toBeNull()

    await act(async () => {
      second.resolve([{ value: 'ada', label: 'Ada' }])
      await second.promise
    })
    expect(screen.getByText('Ada')).toBeTruthy()
  })

  it('provides default options for boolean fields', () => {
    const definition = defineConditions({
      fields: {
        subscribed: { type: 'boolean', schema: z.boolean() },
      },
    })
    const conditions = createConditionsController({ definition })
    let result!: ConditionOptionsResult

    function Editor() {
      result = useConditionOptions(conditions, { field: 'subscribed' })
      return null
    }

    render(<Editor />)
    expect(result.options).toEqual([
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ])
  })

  it('exposes errors and reloads', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ value: 'ada', label: 'Ada' }])
    const definition = defineConditions({
      fields: {
        owner: { type: 'string', schema: z.string(), options: loader },
      },
    })
    const conditions = createConditionsController({ definition })
    let result!: ConditionOptionsResult

    function Editor() {
      result = useConditionOptions(conditions, { field: 'owner' })
      return <output>{result.error?.message ?? result.options.length}</output>
    }

    render(<Editor />)
    expect(await screen.findByText('offline')).toBeTruthy()
    act(() => result.reload())
    expect(await screen.findByText('1')).toBeTruthy()
  })
})
