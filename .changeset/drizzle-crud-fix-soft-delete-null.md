---
'drizzle-crud': patch
---

Fixed soft delete with a `null` not-deleted sentinel (the default): the
filter generated `field = NULL`, which never matches in SQL, so every read
returned zero rows. A null sentinel now generates `field IS NULL`.
