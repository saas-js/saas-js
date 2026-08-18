---
'drizzle-crud': minor
---

Added the `filterFn` crud option, making the `list({ filters })` language
pluggable: the function's input type becomes the `filters` parameter type,
and the function owns validation and conversion to SQL — e.g.
`conditionsCrudFilter` from `@saas-js/conditions-drizzle` accepts serialized
condition queries (saved segments). It receives the crud's `allowedFilters`
so the same allowlist applies, and the zod list schema passes `filters`
through for the function to validate. Without a `filterFn`, the built-in
`FilterParams` object language works unchanged.
