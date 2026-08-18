---
'@saas-js/conditions': patch
---

`getConditionField` now intersects its return type with the base
`ConditionFieldDefinition`, so optional properties like `options` are
accessible on the returned field without casts when not every field in the
definition declares them.
