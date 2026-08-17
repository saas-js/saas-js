import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  defaultOperators,
  defineOperator,
  getOperatorsByType,
} from './operators.ts'

describe('default condition operators', () => {
  it('has unique identifiers and explicit value modes', () => {
    const ids = defaultOperators.map((operator) => operator.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(defaultOperators.every((operator) => operator.valueMode)).toBe(true)
  })

  it('supports ranges and value-less null checks', () => {
    const between = defaultOperators.find(
      (operator) => operator.id === 'between',
    )!
    const isNull = defaultOperators.find(
      (operator) => operator.id === 'isNull',
    )!

    expect(between.comparator(5, [1, 10])).toBe(true)
    expect(between.comparator(11, [1, 10])).toBe(false)
    expect(isNull.comparator(undefined)).toBe(true)
  })

  it('selects operators by field type', () => {
    const ids = getOperatorsByType('string').map((operator) => operator.id)
    expect(ids).toContain('contains')
    expect(ids).not.toContain('between')
  })

  it('infers custom comparator values from Standard Schema', () => {
    const matches = defineOperator({
      id: 'matches',
      label: 'matches',
      types: ['string'],
      valueMode: 'single',
      subjectSchema: z.string(),
      valueSchema: z.object({ pattern: z.string(), flags: z.string() }),
      comparator(actual, expected) {
        const subject: string = actual
        const pattern: { pattern: string; flags: string } = expected
        return new RegExp(pattern.pattern, pattern.flags).test(subject)
      },
    })

    expect(
      matches.comparator('SaaS UI', { pattern: '^saas', flags: 'i' }, {
        field: 'name',
        type: 'string',
        operator: 'matches',
      }),
    ).toBe(true)
  })
})
