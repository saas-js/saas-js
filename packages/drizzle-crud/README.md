# Drizzle CRUD

A powerful TypeScript package that automatically generates CRUD operations for your Drizzle ORM schemas with built-in validation, filtering, pagination, soft deletes, and access control.

> [!IMPORTANT]
> This is an early preview version while we are working out details.
> We love to hear what you think @ https://x.com/saas_js or open a [Discussion](https://github.com/saas-js/saas-js/discussions)

## Features

- 🚀 **Auto-generated CRUD operations** from Drizzle schemas
- 🔍 **Advanced filtering** with multiple operators (eq, ne, gt, lt, like, in, etc.)
- 📄 **Built-in pagination** with configurable limits
- 🔎 **Full-text search** across specified fields
- 🗑️ **Soft delete support** with restore functionality
- 🔐 **Access control** with actor-based permissions and scope filters
- ✅ **Standard schema validation** with customizable schemas
- 🪝 **Lifecycle hooks** for custom business logic
- 📊 **Bulk operations** for efficient data manipulation
- 🎯 **Type-safe** with full TypeScript support

## Integrations (TBD)

- **tRPC** generate crud procedures
- **Hono RPC** generate hono RPC procedures
- **oRPC** generate oRPC procedures
- **Tanstack Table** Integrate pagination and filtering

## Roadmap

- [ ] Support all Drizzle dialects (currently only PG)
- [ ] Expose utilities for filters and pagination
- [ ] Define custom operations
- [ ] Automatic re-ordering on insert or update (fractional/shift sorting)
- [x] Standard schema support

- More ideas?

## Installation

```bash
npm install drizzle-crud
# or
yarn add drizzle-crud
# or
pnpm add drizzle-crud
```

## Quick Start

```typescript
import { drizzleCrud } from 'drizzle-crud'
import { zod } from 'drizzle-crud/zod'
import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'

// Define your schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: serial('author_id').references(() => users.id),
  deletedAt: timestamp('deleted_at'),
})

// Initialize database and CRUD factory
const db = drizzle(/* your database connection */)
const createCrud = drizzleCrud(db, {
  validation: zod(),
})

// Create CRUD operations for each table
const userCrud = createCrud(users, {
  searchFields: ['name', 'email'],
  allowedFilters: ['isActive'],
  softDelete: { field: 'deletedAt' },
})

const postCrud = createCrud(posts, {
  searchFields: ['title', 'content'],
  allowedFilters: ['authorId'],
  softDelete: { field: 'deletedAt' },
})

// Use the generated CRUD operations
const newUser = await userCrud.create({
  name: 'John Doe',
  email: 'john@example.com',
})

const usersList = await userCrud.list({
  search: 'john',
  filters: { isActive: true },
  page: 1,
  limit: 10,
})
```

## Core Operations

### Create

```typescript
const user = await userCrud.create({
  name: 'Jane Smith',
  email: 'jane@example.com',
})
```

### Find by ID

```typescript
const user = await userCrud.findById('123', {
  columns: { name: true, email: true }, // Select specific columns
  includeDeleted: false,
})
```

### List with Filtering & Pagination

The list operation accepts a JSON serializable filters object that gets converted to SQL WHERE conditions.
Root-level properties are combined with AND logic, while nested OR/AND arrays allow for complex boolean expressions.

```typescript
const result = await userCrud.list({
  search: 'john',
  filters: {
    isActive: true,
    createdAt: {
      gte: new Date('2024-01-01'),
    },
    OR: [
      {
        name: 'john',
      },
      {
        name: 'John',
      },
    ],
  },
  orderBy: [{ field: 'createdAt', direction: 'desc' }],
  page: 1,
  limit: 20,
})

console.log(result.results) // Array of users
console.log(result.total) // Total count
console.log(result.page) // Current page
```

### Update

```typescript
const updatedUser = await userCrud.update('123', {
  name: 'John Updated',
  isActive: false,
})
```

### Delete (Soft Delete)

```typescript
await userCrud.deleteOne('123') // Soft delete if configured
```

### Restore (from Soft Delete)

```typescript
await userCrud.restore('123')
```

### Permanent Delete

```typescript
await userCrud.permanentDelete('123') // Hard delete
```

## Advanced Features

### Transactions

Transaction instances can be passed to the operation context to run them in a tx.

```typescript
const result = await db.transaction((tx) => {
  const updatedUser = await userCrud.update('123', {
    name: 'John Updated',
    isActive: false,
  }, {
   db: tx
  })
})
```

### Filter Operators

Support for various filter operators:

```typescript
const users = await userCrud.list({
  filters: {
    age: { op: 'gte', value: 18 }, // age >= 18
    status: { op: 'in', value: ['active', 'pending'] }, // status IN (...)
    name: { op: 'ilike', value: '%john%' }, // case-insensitive LIKE
    createdAt: { op: 'lt', value: new Date() }, // created before now
  },
})
```

Available operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `like`, `ilike`

### Access Control with Actors

Define actors and scope filters for multi-tenant applications:

