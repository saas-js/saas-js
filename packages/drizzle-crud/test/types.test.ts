import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { assertType, describe, it } from 'vitest'

import type { FilterParams } from '../src/types.ts'

// The drizzle v1 relational-query type assertions were removed with the
// migration to drizzle 1.0 (RQB v2): the crud no longer builds on
// DBQueryConfig/BuildQueryResult. FilterParams is drizzle-crud's own public
// filter shape and keeps its type-level coverage here.

const users = pgTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
})

const posts = pgTable('posts', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
})

describe('FilterParams types', () => {
  it('should correctly type FilterParams for users table', () => {
    // Test basic filter operations
    const basicFilters: FilterParams<typeof users.$inferSelect> = {
      name: 'John Doe',
      email: {
        equals: 'john.doe@example.com',
      },
      id: {
        gt: 1,
        lt: 100,
      },
    }

    assertType<FilterParams<typeof users.$inferSelect>>(basicFilters)

    // Test complex filter operations with AND/OR
    const complexFilters: FilterParams<typeof users.$inferSelect> = {
      OR: [
        {
          name: 'John Doe',
          email: {
            like: '%example.com',
          },
        },
        {
          id: {
            in: [1, 2, 3],
          },
        },
      ],
      AND: [
        {
          name: {
            not: 'Jane Doe',
          },
        },
        {
          email: {
            ilike: '%@gmail.com',
          },
        },
      ],
    }

    assertType<FilterParams<typeof users.$inferSelect>>(complexFilters)

    // Test nested AND/OR operations
    const nestedFilters: FilterParams<typeof users.$inferSelect> = {
      AND: [
        {
          OR: [
            {
              name: 'John',
            },
            {
              name: 'Jane',
            },
          ],
        },
        {
          email: {
            equals: 'john@example.com',
          },
        },
      ],
    }

    assertType<FilterParams<typeof users.$inferSelect>>(nestedFilters)

    // Test all filter operations
    const allFilterOperations: FilterParams<typeof users.$inferSelect> = {
      id: {
        equals: 1,
        not: 2,
        gt: 0,
        gte: 1,
        lt: 100,
        lte: 99,
        in: [1, 2, 3],
      },
      name: {
        equals: 'John',
        not: 'Jane',
        like: 'John%',
        ilike: 'john%',
      },
      email: {
        equals: 'john@example.com',
        not: 'jane@example.com',
        like: '%@example.com',
        ilike: '%@EXAMPLE.COM',
      },
    }

    assertType<FilterParams<typeof users.$inferSelect>>(allFilterOperations)
  })

  it('should correctly type FilterParams for posts table', () => {
    // Test filters for posts table
    const postFilters: FilterParams<typeof posts.$inferSelect> = {
      title: {
        like: 'Hello%',
      },
      content: {
        not: null,
      },
      authorId: {
        in: [1, 2, 3],
      },
      OR: [
        {
          title: 'Post 1',
        },
        {
          title: 'Post 2',
        },
      ],
    }

    assertType<FilterParams<typeof posts.$inferSelect>>(postFilters)
  })
})
