import {
  type BuildQueryResult,
  type DBQueryConfig,
  type ExtractTablesWithRelations,
  type KnownKeysOnly,
  relations,
} from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import { assertType, describe, it } from 'vitest'

import type { FilterParams } from '../src/types.ts'

// Define test table and relations
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

const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

const db = drizzle({
  schema: {
    users,
    posts,
    usersRelations,
    postsRelations,
  },
})

type TDatabase = typeof db

type TSchema = ExtractTablesWithRelations<TDatabase['_']['fullSchema']>
type TFields = TSchema[typeof users._.name]

type QueryOneGeneric = DBQueryConfig<'one', true, TSchema, TFields>
type QueryManyGeneric = DBQueryConfig<'many', true, TSchema, TFields>

type QueryOneInput<TInput extends QueryOneGeneric> = KnownKeysOnly<
  TInput,
  QueryOneGeneric
>
type QueryManyInput<TInput extends QueryManyGeneric> = KnownKeysOnly<
  TInput,
  QueryManyGeneric
>

type QueryOneResult<TInput extends QueryOneGeneric> = BuildQueryResult<
  TSchema,
  TFields,
  TInput
>

type QueryManyResult<TInput extends QueryManyGeneric> =
  TInput extends QueryManyGeneric
    ? BuildQueryResult<TSchema, TFields, TInput>[]
    : never

describe('QueryOneInput and QueryOneResult types', () => {
  it('should correctly type QueryOneInput for users table', () => {
    // Test that QueryOneInput accepts valid column selections
    const validInput = {
      columns: {
        id: true,
        name: true,
        email: false,
      },
    } as const

    assertType<
      QueryOneInput<{
        columns: {
          id: true
          name: true
          email: false
        }
      }>
    >(validInput)

    // Test that QueryOneInput accepts valid relation selections
    const validInputWithRelations = {
      columns: {
        id: true,
        name: true,
      },
      with: {
        posts: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    } as const

    assertType<
      QueryOneInput<{
        columns: {
          id: true
          name: true
        }
        with: {
          posts: {
            columns: {
              id: true
              title: true
            }
          }
        }
      }>
    >(validInputWithRelations)
  })

  it('should correctly type QueryOneResult for users table', () => {
    // Test that QueryOneResult correctly infers the result type
    const result = {
      id: 1,
      name: 'Test User',
      // email should not be present due to false in columns
    }

    assertType<
      QueryOneResult<{
        columns: {
          id: true
          name: true
          email: false
        }
      }>
    >(result)

    // Test that QueryOneResult correctly infers nested relation types
    const resultWithRelations = {
      id: 1,
      name: 'Test User',
      posts: [
        {
          id: 1,
          title: 'Test Post',
        },
      ],
    }

    assertType<
      QueryOneResult<{
        columns: {
          id: true
          name: true
        }
        with: {
          posts: {
            columns: {
              id: true
              title: true
            }
          }
        }
      }>
    >(resultWithRelations)
  })

  it('should correctly type QueryOneInput for posts table with author relation', () => {
    // Test that QueryOneInput accepts valid relation selections for posts
    const validInputWithAuthor = {
      columns: {
        id: true,
        title: true,
        content: true,
      },
      with: {
        author: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    } as const

    assertType<
      QueryOneInput<{
        columns: {
          id: true
          title: true
          content: true
        }
        with: {}
      }>
    >(validInputWithAuthor)
  })

  it('should correctly type QueryOneResult for nested relations', () => {
    // Test that QueryOneResult correctly infers nested author relation type
    const resultWithAuthor = {
      id: 1,
      posts: [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test content',
          author: {
            id: 1,
            name: 'Test User',
          },
        },
      ],
    }

    assertType<
      QueryOneResult<{
        columns: {
          id: true
        }
        with: {
          posts: {
            columns: {
              id: true
              title: true
              content: true
            }
            with: {
              author: {
                columns: {
                  id: true
                  name: true
                }
              }
            }
          }
        }
      }>
    >(resultWithAuthor)
  })

  it('should handle empty QueryOneInput correctly', () => {
    // Test that QueryOneInput can be empty
    const emptyInput = {} as const

    assertType<QueryOneInput<{}>>(emptyInput)
  })

  it('should handle empty QueryOneResult correctly', () => {
    // Test that QueryOneResult can be empty (all columns false)
    const emptyResult = {} as const

    assertType<
      QueryOneResult<{
        columns: {
          id: false
          name: false
          email: false
        }
      }>
    >(emptyResult)
  })

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
