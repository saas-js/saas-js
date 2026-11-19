# @saas-js/conditions

## 0.1.0

### Minor Changes

- 8b4478f: Added `foldConditionQuery` (with the `ConditionQueryFolder` type): a
  dependency-free bottom-up fold over the query tree for translating queries
  into other representations — SQL where clauses, ZQL expressions, predicates.
  Conditions map through `folder.condition`; each group combines its mapped
  items through `folder.group`.

### Patch Changes

- 8b4478f: `getConditionField` now intersects its return type with the base
  `ConditionFieldDefinition`, so optional properties like `options` are
  accessible on the returned field without casts when not every field in the
  definition declares them.
