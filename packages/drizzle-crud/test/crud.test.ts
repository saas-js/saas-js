import { pgTable, serial, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'

import { drizzleCrud, filtersToWhere } from '../src/index.ts'
import { zod } from '../src/zod.ts'

const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
})

const db = drizzle({
  schema: {
    users: usersTable,
  },
})

describe('drizzleCrud', () => {
  it('should create a crud instance', () => {
    const createCrud = drizzleCrud(db)
  })

  it('should create a user without validation', async () => {
    const createCrud = drizzleCrud(db)

    const users = createCrud(usersTable)

    const user = await users.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
  })

  it('should validate with zod', async () => {
    const validation = zod()

    const createCrud = drizzleCrud(db, {
      validation,
    })

    const users = createCrud(usersTable)

    const user = await users.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
  })

  it('should validate with custom zod schemas', async () => {
    const validation = zod({
      insert: () =>
        z.object({
          name: z.string(),
          email: z.email(),
        }),
      pagination(options) {
        return z.object({
          page: z
            .number()
            .int()
            .positive()
            .optional()
            .default(options.defaultLimit ?? 10),
          limit: z
            .number()
            .int()
            .positive()
            .optional()
            .default(options.maxLimit ?? 100),
        })
      },
    })

    const createCrud = drizzleCrud(db, {
      validation,
    })

    const users = createCrud(usersTable)

    const user = await users.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
  })

  it('should validate with custom local zod schemas', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable, {
      validation: zod({
        insert: () =>
          z.object({
            name: z.string().optional(),
            email: z.email().optional().nullable(),
          }),
      }),
    })

    const user = await users.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
  })

  it('should find by id', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable)

    const user = await users.findById(1, {
      columns: {
        id: true,
        name: true,
        email: false,
      },
    })

    if (user === null) {
      throw new Error('User not found')
    }

    console.log(user)

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
    })
  })

  it('should apply filters', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable)

    const where = filtersToWhere(usersTable, {
      OR: [
        {
          email: {
            equals: 'john.doe@example.com',
          },
        },
        {
          email: {
            equals: 'jane.doe@example.com',
          },
        },
      ],
      AND: [
        {
          id: {
            not: 1337,
          },
        },
        {
          name: 'Johnny',
        },
      ],
    })

    const list = await users.list({
      columns: {
        id: true,
      },
      where,
    })

    expect(list.results).toEqual([
      {
        id: 1,
      },
    ])
  })

  it('should accept filters', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable)

    const list = await users.list({
      columns: {
        id: true,
        name: true,
      },
      filters: {
        id: {
          equals: 1,
        },
        OR: [
          {
            email: {
              equals: 'john.doe@example.com',
            },
          },
          {
            name: 'Johnny',
          },
        ],
      },
    })

    expect(list.results[0]).toEqual({
      id: 1,
      name: 'John Doe',
    })
  })
})
