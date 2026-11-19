# drizzle-crud

## 0.2.0

### Minor Changes

- 8b4478f: Breaking: migrated to drizzle-orm 1.0 (`^1.0.0-rc.4`).

  Relational operations (`findById`, `list`) now use relational queries v2:
  create the database with
  `drizzle({ client, relations: defineRelations(schema) })`. Prebuilt SQL
  where clauses are remapped onto the aliased root table, `orderBy` uses the
  v2 object form, and a missing query builder throws a clear setup error.
  Types follow the 1.0 surface (`PgAsyncDatabase`, `PgTable`-based
  `DrizzleTableWithId`, new `DrizzleTableWithModels`); result types for
  relational selections are based on `$inferSelect`, as v1's
  `BuildQueryResult` narrowing no longer exists.

- 8b4478f: Added the `filterFn` crud option, making the `list({ filters })` language
  pluggable: the function's input type becomes the `filters` parameter type,
  and the function owns validation and conversion to SQL — e.g.
  `conditionsCrudFilter` from `@saas-js/conditions-drizzle` accepts serialized
  condition queries (saved segments). It receives the crud's `allowedFilters`
  so the same allowlist applies, and the zod list schema passes `filters`
  through for the function to validate. Without a `filterFn`, the built-in
  `FilterParams` object language works unchanged.

### Patch Changes

- 8b4478f: Fixed `createCrud` dropping all per-table options: `allowedFilters`,
  `searchFields`, `softDelete`, `scopeFilters`, and hooks passed to
  `createCrud(table, options)` never reached the crud factory.
- 8b4478f: Fixed the zod list schema validating the filter object under the wrong key:
  it was declared as `where` instead of `filters`, so client `filters`
  payloads were never validated and the SQL `where` escape hatch failed
  validation whenever zod validation was enabled.
- 8b4478f: Fixed `parseFilters` silently ignoring top-level field filters when `AND` or
  `OR` were present: `{ id: { equals: 1 }, OR: [...] }` dropped the `id`
  condition and returned too many rows. Field filters now combine with the
  `AND`/`OR` branches. A non-object `filters` value (e.g. a serialized query
  string) now throws a helpful error pointing at the `filterFn` option instead
  of a confusing TypeError.
- 8b4478f: Fixed a crash when no validation adapter is configured: `createCrud` passed
  an empty (truthy) validation object to the schema factory, which then called
  undefined adapter methods.
- 8b4478f: Fixed soft delete with a `null` not-deleted sentinel (the default): the
  filter generated `field = NULL`, which never matches in SQL, so every read
  returned zero rows. A null sentinel now generates `field IS NULL`.

## 0.1.4

### Patch Changes

- 2bf27f5: Fixed issue where list operation would not return correct selected field types
