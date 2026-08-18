---
'@saas-js/conditions-tanstack-table': minor
---

Initial release: filter TanStack Table v9 rows with `@saas-js/conditions`
queries. `conditionsGlobalFilter(definition)` returns table options that make
the condition query the table's global filter — rows are evaluated through
`definition.evaluate` exactly once each — and `createConditionsFilterFn`
exposes the bare `FilterFn`. Works with any v9 adapter via
`@tanstack/table-core`.
