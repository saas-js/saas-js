import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { defineConditions } from './schema.ts'
import {
  ConditionSerializationError,
  deserializeConditionQuery,
} from './serialization.ts'

const conditions = defineConditions({
  fields: {
    createdAt: {
      schema: z.date(),
      type: 'datetime',
      operators: ['gte', 'lte'],
    },
    point: {
      schema: z.object({ x: z.number(), y: z.number() }),
      type: 'point',
      operators: ['equals', 'within'],
      serialize: ({ x, y }) => `${x},${y}`,
      deserialize: (value) => {
        const [x, y] = String(value).split(',').map(Number)
        return { x, y }
      },
    },
  },
  operators: [
    {
      id: 'equals',
      label: 'is',
      types: ['point'],
      valueMode: 'single',
      comparator: (actual, expected) =>
        JSON.stringify(actual) === JSON.stringify(expected),
    },
    {
      id: 'within',
      label: 'is within',
      types: ['point'],
      valueMode: 'range',
      comparator: () => true,
    },
    {
      id: 'gte',
      label: 'on or after',
      types: ['datetime'],
      valueMode: 'single',
      comparator: () => true,
    },
    {
      id: 'lte',
      label: 'on or before',
      types: ['datetime'],
      valueMode: 'single',
      comparator: () => true,
    },
  ],
})

describe('condition serialization', () => {
  it('round-trips nested queries, dates, and custom serializers', () => {
    const store = conditions.createStore()
    const date = new Date('2026-08-17T12:00:00.000Z')
    store.actions.addCondition({
      id: 'created-after',
      field: 'createdAt',
      operator: 'gte',
      value: date,
    })
    store.actions.addCondition({
      id: 'point',
      field: 'point',
      operator: 'equals',
      value: { x: 10, y: 20 },
    })
    store.actions.addCondition({
      id: 'point-range',
      field: 'point',
      operator: 'within',
      value: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    })

    const serialized = store.serialize()
    expect(serialized).toMatchObject({
      version: 1,
      root: {
        items: [
          { value: '2026-08-17T12:00:00.000Z' },
          { value: '10,20' },
          { value: ['0,0', '100,100'] },
        ],
      },
    })

    const restored = deserializeConditionQuery(
      JSON.stringify(serialized),
      conditions,
    )
    expect(restored.root.items[0]).toMatchObject({ value: date })
    expect(restored.root.items[1]).toMatchObject({ value: { x: 10, y: 20 } })
    expect(restored.root.items[2]).toMatchObject({
      value: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    })
  })

  it('rejects unsupported versions and malformed expressions', () => {
    expect(() =>
      deserializeConditionQuery({ version: 2, root: {} }, conditions),
    ).toThrow(ConditionSerializationError)
    expect(() =>
      deserializeConditionQuery(
        { version: 1, root: { kind: 'group', id: 'root', items: [] } },
        conditions,
      ),
    ).toThrow('Invalid condition group')
  })
})
