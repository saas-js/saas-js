# `@saas-js/conditions-drizzle`

Convert [`@saas-js/conditions`](../conditions/README.md) queries into
[Drizzle ORM](https://orm.drizzle.team) `where` clauses, so the same saved
segment that filters rows in the browser filters rows in the database.

`drizzle-orm` is a peer dependency. The converter is dialect-agnostic: it
emits Drizzle expressions (`eq`, `and`, `or`, `between`, …) plus portable SQL
for the string operators.

## Usage

```ts
import { and, isNotNull } from 'drizzle-orm'
import { conditionsToDrizzle } from '@saas-js/conditions-drizzle'

import { contactConditions } from './conditions.ts' // defineConditions(...)
import { contactsTable, db } from './db.ts'

// The payload is untrusted: parse validates it against the definition and
// revives dates, so only schema outputs reach SQL parameters.
const query = contactConditions.parse(savedSegment.query)

const where = conditionsToDrizzle(contactConditions, query, {
  columns: {
    status: contactsTable.status,
    company: contactsTable.company,
    arr: contactsTable.arr,
    createdAt: contactsTable.createdAt,
    subscribed: contactsTable.subscribed,
  },
})

const rows = await db.select().from(contactsTable).where(where)

// `where` is a plain Drizzle expression — compose it like any other:
await db
  .select()
  .from(contactsTable)
  .where(and(where, isNotNull(contactsTable.deletedAt)))
```

A query with no conditions converts to `undefined`, which Drizzle treats as
no `where` clause.

## Operator mapping

| Operator | SQL |
| --- | --- |
| `equals` / `not` | `=` / `<>` |
| `gt` / `gte` / `lt` / `lte` | comparison operators |
| `between` | `between min and max` |
| `contains` / `startsWith` / `endsWith` | case-insensitive `lower(col) like … escape '\'` with `%`/`_` escaping, matching the in-memory operators' semantics |
| `in` | `in (…)`; an empty list matches nothing |
| `notIn` | `not in (…)`; an empty list constrains nothing |
| `isNull` / `isNotNull` | `is null` / `is not null` |

`some`/`every` compare against array subjects and have no generic SQL form —
map them for your storage model (a join, a Postgres array operator, a JSON
containment check) via `operators`, which also overrides built-ins and adds
custom operators:

```ts
import { sql } from 'drizzle-orm'

conditionsToDrizzle(contactConditions, query, {
  columns,
  operators: {
    // Postgres: case-sensitive equals on a citext-like column
    equals: (target, value) => sql`${target} = ${value}`,
    // custom `matches` operator from the definition
    matches: (target, value) => {
      const { pattern } = value as { pattern: string }
      return sql`${target} ~* ${pattern}`
    },
  },
})
```

Field targets may also be SQL expressions instead of columns (a JSON path,
a computed expression):

```ts
columns: {
  city: sql`${usersTable.profile} ->> 'city'`,
}
```

Conditions on unmapped fields throw `UnmappedConditionFieldError`; operators
without a translation throw `UnsupportedConditionOperatorError` — both fail
loudly rather than silently widening the result set.

## drizzle-crud

`conditionsCrudFilter` is a [drizzle-crud](../drizzle-crud) `filterFn`: it
makes `list({ filters })` accept a serialized condition query — typed as
such — instead of the built-in filter object language:

```ts
import { conditionsCrudFilter } from '@saas-js/conditions-drizzle'

const contacts = createCrud(contactsTable, {
  allowedFilters: ['status', 'arr', 'createdAt'],
  filterFn: conditionsCrudFilter(contactConditions),
})

// The exact payload a client produces with definition.stringify(query):
const { results, total } = await contacts.list({
  filters: savedSegment.query,
  orderBy: [{ field: 'arr', direction: 'desc' }],
  page: 1,
})
```

The adapter parses the untrusted payload with the definition and maps fields
to the crud table's columns, gated by `allowedFilters` (all definition fields
when the allowlist is empty) — a condition on a disallowed field throws
instead of widening the result set. It composes with drizzle-crud's search,
scope filters, soft delete, pagination, and counts, since the converted
query is one more `where` conjunct. `columns` and `operators` options work
the same as `conditionsToDrizzle`.

## Parity

The test suite runs every converted query against a real in-process Postgres
(PGlite) and asserts the returned rows equal `definition.filter(query, rows)`
— the database and the in-memory evaluator agree on flat conditions, string
operators, list operators, and nested AND/OR groups. A second suite covers
the drizzle-crud integration end to end, including allowlist enforcement and
invalid payloads.
