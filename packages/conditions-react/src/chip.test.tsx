import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useConditionChip } from './chip.ts'
import { createConditionsController } from './controller.ts'
import type { ConditionDraft } from './draft.ts'
import { testDefinition } from './test-fixtures.ts'

describe('useConditionChip', () => {
  it('orchestrates an add draft through the value panel', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    conditions.draft.beginAddCondition({ field: 'name' })
    const draft = conditions.draft.get().draft as ConditionDraft<
      typeof testDefinition
    >

    const { result } = renderHook(() =>
      useConditionChip(conditions, { draft }),
    )
    expect(result.current.isDraft).toBe(true)
    expect(result.current.field).toBe('name')
    expect(result.current.operator).toBe('contains')

    act(() => result.current.openPanel('value'))
    expect(result.current.panel).toBe('value')

    act(() => result.current.setValue('Ada'))
    let id: string | undefined
    act(() => {
      id = result.current.apply()
    })
    expect(id).toBeTypeOf('string')
    expect(result.current.panel).toBe(null)
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      field: 'name',
      operator: 'contains',
      value: 'Ada',
    })
  })

  it('commits in one step when applying with a final patch', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    conditions.draft.beginAddCondition({ field: 'status' })
    const draft = conditions.draft.get().draft as ConditionDraft<
      typeof testDefinition
    >

    const { result } = renderHook(() =>
      useConditionChip(conditions, { draft }),
    )
    act(() => {
      result.current.apply({ value: 'active' })
    })
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      field: 'status',
      value: 'active',
    })
    expect(conditions.draft.get().draft).toBeUndefined()
  })

  it('begins an edit draft when opening a committed chip panel', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    const id = conditions.actions.addCondition({ field: 'name', value: 'Ada' })
    const condition = conditions.store.get().value.root.items[0] as any

    const { result } = renderHook(() =>
      useConditionChip(conditions, { condition }),
    )
    expect(result.current.isDraft).toBe(false)
    expect(result.current.value).toBe('Ada')

    act(() => result.current.openPanel('operator'))
    expect(result.current.panel).toBe('operator')
    expect(conditions.draft.get().draft).toMatchObject({
      mode: 'edit',
      conditionId: id,
    })

    // isNull takes no value, so selecting it commits immediately.
    act(() => result.current.selectOperator('isNull'))
    expect(result.current.panel).toBe(null)
    expect(conditions.draft.get().draft).toBeUndefined()
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      operator: 'isNull',
    })
  })

  it('advances to the value panel after selecting a field', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    conditions.draft.beginAddCondition()
    const draft = conditions.draft.get().draft as ConditionDraft<
      typeof testDefinition
    >

    const { result } = renderHook(() =>
      useConditionChip(conditions, { draft }),
    )
    act(() => result.current.selectField('age'))
    expect(result.current.panel).toBe('value')
    expect(conditions.draft.get().draft).toMatchObject({
      field: 'age',
      operator: 'equals',
    })
  })

  it('cancels drafts and removes committed conditions', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    conditions.draft.beginAddCondition({ field: 'name' })
    const draft = conditions.draft.get().draft as ConditionDraft<
      typeof testDefinition
    >
    const { result: draftChip } = renderHook(() =>
      useConditionChip(conditions, { draft }),
    )
    act(() => draftChip.current.remove())
    expect(conditions.draft.get().draft).toBeUndefined()

    conditions.actions.addCondition({ field: 'name', value: 'Ada' })
    const condition = conditions.store.get().value.root.items[0] as any
    const { result: chip } = renderHook(() =>
      useConditionChip(conditions, { condition }),
    )
    act(() => chip.current.remove())
    expect(conditions.store.get().value.root.items).toEqual([])
  })
})
