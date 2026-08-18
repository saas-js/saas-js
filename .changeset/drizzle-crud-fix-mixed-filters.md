---
'drizzle-crud': patch
---

Fixed `parseFilters` silently ignoring top-level field filters when `AND` or
`OR` were present: `{ id: { equals: 1 }, OR: [...] }` dropped the `id`
condition and returned too many rows. Field filters now combine with the
`AND`/`OR` branches. A non-object `filters` value (e.g. a serialized query
string) now throws a helpful error pointing at the `filterFn` option instead
of a confusing TypeError.
