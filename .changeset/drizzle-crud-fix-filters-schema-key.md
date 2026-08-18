---
'drizzle-crud': patch
---

Fixed the zod list schema validating the filter object under the wrong key:
it was declared as `where` instead of `filters`, so client `filters`
payloads were never validated and the SQL `where` escape hatch failed
validation whenever zod validation was enabled.
