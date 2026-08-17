import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { defineConditions } from './schema.ts'

const conditions = defineConditions({
  fields: {
    status: {
      schema: z.enum(['active', 'pending', 'disabled']),
      type: 'enum',
      operators: ['equals', 'not'],
      defaultOperator: 'equals',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'disabled', label: 'Disabled' },
      ],
    },
    age: {
      schema: z.number().min(0, 'Age cannot be negative.'),
      type: 'number',
      operators: ['equals', 'gte', 'lte', 'between'],
      defaultOperator: 'gte',
    },
    name: {
      schema: z.string(),
      type: 'string',
      operators: ['contains', 'equals'],
      defaultOperator: 'contains',
    },
  },
})

describe('conditions store', () => {
  it('supports duplicate fields and immutable AND/OR grouping', () => {
    const store = conditions.createStore()

    store.actions.addCondition({
      id: 'active',
      field: 'status',
      value: 'active',
    })
    store.actions.addCondition({
      id: 'pending',
      field: 'status',
      value: 'pending',
    })

    const beforeGrouping = store.get().value
    const groupId = store.actions.group(['active', 'pending'], 'or', {
      id: 'allowed-statuses',
    })

    expect(groupId).toBe('allowed-statuses')
    expect(beforeGrouping.root.items).toHaveLength(2)
    expect(store.get().value.root.items).toEqual([
      {
        kind: 'group',
        id: 'allowed-statuses',
        combinator: 'or',
        items: [
          {
            kind: 'condition',
            id: 'active',
            field: 'status',
            operator: 'equals',
            value: 'active',
          },
          {
            kind: 'condition',
            id: 'pending',
            field: 'status',
            operator: 'equals',
            value: 'pending',
          },
        ],
      },
    ])
  })

  it('adds, moves, updates, ungroups, and removes nested expressions', () => {
    const store = conditions.createStore()
    const groupId = store.actions.addGroup({
      id: 'details',
      combinator: 'and',
    })
    store.actions.addCondition(
      { id: 'age', field: 'age', value: 18 },
      { parentId: groupId },
    )
    store.actions.addCondition({
      id: 'name',
      field: 'name',
      value: 'Ada',
    })

    store.actions.move('name', { parentId: groupId, index: 0 })
    store.actions.updateCondition('age', { value: 21 })
    store.actions.updateGroup(groupId, { combinator: 'or' })

    const nested = store.get().value.root.items[0]
    expect(nested).toMatchObject({
      kind: 'group',
      combinator: 'or',
      items: [
        { id: 'name', value: 'Ada' },
        { id: 'age', value: 21 },
      ],
    })

    store.actions.ungroup(groupId)
    expect(store.get().value.root.items.map((item) => item.id)).toEqual([
      'name',
      'age',
    ])

    store.actions.remove('name')
    expect(store.get().value.root.items.map((item) => item.id)).toEqual([
      'age',
    ])
  })

  it('publishes one semantic event per committed action', () => {
    const onValueChange = vi.fn()
    const listener = vi.fn()
    const store = conditions.createStore({ onValueChange })
    const subscription = store.subscribe(listener)

    store.actions.addCondition({
      id: 'active',
      field: 'status',
      value: 'active',
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0]?.[0]).toMatchObject({
      reason: 'add-condition',
      previousValue: { root: { items: [] } },
      value: { root: { items: [{ id: 'active' }] } },
    })

    subscription.unsubscribe()
    store.actions.clear()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid mutations without publishing them', () => {
    const onValueChange = vi.fn()
    const store = conditions.createStore({ onValueChange })

    expect(() =>
      store.actions.addCondition({
        id: 'invalid-age',
        field: 'age',
        value: -1,
      }),
    ).toThrow('Age cannot be negative.')

    expect(() =>
      store.actions.addCondition({
        id: 'missing-name',
        field: 'name',
      }),
    ).toThrow('requires a value')

    expect(store.get().value.root.items).toEqual([])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('can reset to its initial query', () => {
    const store = conditions.createStore()
    store.actions.addCondition({
      id: 'active',
      field: 'status',
      value: 'active',
    })
    store.actions.reset()
    expect(store.get().value.root.items).toEqual([])
  })
})

const assertConditionTypes = () => {
  const store = conditions.createStore()

  store.actions.addCondition({
    field: 'status',
    value: 'active',
  })

  // @ts-expect-error Unknown fields are rejected by the schema.
  store.actions.addCondition({ field: 'unknown', value: 'active' })

  // @ts-expect-error Field values are inferred from Standard Schema.
  store.actions.addCondition({ field: 'status', value: 'archived' })

  // @ts-expect-error Operators are narrowed by each field definition.
  store.actions.addCondition({
    field: 'age',
    operator: 'contains',
    value: 18,
  })
}

void assertConditionTypes
