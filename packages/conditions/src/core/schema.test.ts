import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { defaultOperators, defineOperator } from './operators.ts'
import { defineConditions } from './schema.ts'

const matches = defineOperator({
  id: 'matches',
  label: 'matches',
  types: ['string'],
  valueMode: 'single',
  subjectSchema: z.string(),
  valueSchema: z.object({
    pattern: z.string().min(1),
    flags: z.string().default('i'),
  }),
  serialize(value) {
    return `${value.flags}:${value.pattern}`
  },
  deserialize(value) {
    const [flags, pattern] = String(value).split(':')
    return { flags, pattern }
  },
  comparator(actual, expected) {
    return new RegExp(expected.pattern, expected.flags).test(actual)
  },
})

const contacts = defineConditions({
  operators: [...defaultOperators, matches],
  fields: {
    name: {
      type: 'string',
      schema: z.string(),
      operators: ['equals', 'matches'],
      defaultOperator: 'matches',
    },
    age: {
      type: 'number',
      schema: z.number().int().min(0),
      operators: ['gte', 'between'],
      defaultOperator: 'gte',
    },
    status: {
      type: 'enum',
      schema: z.enum(['active', 'disabled']),
      operators: ['equals', 'in', 'isNull'],
      defaultOperator: 'equals',
    },
  },
})

describe('defineConditions', () => {
  it('owns pure operations and creates independent stores', () => {
    const store = contacts.createStore()
    store.actions.addCondition({
      id: 'name',
      field: 'name',
      operator: 'matches',
      value: { pattern: '^saas' },
    })

    expect(store.get().value.root.items[0]).toMatchObject({
      value: { pattern: '^saas', flags: 'i' },
    })
    expect(store.evaluate({ name: 'SaaS UI' })).toBe(true)
    expect(store.evaluate({ name: 'Chakra UI' })).toBe(false)

    const serialized = contacts.serialize(store.get().value)
    expect(serialized.root.items[0]).toMatchObject({ value: 'i:^saas' })
    expect(contacts.parse(serialized)).toEqual(store.get().value)
    expect(contacts.createStore().get().value.root.items).toEqual([])
  })

  it('uses field schemas for single, multiple, and range operands', () => {
    const store = contacts.createStore()

    store.actions.addCondition({
      field: 'status',
      operator: 'in',
      value: ['active'],
    })
    store.actions.addCondition({
      field: 'age',
      operator: 'between',
      value: [18, 65],
    })

    expect(() =>
      store.actions.addCondition({
        field: 'age',
        operator: 'between',
        value: [18, -1],
      }),
    ).toThrow()
  })

  it('stores transformed Standard Schema outputs', () => {
    const numbers = defineConditions({
      fields: {
        amount: {
          type: 'number',
          schema: z.coerce.number().int(),
          operators: ['equals'],
        },
      },
    })
    const store = numbers.createStore()

    store.actions.addCondition({ field: 'amount', value: '42' })

    expect(store.get().value.root.items[0]).toMatchObject({ value: 42 })
  })
})

const assertConditionTypes = () => {
  const store = contacts.createStore()

  store.actions.addCondition({
    field: 'name',
    operator: 'matches',
    value: { pattern: '^saas' },
  })
  store.actions.addCondition({
    field: 'status',
    operator: 'in',
    value: ['active', 'disabled'],
  })
  store.actions.addCondition({
    field: 'age',
    operator: 'between',
    value: [18, 65],
  })

  // @ts-expect-error Omitting an operator uses the field's default operator.
  store.actions.addCondition({
    field: 'status',
    value: ['active'],
  })

  // @ts-expect-error Custom operator values come from valueSchema.
  store.actions.addCondition({
    field: 'name',
    operator: 'matches',
    value: 'saas',
  })

  // @ts-expect-error Multiple operators require an array of field values.
  store.actions.addCondition({
    field: 'status',
    operator: 'in',
    value: 'active',
  })

  // @ts-expect-error Range operators require a two-value tuple.
  store.actions.addCondition({
    field: 'age',
    operator: 'between',
    value: 18,
  })

  // @ts-expect-error Value-less operators do not accept a value.
  store.actions.addCondition({
    field: 'status',
    operator: 'isNull',
    value: 'active',
  })

  defineConditions({
    operators: [...defaultOperators, matches],
    fields: {
      count: {
        type: 'number',
        schema: z.number(),
        // @ts-expect-error The matches operator only supports string fields.
        operators: ['matches'],
      },
    },
  })
}

void assertConditionTypes
