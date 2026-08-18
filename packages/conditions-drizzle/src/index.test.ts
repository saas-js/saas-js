import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  type ConditionQueryForDefinition,
  createConditionQuery,
  defineConditions,
} from '@saas-js/conditions'

import {
  UnmappedConditionFieldError,
  UnsupportedConditionOperatorError,
  conditionsToDrizzle,
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

const contactsTable = pgTable('contacts', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  company: text('company'),
  arr: integer('arr').notNull(),
  createdAt: timestamp('created_at').notNull(),
  subscribed: boolean('subscribed').notNull(),
})

const columns = {
  status: contactsTable.status,
  company: contactsTable.company,
  arr: contactsTable.arr,
  createdAt: contactsTable.createdAt,
  subscribed: contactsTable.subscribed,
}

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

const client = new PGlite()
const db = drizzle({ client })

beforeAll(async () => {
  await db.execute(sql`
    create table contacts (
      id text primary key,
      status text not null,
      company text,
      arr integer not null,
      created_at timestamp not null,
      subscribed boolean not null
    )
  `)
  await db.insert(contactsTable).values(contacts)
})

afterAll(() => client.close())

const makeQuery = (
  build: (store: ReturnType<typeof definition.createStore>) => void,
): ContactsQuery => {
  const store = definition.createStore()
  build(store)
  return store.get().value
}

/** Rows the database returns for the converted where clause. */
const sqlIds = async (query: ContactsQuery) => {
  const where = conditionsToDrizzle(definition, query, { columns })
  const rows = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(where)
  return rows.map((row) => row.id).sort()
}

/** Rows the in-memory evaluator returns for the same query. */
const evaluatedIds = (query: ContactsQuery) =>
  definition
    .filter(query, contacts)
    .map((contact) => contact.id)
    .sort()

const expectParity = async (query: ContactsQuery) => {
  expect(await sqlIds(query)).toEqual(evaluatedIds(query))
}

describe('conditionsToDrizzle', () => {
  it('returns undefined for an empty query', async () => {
    const query = makeQuery(() => {})
    expect(conditionsToDrizzle(definition, query, { columns })).toBeUndefined()
    expect(await sqlIds(query)).toEqual(
      contacts.map((contact) => contact.id).sort(),
    )
  })

  it('matches in-memory evaluation for flat conditions', async () => {
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({ field: 'status', value: 'customer' }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'arr',
          operator: 'between',
          value: [20_000, 90_000],
        }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'createdAt',
          operator: 'gte',
          value: new Date('2025-01-01T00:00:00Z'),
        }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({ field: 'subscribed', value: true }),
      ),
    )
  })

  it('matches in-memory evaluation for string operators', async () => {
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'contains',
          value: 'LABS', // case-insensitive in both engines
        }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'startsWith',
          value: 'signal',
        }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'contains',
          value: '&', // LIKE wildcard escaping
        }),
      ),
    )
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'company',
          operator: 'isNull',
        }),
      ),
    )
  })

  it('matches in-memory evaluation for list operators', async () => {
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'status',
          operator: 'in',
          value: ['lead', 'churned'],
        }),
      ),
    )
    // Empty lists cannot be committed through the store; the converter still
    // treats them defensively: empty `in` matches nothing.
    const emptyIn = createConditionQuery({
      items: [
        {
          kind: 'condition',
          id: 'none',
          field: 'status',
          operator: 'in',
          value: [],
        },
      ],
    }) as ContactsQuery
    expect(await sqlIds(emptyIn)).toEqual([])
    await expectParity(
      makeQuery((store) =>
        store.actions.addCondition({
          field: 'status',
          operator: 'notIn',
          value: ['customer'],
        }),
      ),
    )
  })

  it('matches in-memory evaluation for nested AND/OR groups', async () => {
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
    await expectParity(query)
    expect(await sqlIds(query)).toEqual(['meridian', 'northstar'])
  })

  it('supports custom operator converters', async () => {
    const query = makeQuery((store) =>
      store.actions.addCondition({
        field: 'company',
        operator: 'equals',
        value: 'northstar labs',
      }),
    )
    const where = conditionsToDrizzle(definition, query, {
      columns,
      operators: {
        equals: (target, value) =>
          sql`lower(${target}) = ${String(value).toLowerCase()}`,
      },
    })
    const rows = await db
      .select({ id: contactsTable.id })
      .from(contactsTable)
      .where(where)
    expect(rows.map((row) => row.id)).toEqual(['northstar'])
  })

  it('throws for unmapped fields and untranslated operators', () => {
    const query = makeQuery((store) =>
      store.actions.addCondition({ field: 'status', value: 'lead' }),
    )
    expect(() =>
      conditionsToDrizzle(definition, query, {
        columns: { arr: contactsTable.arr },
      }),
    ).toThrow(UnmappedConditionFieldError)

    expect(() =>
      conditionsToDrizzle(definition, query, {
        columns,
        operators: { equals: undefined as never },
      }),
    ).not.toThrow()

    const custom = makeQuery((store) =>
      store.actions.addCondition({ field: 'status', value: 'lead' }),
    )
    custom.root.items[0] = {
      ...(custom.root.items[0] as any),
      operator: 'some',
    }
    expect(() =>
      conditionsToDrizzle(definition, custom, { columns }),
    ).toThrow(UnsupportedConditionOperatorError)
  })
})
