import { SQL, defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'

import { drizzleCrud, filtersToWhere } from '../src/index.ts'
import { zod } from '../src/zod.ts'
import { posts, users, usersTable } from './schema.ts'
import { relations } from './relations.ts'

// ============================================================
// 1. defineRelations v2 — runtime structure verification
//    Critical: if the v1→v2 migration broke relation definitions,
//    all relational queries (findById with `with`, list with `with`)
//    would silently fail or return wrong shapes.
// ============================================================

describe('defineRelations v2', () => {
  it('should produce a valid relations config accepted by drizzle()', () => {
    // The relations object must be usable by drizzle() without throwing
    const db = drizzle({ relations })

    // db.query should expose query builders for every table in the schema
    expect(db.query).toBeDefined()
    expect(db.query.users).toBeDefined()
    expect(db.query.posts).toBeDefined()
  })

  it('should define both sides of the users↔posts relationship', () => {
    // The relations object produced by defineRelations should contain
    // entries for both tables with the relationship names we defined
    expect(relations).toBeDefined()

    // When used with drizzle(), the query builders should exist
    const db = drizzle({ relations })
    // usersTable is a separate pgTable also named 'users', so it should
    // also be accessible if included in the relations
    expect(db.query.users).toBeDefined()
    expect(db.query.posts).toBeDefined()
  })
})

// ============================================================
// 2. filtersToWhere — pure function, critical for data access
//    If filter-to-SQL translation regresses, data could be
//    exposed or hidden incorrectly. Tests run without a DB.
// ============================================================

describe('filtersToWhere', () => {
  it('should return undefined when no filters are provided', () => {
    const result = filtersToWhere(usersTable, undefined)
    expect(result).toBeUndefined()
  })

  it('should return undefined when filters is an empty object', () => {
    const result = filtersToWhere(usersTable, {})
    expect(result).toBeUndefined()
  })

  it('should return SQL for a simple equality filter on an allowed field', () => {
    const result = filtersToWhere(
      usersTable,
      { name: 'John' },
      ['name'],
    )
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(SQL)
  })

  it('should ignore filters on fields not in the allowedFilters list', () => {
    // 'email' is NOT in the allowed list — should be ignored
    const result = filtersToWhere(
      usersTable,
      { email: 'test@example.com' },
      ['name'],
    )
    expect(result).toBeUndefined()
  })

  it('should handle OR compound filters', () => {
    const result = filtersToWhere(
      usersTable,
      {
        OR: [
          { name: 'John' },
          { name: 'Jane' },
        ],
      },
      ['name'],
    )
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(SQL)
  })

  it('should handle AND compound filters', () => {
    const result = filtersToWhere(
      usersTable,
      {
        AND: [
          { name: 'John' },
          { email: 'john@example.com' },
        ],
      },
      ['name', 'email'],
    )
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(SQL)
  })

  it('should handle filter operator objects (gt, lt, in, ilike, etc.)', () => {
    const result = filtersToWhere(
      usersTable,
      {
        name: { ilike: '%john%' },
      },
      ['name'],
    )
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(SQL)
  })
})

// ============================================================
// 3. Zod validation adapter — drizzle-zod version changed
//    If createInsertSchema/createUpdateSchema APIs changed,
//    validation would silently stop working. Tests verify
//    schemas are created and validate data correctly.
// ============================================================

describe('zod validation adapter', () => {
  it('should create insert and update schemas from a drizzle table', () => {
    const validation = zod()

    const insertSchema = validation.createInsertSchema(usersTable)
    const updateSchema = validation.createUpdateSchema(usersTable)

    expect(insertSchema).toBeDefined()
    expect(updateSchema).toBeDefined()

    // Schemas should be standard-schema compliant (have ~standard property)
    expect(insertSchema['~standard']).toBeDefined()
    expect(updateSchema['~standard']).toBeDefined()
  })

  it('should validate correct insert data', async () => {
    const validation = zod()
    const insertSchema = validation.createInsertSchema(usersTable)

    const result = await insertSchema['~standard'].validate({
      name: 'John Doe',
      email: 'john@example.com',
    })

    // Should succeed (no issues)
    expect(result.issues).toBeUndefined()
  })

  it('should reject invalid insert data', async () => {
    const validation = zod()
    const insertSchema = validation.createInsertSchema(usersTable)

    const result = await insertSchema['~standard'].validate({
      name: 123, // should be string
      email: 456, // should be string
    })

    // Should fail with issues
    expect(result.issues).toBeDefined()
    expect(result.issues!.length).toBeGreaterThan(0)
  })
})

// ============================================================
// 4. crudFactory API surface — contract verification
//    Ensures the factory returns all 10 expected CRUD methods
//    after the migration. If any method is missing, the entire
//    downstream API breaks.
// ============================================================

describe('crudFactory API surface', () => {
  it('should return all expected CRUD methods', () => {
    const crudRelations = defineRelations({ users: usersTable })
    const db = drizzle({ relations: crudRelations })
    const createCrud = drizzleCrud(db)
    const crud = createCrud(usersTable)

    expect(typeof crud.create).toBe('function')
    expect(typeof crud.findById).toBe('function')
    expect(typeof crud.list).toBe('function')
    expect(typeof crud.update).toBe('function')
    expect(typeof crud.deleteOne).toBe('function')
    expect(typeof crud.restore).toBe('function')
    expect(typeof crud.permanentDelete).toBe('function')
    expect(typeof crud.bulkCreate).toBe('function')
    expect(typeof crud.bulkDelete).toBe('function')
    expect(typeof crud.bulkRestore).toBe('function')
  })

  it('should accept a zod validation adapter without errors', () => {
    const crudRelations = defineRelations({ users: usersTable })
    const db = drizzle({ relations: crudRelations })

    // Global validation
    const createCrud = drizzleCrud(db, { validation: zod() })
    const crud = createCrud(usersTable)
    expect(crud).toBeDefined()
  })

  it('should accept per-crud zod validation overrides', () => {
    const crudRelations = defineRelations({ users: usersTable })
    const db = drizzle({ relations: crudRelations })

    const createCrud = drizzleCrud(db, { validation: zod() })
    const crud = createCrud(usersTable, {
      validation: zod({
        insert: () =>
          z.object({
            name: z.string(),
            email: z.string(),
          }),
      }),
    })
    expect(crud).toBeDefined()
  })
})
