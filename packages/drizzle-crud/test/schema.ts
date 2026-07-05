import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'

// Tables used in types.test.ts (relations testing)
export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
})

export const posts = pgTable('posts', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
})

// Table used in crud.test.ts (CRUD operations testing)
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
})
