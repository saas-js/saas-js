import { PGlite } from '@electric-sql/pglite'
import { defineRelations, sql } from 'drizzle-orm'
import { pgTable, serial, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod/v4'

import { drizzleCrud, filtersToWhere } from '../src/index.ts'
import { zod } from '../src/zod.ts'

const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
})

const client = new PGlite()
const db = drizzle({
  client,
  relations: defineRelations({ users: usersTable }),
})

beforeAll(async () => {
  await db.execute(sql`
    create table users (
      id serial primary key,
      name text,
      email text
    )
  `)
})

beforeEach(async () => {
  await db.execute(sql`truncate users restart identity`)
})

describe('drizzleCrud', () => {
  it('should create a crud instance', () => {
    const createCrud = drizzleCrud(db)
    expect(createCrud).toBeTypeOf('function')
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

    await expect(
      users.create({ name: 'Broken', email: 'not-an-email' }),
    ).rejects.toThrow()
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
    await users.create({ name: 'John Doe', email: 'john.doe@example.com' })

    const user = await users.findById(1, {
      columns: {
        id: true,
        name: true,
      },
    })

    if (user === null) {
      throw new Error('User not found')
    }

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
    })
  })

  it('should apply a prebuilt where clause', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable)
    await users.create({ name: 'John Doe', email: 'john.doe@example.com' })
    await users.create({ name: 'Jane Doe', email: 'jane.doe@example.com' })
    await users.create({ name: 'Johnny', email: 'johnny@example.com' })

    const where = filtersToWhere(
      usersTable,
      {
        OR: [
          { email: { equals: 'john.doe@example.com' } },
          { email: { equals: 'jane.doe@example.com' } },
        ],
      },
      ['email'],
    )

    const list = await users.list({
      columns: {
        id: true,
      },
      where,
    })

    expect(list.results).toEqual([{ id: 1 }, { id: 2 }])
    expect(list.total).toBe(2)
  })

  it('should accept filters gated by allowedFilters', async () => {
    const createCrud = drizzleCrud(db, {
      validation: zod(),
    })

    const users = createCrud(usersTable, {
      allowedFilters: ['id', 'email', 'name'],
    })

    await users.create({ name: 'John Doe', email: 'john.doe@example.com' })
    await users.create({ name: 'Jane Doe', email: 'jane.doe@example.com' })

    const list = await users.list({
      columns: {
        id: true,
        name: true,
      },
      filters: {
        id: { equals: 1 },
        OR: [
          { email: { equals: 'john.doe@example.com' } },
          { name: 'Johnny' },
        ],
      },
    })

    expect(list.results).toEqual([{ id: 1, name: 'John Doe' }])
  })

  it('should paginate and order', async () => {
    const createCrud = drizzleCrud(db)
    const users = createCrud(usersTable)

    for (const name of ['a', 'b', 'c', 'd', 'e']) {
      await users.create({ name, email: `${name}@example.com` })
    }

    const page = await users.list({
      limit: 2,
      page: 2,
      orderBy: [{ field: 'name', direction: 'desc' }],
    })

    expect(page.total).toBe(5)
    expect(page.results.map((row) => row.name)).toEqual(['c', 'b'])
  })

  it('should soft delete and restore', async () => {
    const softDeleteTable = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name'),
      email: text('email'),
    })
    const createCrud = drizzleCrud(db)
    const users = createCrud(softDeleteTable, {
      softDelete: {
        field: 'email', // repurpose a nullable column for the test
        deletedValue: 'deleted',
        notDeletedValue: null,
      },
    })

    await users.create({ name: 'John Doe', email: null })
    const removed = await users.deleteOne(1)
    expect(removed.success).toBe(true)

    expect(await users.findById(1)).toBeNull()
    const withDeleted = await users.findById(1, { includeDeleted: true })
    expect(withDeleted?.name).toBe('John Doe')

    const restored = await users.restore(1)
    expect(restored.success).toBe(true)
    expect((await users.findById(1))?.name).toBe('John Doe')
  })
})
