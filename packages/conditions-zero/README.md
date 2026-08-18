# `@saas-js/conditions-zero`

Convert [`@saas-js/conditions`](../conditions/README.md) queries into
[Zero](https://zero.rocicorp.dev) (ZQL) where expressions, so a saved segment
built with the conditions UI filters rows straight from the client-side sync
replica.

`@rocicorp/zero` is a peer dependency, used for types only — the converter
builds conditions through the expression builder ZQL hands to `where`, so
there is no runtime coupling to a specific Zero version.

## Usage

```ts
import { conditionsToZero } from '@saas-js/conditions-zero'

import { contactConditions } from './conditions.ts' // defineConditions(...)

// The payload is untrusted: parse validates it against the definition and
// revives dates, so only schema outputs reach the query.
const query = contactConditions.parse(savedSegment.query)

const contacts = zql.contact.where(conditionsToZero(contactConditions, query))
```

The returned factory is a standard ZQL `ExpressionFactory` — compose it like
any other condition:

```ts
zql.contact
  .where(conditionsToZero(contactConditions, query))
  .where('workspaceId', workspaceId)
  .orderBy('createdAt', 'desc')
```

An empty query converts to `and()` (ZQL's TRUE) and keeps every row.

With `@saas-js/conditions-react`, the query comes straight from the builder
UI and the synced view refilters live:

```tsx
const conditions = contactUI.useConditionsContext()
const query = conditions.useValue()
const [contacts] = useQuery(
  zql.contact.where(conditionsToZero(contactConditions, query)),
)
```

## Operator mapping

| Operator | ZQL |
| --- | --- |
| `equals` / `not` | `=` / `!=` |
| `gt` / `gte` / `lt` / `lte` | order operators |
| `between` | `and(>= min, <= max)` |
| `contains` / `startsWith` / `endsWith` | case-insensitive `ILIKE` with `%`/`_`/`\` escaping, matching the in-memory operators' semantics |
| `in` / `notIn` | `IN` / `NOT IN`; an empty `notIn` list constrains nothing |
| `isNull` / `isNotNull` | `IS null` / `IS NOT null` (ZQL's null-safe comparisons) |

`some`/`every` compare against array subjects and have no ZQL form — map them
yourself (e.g. via `exists` on a relationship) through `operators`, which
also overrides built-ins and adds custom operators:

```ts
conditionsToZero(contactConditions, query, {
  operators: {
    // case-sensitive equals instead of the default
    equals: (value, { eb, column, mapValue }) =>
      eb.cmp(column, '=', mapValue(value)),
    // custom `matches` operator from the definition
    matches: (value, { eb, column }) => {
      const { pattern } = value as { pattern: string }
      return eb.cmp(column, 'ILIKE', `%${pattern}%`)
    },
  },
})
```

## Field mapping

Condition field ids map to Zero columns by name. Rename columns or transform
values with `fields`:

```ts
conditionsToZero(contactConditions, query, {
  fields: {
    company: 'company_name', // different column name
    createdAt: {
      // dates map to epoch millis by default; override per field if your
      // schema stores something else
      value: (value) => (value as Date).toISOString(),
    },
  },
})
```

By default `Date` values convert to epoch milliseconds — Zero's convention
for timestamps — and all other primitives pass through.

Operators without a translation throw `UnsupportedConditionOperatorError`
rather than silently widening the result set.

## Parity

The test suite builds every conversion through Zero's real schema-checked
query builder (`createBuilder` + `where`) and asserts that evaluating the
generated ZQL AST returns exactly the rows `definition.filter(query, rows)`
returns — including nested AND/OR groups, LIKE escaping, null handling, and
date conversion.
