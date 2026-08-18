---
'@saas-js/conditions': minor
---

Added `foldConditionQuery` (with the `ConditionQueryFolder` type): a
dependency-free bottom-up fold over the query tree for translating queries
into other representations — SQL where clauses, ZQL expressions, predicates.
Conditions map through `folder.condition`; each group combines its mapped
items through `folder.group`.
