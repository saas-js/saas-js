import {
  type Condition,
  boolean,
  createBuilder,
  createSchema,
  number,
  string,
  table,
} from '@rocicorp/zero'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  type ConditionQueryForDefinition,
  defineConditions,
} from '@saas-js/conditions'

import {
  UnsupportedConditionOperatorError,
  conditionsToZero,
} from './index.ts'

const definition = defineConditions({
  fields: {
    status: {
      type: 'enum',
      schema: z.enum(['lead', 'customer', 'churned']),
      operators: ['equals', 'not', 'in', 'notIn'],
    },
    company: {
      type: 'string',
      schema: z.string(),
      operators: ['contains', 'startsWith', 'endsWith', 'equals', 'isNull'],
    },
    arr: {
      type: 'number',
      schema: z.number(),
      operators: ['equals', 'gt', 'gte', 'lt', 'lte', 'between'],
    },
    createdAt: {
      type: 'date',
      schema: z.coerce.date(),
      operators: ['gte', 'lte', 'between'],
    },
    subscribed: {
      type: 'boolean',
      schema: z.boolean(),
      operators: ['equals'],
    },
  },
})

type ContactsQuery = ConditionQueryForDefinition<typeof definition>

const contactsTable = table('contacts')
  .columns({
    id: string(),
    status: string(),
    company: string().optional(),
    arr: number(),
    createdAt: number(), // Zero stores timestamps as epoch millis
    subscribed: boolean(),
  })
  .primaryKey('id')

const schema = createSchema({ tables: [contactsTable] })
const zql = createBuilder(schema)

interface Contact {
  id: string
  status: 'lead' | 'customer' | 'churned'
  company: string | null
  arr: number
  createdAt: Date
  subscribed: boolean
}

const contacts: Contact[] = [
  {
    id: 'northstar',
    status: 'customer',
    company: 'Northstar Labs',
    arr: 84_000,
    createdAt: new Date('2025-01-14T00:00:00Z'),
    subscribed: true,
  },
  {
    id: 'foundry',
    status: 'lead',
    company: 'Foundry Works',
    arr: 24_000,
    createdAt: new Date('2025-06-03T00:00:00Z'),
    subscribed: false,
  },
  {
    id: 'meridian',
    status: 'customer',
    company: 'Meridian Health',
    arr: 132_000,
    createdAt: new Date('2024-11-22T00:00:00Z'),
    subscribed: true,
  },
  {
    id: 'paperplane',
    status: 'churned',
    company: null,
    arr: 18_000,
    createdAt: new Date('2024-08-09T00:00:00Z'),
    subscribed: false,
  },
  {
    id: 'signal',
    status: 'lead',
    company: 'Signal & Tide',
    arr: 56_000,
    createdAt: new Date('2025-05-18T00:00:00Z'),
    subscribed: true,
  },
]

/** The rows as Zero stores them: dates as epoch millis. */
const zeroRows = contacts.map((contact) => ({
  ...contact,
  createdAt: contact.createdAt.getTime(),
}))

const makeQuery = (
  build: (store: ReturnType<typeof definition.createStore>) => void,
): ContactsQuery => {
  const store = definition.createStore()
  build(store)
  return store.get().value
}

/** Build the where AST through zero's real query builder. */
const buildWhere = (query: ContactsQuery): Condition | undefined =>
  (zql.contacts.where(conditionsToZero(definition, query)) as any).ast.where

// A reference evaluator for the ZQL condition AST, mirroring zero's
// documented semantics (SQL LIKE patterns with backslash escapes, ILIKE
// case-insensitive, IS/IS NOT null-safe).
const likeToRegExp = (pattern: string, flags: string) => {
  let source = '^'
  for (let i = 0; i < pattern.length; i++) {
    let char = pattern[i]
    if (char === '%') {
      source += '.*'
      continue
    }
    if (char === '_') {
      source += '.'
      continue
    }
    if (char === '\\') {
      i++
      char = pattern[i]
    }
    source += char.replace(/[$()*+.?[\]\\^{|}]/g, '\\$&')
  }
  return new RegExp(`${source}$`, `${flags}s`)
}

const evalCondition = (
  condition: Condition,
  row: Record<string, unknown>,
): boolean => {
  if (condition.type === 'and') {
    return condition.conditions.every((child) => evalCondition(child, row))
  }
  if (condition.type === 'or') {
    return condition.conditions.some((child) => evalCondition(child, row))
  }
  if (condition.type !== 'simple') {
    throw new Error(`Unexpected condition type "${condition.type}"`)
  }
  const left =
    condition.left.type === 'column'
      ? row[condition.left.name]
      : (condition.left as any).value
  const right = (condition.right as any).value
  switch (condition.op) {
    case '=':
      return left === right
    case '!=':
      return left !== right
    case '<':
      return left != null && (left as any) < right
    case '<=':
      return left != null && (left as any) <= right
    case '>':
      return left != null && (left as any) > right
    case '>=':
      return left != null && (left as any) >= right
    case 'IN':
      return (right as unknown[]).includes(left)
    case 'NOT IN':
      return !(right as unknown[]).includes(left)
    case 'LIKE':
    case 'NOT LIKE':
    case 'ILIKE':
    case 'NOT ILIKE': {
      if (typeof left !== 'string') return condition.op.startsWith('NOT')
      const matches = likeToRegExp(
        String(right),
        condition.op.includes('ILIKE') ? 'i' : '',
      ).test(left)
      return condition.op.startsWith('NOT') ? !matches : matches
    }
    case 'IS':
      return left === right || (left == null && right == null)
    case 'IS NOT':
      return !(left === right || (left == null && right == null))
    default:
      throw new Error(`Unexpected operator "${condition.op}"`)
  }
}

