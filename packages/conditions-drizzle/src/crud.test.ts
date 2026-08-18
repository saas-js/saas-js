import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { PGlite } from '@electric-sql/pglite'
import { defineRelations, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { drizzleCrud } from 'drizzle-crud'
import { z } from 'zod'

import {
  type ConditionQueryForDefinition,
  defineConditions,
} from '@saas-js/conditions'

import { UnmappedConditionFieldError, conditionsCrudFilter } from './index.ts'

const definition = defineConditions({
  fields: {
    status: {
      type: 'enum',
      schema: z.enum(['lead', 'customer', 'churned']),
      operators: ['equals', 'not', 'in'],
    },
    company: {
      type: 'string',
      schema: z.string(),
      operators: ['contains', 'equals'],
    },
    arr: {
      type: 'number',
      schema: z.number(),
      operators: ['gte', 'lte', 'between'],
    },
    createdAt: {
      type: 'date',
      schema: z.coerce.date(),
      operators: ['gte', 'lte'],
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
  id: integer('id').primaryKey(),
  status: text('status').notNull(),
  company: text('company'),
  arr: integer('arr').notNull(),
  createdAt: timestamp('created_at').notNull(),
  subscribed: boolean('subscribed').notNull(),
})

const contacts = [
  {
    id: 1,
    status: 'customer',
    company: 'Northstar Labs',
    arr: 84_000,
    createdAt: new Date('2025-01-14T00:00:00Z'),
    subscribed: true,
  },
  {
    id: 2,
    status: 'lead',
    company: 'Foundry Works',
    arr: 24_000,
    createdAt: new Date('2025-06-03T00:00:00Z'),
    subscribed: false,
  },
  {
    id: 3,
    status: 'customer',
    company: 'Meridian Health',
    arr: 132_000,
    createdAt: new Date('2024-11-22T00:00:00Z'),
    subscribed: true,
  },
  {
    id: 4,
    status: 'churned',
    company: null,
    arr: 18_000,
    createdAt: new Date('2024-08-09T00:00:00Z'),
    subscribed: false,
  },
]

const client = new PGlite()
// drizzle 1.0: client goes in the config; relational queries (RQB v2) are
// configured through relations.
const db = drizzle({
  client,
  relations: defineRelations({ contacts: contactsTable }),
})
const createCrud = drizzleCrud(db)

const contactsCrud = createCrud(contactsTable, {
  allowedFilters: ['status', 'arr', 'createdAt', 'subscribed'],
  filterFn: conditionsCrudFilter(definition),
})

const makeQuery = (
  build: (store: ReturnType<typeof definition.createStore>) => void,
): ContactsQuery => {
  const store = definition.createStore()
  build(store)
  return store.get().value
}

beforeAll(async () => {
  await db.execute(sql`
    create table contacts (
      id integer primary key,
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

describe('drizzle-crud conditions filter', () => {
  it('filters list results with a serialized condition query', async () => {
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

    // The exact payload a client would send: the versioned JSON string.
    const { results, total } = await contactsCrud.list({
      filters: definition.stringify(query),
    })

    expect(total).toBe(2)
    expect(results.map((row) => row.id).sort()).toEqual([1, 3])
  })

  it('composes with the crud pagination and count', async () => {
    const query = makeQuery((store) =>
      store.actions.addCondition({ field: 'subscribed', value: true }),
    )
    const page = await contactsCrud.list({
      filters: definition.serialize(query),
      limit: 1,
      page: 2,
      orderBy: [{ field: 'arr', direction: 'desc' }],
    })
    expect(page.total).toBe(2)
    expect(page.results.map((row) => row.id)).toEqual([1])
  })

  it('gates fields through allowedFilters', async () => {
    // `company` is a definition field but not in allowedFilters.
    const query = makeQuery((store) =>
      store.actions.addCondition({
        field: 'company',
        operator: 'contains',
        value: 'labs',
      }),
    )
    await expect(
      contactsCrud.list({ filters: definition.stringify(query) }),
    ).rejects.toThrow(UnmappedConditionFieldError)
  })

  it('rejects invalid payloads through the definition', async () => {
    await expect(
      contactsCrud.list({
        filters: JSON.stringify({ version: 1, root: { items: 'nope' } }),
      }),
    ).rejects.toThrow()
  })

  it('points string filters at filterFn when none is configured', async () => {
    const bare = createCrud(contactsTable)
    await expect(bare.list({ filters: '{}' as any })).rejects.toThrow(
      'configure a `filterFn`',
    )
  })
})
