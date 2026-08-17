import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { Condition } from '../types/condition.types.ts'
import { createConditionQuery } from './expression.ts'
import { defineConditions } from './schema.ts'
import { validateConditionQuery } from './validation.ts'

const conditions = defineConditions({
  fields: {
    status: {
      schema: z.string(),
      type: 'enum',
      operators: ['equals'],
    },
  },
})

const condition = (
  id: string,
  field: string,
  operator: string,
  value: unknown,
): Condition => ({ kind: 'condition', id, field, operator, value })

describe('condition validation', () => {
  it('reports duplicate expression ids', () => {
    const query = createConditionQuery({
      items: [
        condition('same', 'status', 'equals', 'active'),
        condition('same', 'status', 'equals', 'pending'),
      ],
    })

    expect(validateConditionQuery(query, conditions).issues).toContainEqual(
      expect.objectContaining({ code: 'duplicate_id', nodeId: 'same' }),
    )
  })

  it('reports unknown fields and disallowed operators with paths', () => {
    const query = createConditionQuery({
      items: [
        condition('unknown', 'missing', 'equals', 'active'),
        condition('operator', 'status', 'contains', 'active'),
      ],
    })

    expect(validateConditionQuery(query, conditions).issues).toEqual([
      expect.objectContaining({
        code: 'unknown_field',
        path: ['root', 'items', 0, 'field'],
      }),
      expect.objectContaining({
        code: 'operator_not_allowed',
        path: ['root', 'items', 1, 'operator'],
      }),
    ])
  })
})