```typescript
interface UserActor extends Actor {
  type: 'user'
  properties: {
    userId: string
    workspaceId: string
    role: 'admin' | 'user'
  }
}

// Setup database CRUD factory
const createCrud = drizzleCrud(db)

const postsCrud = createCrud(posts, {
  scopeFilters: {
    // Only show posts from user's workspace
    workspaceId: (value, actor: UserActor) =>
      eq(posts.workspaceId, actor.properties.workspaceId),

    // Filter by author if not admin
    authorId: (value, actor: UserActor) =>
      actor.properties.role === 'admin'
        ? undefined
        : eq(posts.authorId, actor.properties.userId),
  },
})

// Use with context
const userPosts = await postsCrud.list(
  {},
  {
    actor: {
      type: 'user',
      properties: { userId: '123', workspaceId: 'ws-456', role: 'user' },
    },
    scope: { workspaceId: 'ws-456' },
  },
)
```

### Lifecycle Hooks

Add custom business logic with hooks:

```typescript
const createCrud = drizzleCrud(db)

const userCrud = createCrud(users, {
  hooks: {
    beforeCreate: (data) => ({
      ...data,
      email: data.email.toLowerCase(),
      createdAt: new Date(),
    }),

    beforeUpdate: (data) => ({
      ...data,
      updatedAt: new Date(),
    }),

    validate: ({ data, context, operation }) => {
      // Custom validation logic
      return !context?.skipValidation
    },
  },
})
```

### Custom Schemas

Override schemas

```typescript
import { drizzleCrud } from 'drizzle-crud'
import { zod } from 'drizzle-crud/zod'
import { z } from 'zod'

const createCrud = drizzleCrud(db, {
  // Add default schemas
  validation: zod(),
})

const userCrud = createCrud(users, {
  // Override table schemas
  validation: zod({
    insert: () =>
      z.object({
        name: z.string().min(2).max(50),
        email: z.string().email(),
        age: z.number().min(13).optional(),
      }),
    update: () =>
      z.object({
        name: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
      }),
  }),
})
```

### Validation Adapters

You can create custom adapters for other Standard Schema compatible
validation libraries by implementing the `ValidationAdapter` interface.

```ts
import type { ValidationAdapter } from 'drizzle-crud'

function arktype(): ValidationAdapter {
  return {
    ...
  }
}

const createCrud = drizzleCrud(db, {
  validation: arktype()
})
```

### Bulk Operations

Efficient bulk operations for large datasets:

```typescript
// Bulk create
const users = await userCrud.bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
])

// Bulk delete (soft delete if configured)
await userCrud.bulkDelete(['1', '2', '3'])

// Bulk restore
await userCrud.bulkRestore(['1', '2', '3'])
```

### Soft Delete Configuration

Configure soft delete behavior:

```typescript
const createCrud = drizzleCrud(db)

const userCrud = createCrud(users, {
  softDelete: {
    field: 'deletedAt', // Field to use for soft delete
    deletedValue: new Date(), // Value when deleted
    notDeletedValue: null, // Value when not deleted
  },
})

// Or for boolean-based soft delete
const postCrud = createCrud(posts, {
  softDelete: {
    field: 'isDeleted',
    deletedValue: true,
    notDeletedValue: false,
  },
})
```

## Skip Validation

Use the `skipValidation` property to disable schema validation when calling operators from trusted sources.
For example in tRPC or Hono RPC procedures where input data is already validated.

```ts
const { update } = createCrud(users)

export const usersRouter = createTRPCRouter({
  updateById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await update(
        input.id,
        {
          name: input.name,
        },
        {
          actor: {
            type: 'user',
            properties: {
              id: ctx.session.user.id,
              workspaceId: ctx.workspace.id,
            },
          },
          skipValidation: true,
        },
      )

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return user
    }),
})
```

## Configuration Options

```typescript
interface CrudOptions {
  searchFields?: string[] // Fields to search in
  defaultLimit?: number // Default pagination limit (20)
  maxLimit?: number // Maximum pagination limit (100)
  allowedFilters?: string[] // Fields that can be filtered
  softDelete?: SoftDeleteConfig // Soft delete configuration
  scopeFilters?: ScopeFilters // Access control filters
  hooks?: Hooks // Lifecycle hooks
  validation?: ValidationSchemas // Custom validation schemas
}
```

## Type Safety

All operations are fully type-safe and infer types from your Drizzle schema:

```typescript
// TypeScript will infer the correct types
const user = await userCrud.create({
  name: 'John', // ✅ string
  email: 'john@...', // ✅ string
  age: 25, // ✅ number (if in schema)
  invalid: 'field', // ❌ TypeScript error
})

// Return types are also inferred
user.id // number | string (based on your schema)
user.name // string
user.email // string
```

## Error Handling

The library throws descriptive errors for common issues:

```typescript
try {
  await userCrud.create({ name: 'John' }) // Missing required email
} catch (error) {
  console.log(error.message) // Zod validation error
}

try {
  await userCrud.restore('123') // Without soft delete config
} catch (error) {
  console.log(error.message) // "Restore operation requires soft delete to be configured"
}
```

## Requirements

- Node.js 16+
- TypeScript 4.7+
- Drizzle ORM
- Zod v4

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Author

Built by Eelco Wiersma
Saas UI B.V.
Netherlands.

https://x.com/saas_js

https://saas-ui.dev

## License

Apache 2.0 License - see [LICENSE](LICENSE) file for details.
