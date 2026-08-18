---
'drizzle-crud': minor
---

Breaking: migrated to drizzle-orm 1.0 (`^1.0.0-rc.4`).

Relational operations (`findById`, `list`) now use relational queries v2:
create the database with
`drizzle({ client, relations: defineRelations(schema) })`. Prebuilt SQL
where clauses are remapped onto the aliased root table, `orderBy` uses the
v2 object form, and a missing query builder throws a clear setup error.
Types follow the 1.0 surface (`PgAsyncDatabase`, `PgTable`-based
`DrizzleTableWithId`, new `DrizzleTableWithModels`); result types for
relational selections are based on `$inferSelect`, as v1's
`BuildQueryResult` narrowing no longer exists.
