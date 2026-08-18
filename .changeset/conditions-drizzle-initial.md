---
'@saas-js/conditions-drizzle': minor
---

Initial release: convert `@saas-js/conditions` queries into Drizzle ORM
`where` clauses.

- `conditionsToDrizzle(definition, query, { columns, operators })` with the
  full default operator set (case-insensitive LIKE with escaping, list
  operators, null checks, `between`), SQL-expression field targets, and
  custom operator converters. Unmapped fields and untranslatable operators
  throw instead of widening the result set.
- `conditionsCrudFilter(definition)`: a drizzle-crud `filterFn` that makes
  `list({ filters })` accept serialized condition queries, validated by the
  definition and gated by the crud's `allowedFilters` allowlist.
- Parity-tested against a real Postgres (PGlite): converted queries return
  exactly the rows `definition.filter` returns.
