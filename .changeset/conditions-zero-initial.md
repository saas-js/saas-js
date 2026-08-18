---
'@saas-js/conditions-zero': minor
---

Initial release: convert `@saas-js/conditions` queries into Zero (ZQL) where
expressions. `conditionsToZero(definition, query, { fields, operators })`
returns a standard ZQL `ExpressionFactory` (composable with other `where`
calls), mirrors the in-memory operators' semantics (case-insensitive ILIKE
with escaping, null-safe IS/IS NOT, dates as epoch millis), and supports
field renames, per-field value transforms, and custom operator converters.
Type-only peer dependency on `@rocicorp/zero`.
