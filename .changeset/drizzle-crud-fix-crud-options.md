---
'drizzle-crud': patch
---

Fixed `createCrud` dropping all per-table options: `allowedFilters`,
`searchFields`, `softDelete`, `scopeFilters`, and hooks passed to
`createCrud(table, options)` never reached the crud factory.
