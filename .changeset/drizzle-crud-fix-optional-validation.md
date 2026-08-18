---
'drizzle-crud': patch
---

Fixed a crash when no validation adapter is configured: `createCrud` passed
an empty (truthy) validation object to the schema factory, which then called
undefined adapter methods.
