import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { Condition } from '../types/condition.types.ts'
import { evaluateConditionQuery, filterByConditionQuery } from './evaluate.ts'
import { createConditionQuery } from './expression.ts'
import { defineConditions } from './schema.ts'

const conditions = defineConditions({
  fields: {
    status: {
      schema: z.string(),
      type: 'enum',
      operators: ['equals'],
    },
    age: {
      schema: z.number(),
      type: 'number',
      operators: ['gte'],
    },
    name: {
      schema: z.string(),
      type: 'string',
      operators: ['contains'],
      accessor: (subject) => (subject as any).profile.name,
    },
  },
})

const condition = (
  id: string,
  field: string,
  operator: string,
  value: unknown,
): Condition => ({ kind: 'condition', id, field, operator, value })

describe('condition evaluation', () => {
  it('short-circuits nested AND/OR groups', () => {
    const query = createConditionQuery({
      items: [
        {
          kind: 'group',
          id: 'status-group',
          combinator: 'or',
          items: [
            condition('active', 'status', 'equals', 'active'),
            condition('pending', 'status', 'equals', 'pending'),
          ],
        },
        condition('adult', 'age', 'gte', 18),
      ],
    })

    expect(
      evaluateConditionQuery(query, { status: 'active', age: 20 }, conditions),
    ).toBe(true)
    expect(
      evaluateConditionQuery(query, { status: 'pending', age: 16 }, conditions),
    ).toBe(false)
    expect(
      evaluateConditionQuery(query, { status: 'disabled', age: 30 }, conditions),
    ).toBe(false)
  })

  it('supports custom field accessors', () => {
    const query = createConditionQuery({
      items: [condition('name', 'name', 'contains', 'ada')],
    })
    expect(
      evaluateConditionQuery(
        query,
        { profile: { name: 'Ada Lovelace' } },
        conditions,
      ),
    ).toBe(true)
  })

  it('treats an empty AND root as matching all values', () => {
    const query = createConditionQuery()
    expect(filterByConditionQuery([1, 2, 3], query, conditions)).toEqual([
      1, 2, 3,
    ])
  })
})