const zeroIds = (query: ContactsQuery) => {
  const where = buildWhere(query)
  return zeroRows
    .filter((row) => (where ? evalCondition(where, row) : true))
    .map((row) => row.id)
    .sort()
}

const evaluatedIds = (query: ContactsQuery) =>
  definition
    .filter(query, contacts)
    .map((contact) => contact.id)
    .sort()

const expectParity = (query: ContactsQuery) => {
  expect(zeroIds(query)).toEqual(evaluatedIds(query))
}

describe('conditionsToZero', () => {
  it('produces ZQL TRUE for an empty query', () => {
    const where = buildWhere(makeQuery(() => {}))
    expect(where).toEqual({ type: 'and', conditions: [] })
    expect(zeroIds(makeQuery(() => {}))).toEqual(
      contacts.map((contact) => contact.id).sort(),
    )
  })

  it('builds the expected AST for a nested query', () => {
    const query = makeQuery((store) => {
      store.actions.addCondition({ field: 'status', value: 'customer' })
      const group = store.actions.addGroup({ combinator: 'or' })
      store.actions.addCondition(
        { field: 'arr', operator: 'gte', value: 100_000 },
        { parentId: group },
      )
      store.actions.addCondition(
        {
          field: 'createdAt',
          operator: 'gte',
          value: new Date('2025-01-01T00:00:00Z'),
        },
        { parentId: group },
      )
    })

    expect(buildWhere(query)).toEqual({
      type: 'and',
      conditions: [
        {
          type: 'simple',
          op: '=',
          left: { type: 'column', name: 'status' },
          right: { type: 'literal', value: 'customer' },
        },
        {
          type: 'or',
          conditions: [
            {
              type: 'simple',
              op: '>=',
              left: { type: 'column', name: 'arr' },
              right: { type: 'literal', value: 100_000 },
            },
            {
              type: 'simple',
              op: '>=',
              left: { type: 'column', name: 'createdAt' },
              right: {
                type: 'literal',
                value: new Date('2025-01-01T00:00:00Z').getTime(),
              },
            },
          ],
        },
      ],
    })
  })

  it('matches in-memory evaluation for flat and string conditions', () => {
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({ field: 'status', value: 'customer' }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'arr',
          operator: 'between',
          value: [20_000, 90_000],
        }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({ field: 'subscribed', value: true }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'contains',
          value: 'LABS', // case-insensitive in both engines
        }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'contains',
          value: '&', // LIKE wildcard escaping
        }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({ field: 'company', operator: 'isNull' }),
      ),
    )
  })

  it('matches in-memory evaluation for list operators and nested groups', () => {
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'status',
          operator: 'in',
          value: ['lead', 'churned'],
        }),
      ),
    )
    expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'status',
          operator: 'notIn',
          value: ['customer'],
        }),
      ),
    )
    const query = makeQuery((store) => {
      store.actions.addCondition({ field: 'status', value: 'customer' })
      const group = store.actions.addGroup({ combinator: 'or' })
      store.actions.addCondition(
        { field: 'arr', operator: 'gte', value: 100_000 },
        { parentId: group },
      )
      store.actions.addCondition(
        {
          field: 'createdAt',
          operator: 'gte',
          value: new Date('2025-01-01T00:00:00Z'),
        },
        { parentId: group },
      )
    })
    expectParity(query)
    expect(zeroIds(query)).toEqual(['meridian', 'northstar'])
  })

  it('supports field mappings and custom operators', () => {
    const query = makeQuery((store) =>
      store.actions.addCondition({ field: 'company', value: 'Northstar Labs' }),
    )
    const factory = conditionsToZero(definition, query, {
      fields: { company: { name: 'companyName' } },
      operators: {
        equals: (value, { eb, column }) => eb.cmp(column, 'ILIKE', `${value}`),
      },
    })
    // Build against a raw expression-builder stub: column renames leave the
    // test schema, so bypass the schema-checked builder here.
    const where = factory({
      cmp: (field: string, op: string, value: unknown) => ({
        type: 'simple',
        op,
        left: { type: 'column', name: field },
        right: { type: 'literal', value },
      }),
    } as any)
    expect(where).toEqual({
      type: 'simple',
      op: 'ILIKE',
      left: { type: 'column', name: 'companyName' },
      right: { type: 'literal', value: 'Northstar Labs' },
    })
  })

  it('throws for operators without a translation', () => {
    const query = makeQuery((store) =>
      store.actions.addCondition({ field: 'status', value: 'lead' }),
    )
    query.root.items[0] = {
      ...(query.root.items[0] as any),
      operator: 'some',
    }
    expect(() => buildWhere(query)).toThrow(UnsupportedConditionOperatorError)
  })
})
