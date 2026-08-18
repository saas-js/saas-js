# @saas-js/conditions

A framework-agnostic condition expression engine for filters, rule builders,
segments, and other `when`/`where` interfaces.

The package owns a reusable condition definition, versioned AND/OR expression
trees, validation, evaluation, serialization, and immutable mutations. It has
no React, DOM, or visual component code.

## Define conditions

Fields use [Standard Schema](https://standardschema.dev/schema), so their input
and output types are inferred and their values are validated at runtime. Zod,
Valibot, ArkType, and other Standard Schema implementations work without an
adapter.

```ts
import { z } from 'zod'
import { defineConditions } from '@saas-js/conditions'

const contacts = defineConditions({
  fields: {
    status: {
      type: 'enum',
      label: 'Status',
      schema: z.enum(['active', 'pending']),
      operators: ['equals', 'not', 'in'],
      defaultOperator: 'equals',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    age: {
      type: 'number',
      label: 'Age',
      schema: z.number().int().min(0),
      operators: ['gte', 'lte', 'between'],
      defaultOperator: 'gte',
    },
  },
})
```

`fields` and optional `operators` are the only definition properties. The
definition can be shared by filter UIs, rule builders, server validation, and
multiple independent stores.

The field `type` is intentional UI and operator metadata. Standard Schema
infers and validates values, but does not guarantee the introspection needed to
choose a date picker, number input, or combobox.

## Create a store

```ts
const store = contacts.createStore({
  onValueChange({ value }) {
    console.log(value)
  },
})

store.actions.addCondition({
  id: 'active',
  field: 'status',
  value: 'active',
})

store.actions.addCondition({
  id: 'pending',
  field: 'status',
  value: 'pending',
})

store.actions.group(['active', 'pending'], 'or', {
  id: 'allowed-statuses',
})

store.actions.addCondition({
  id: 'adult',
  field: 'age',
  operator: 'gte',
  value: 18,
})
```

This produces an AND root containing an OR status group and an age condition.
Multiple conditions may target the same field because every expression has its
own stable id.

The store uses TanStack Store internally and exposes a framework-neutral
`get()` and `subscribe()` interface. Mutations are immutable and validated
before publication.

## The query

Everything in this package produces or consumes a **condition query**: a
plain, versioned tree of groups and conditions. The store above holds one as
its value:

```ts
const query = store.get().value
```

```ts
{
  version: 1,
  root: {
    kind: 'group',
    id: 'root',
    combinator: 'and', // every item must match
    items: [
      {
        kind: 'group',
        id: 'allowed-statuses',
        combinator: 'or', // at least one item must match
        items: [
          { kind: 'condition', id: 'active', field: 'status', operator: 'equals', value: 'active' },
          { kind: 'condition', id: 'pending', field: 'status', operator: 'equals', value: 'pending' },
        ],
      },
      { kind: 'condition', id: 'adult', field: 'age', operator: 'gte', value: 18 },
    ],
  },
}
```

The building blocks:

- A **condition** is one comparison: `field`, `operator`, and (unless the
  operator's value mode is `none`) a `value`. It reads as
  "`status` `equals` `'active'`".
- A **group** combines items with a `combinator` — `and` or `or` — and groups
  nest arbitrarily deep.
- The **root** is always a group, and `version` stamps the format for stored
  payloads.
- Every node has a stable `id`, which is how store actions
  (`updateCondition`, `remove`, `parentId` targets) and UI code address nodes
  inside the tree.

A query is just data — no classes, no store required. It can be typed against
a definition, built or inspected directly, and traversed with the expression
helpers:

```ts
import {
  type ConditionQueryForDefinition,
  createConditionQuery,
  findConditionExpression,
  isConditionGroup,
} from '@saas-js/conditions'

type ContactsQuery = ConditionQueryForDefinition<typeof contacts>

const adults = createConditionQuery({
  items: [
    {
      kind: 'condition',
      id: 'adult',
      field: 'age',
      operator: 'gte',
      value: 18,
    },
  ],
})

const node = findConditionExpression(query.root, 'allowed-statuses')
if (node && isConditionGroup(node)) console.log(node.combinator) // 'or'
```

## Infer operator operands

Built-in operator operands are derived from the field schema and value mode:

- `single` operators accept one field value.
- `multiple` operators accept an array of field values.
- `range` operators accept a two-value tuple.
- `none` operators do not accept a value.

For example, `status in` accepts `('active' | 'pending')[]`, while `age
between` accepts `[number, number]`.

## Define custom operators

Custom operators use Standard Schema for both the subject and operand. The
comparator parameters are inferred without generic annotations.

```ts
import {
  defaultOperators,
  defineConditions,
  defineOperator,
} from '@saas-js/conditions'

const matches = defineOperator({
  id: 'matches',
  label: 'matches',
  types: ['string'],
  valueMode: 'single',
  subjectSchema: z.string(),
  valueSchema: z.object({
    pattern: z.string().min(1),
    flags: z.string().default('i'),
  }),
  serialize(value) {
    return `${value.flags}:${value.pattern}`
  },
  deserialize(value) {
    const [flags, pattern] = String(value).split(':')
    return { flags, pattern }
  },
  comparator(actual, expected) {
    // actual: string
    // expected: { pattern: string; flags: string }
    return new RegExp(expected.pattern, expected.flags).test(actual)
  },
})

const searchableContacts = defineConditions({
  operators: [...defaultOperators, matches],
  fields: {
    name: {
      type: 'string',
      schema: z.string(),
      operators: ['equals', 'matches'],
    },
  },
})
```

Operator ids, supported field types, operand shapes, and comparator arguments
are checked statically. The same schemas validate query values and custom
operator subjects at runtime.

## Validate, evaluate, and serialize

A query on its own is inert data — holding one means nothing has been checked
or run yet. The definition's pure operations do that work, and they fall into
three groups:

**Validation** — is this query structurally sound for this definition?

```ts
// Check without throwing. Returns { valid, issues }, where each issue has a
// code ('unknown_field', 'invalid_value', …), message, node id, and path.
const result = contacts.validate(query)
if (!result.valid) console.warn(result.issues)

// Check and narrow. Returns the query typed against the definition with all
// schema transformations applied (e.g. z.coerce.number() output), or throws
// InvalidConditionQueryError with the same issues.
const checked = contacts.assert(query)
```

Use `validate` to display problems (a form, an API response); use `assert` at
trust boundaries where an invalid query is a programming error.

**Evaluation** — which subjects match the query?

```ts
// One subject → boolean. Field values are read by property name, or through
// the field's `accessor` when defined.
contacts.evaluate(query, { status: 'active', age: 21 }) // true

// Many subjects → the matching subset, in order.
const adults = contacts.filter(query, contactList)
```

Evaluation runs the operator comparators against validated values: an `and`
group matches when every item matches, an `or` group when at least one does.

**Serialization** — move a query across a wire or into storage and back.

```ts
const json = contacts.serialize(query) // JSON-safe object (dates → ISO strings)
const text = contacts.stringify(query) // JSON string of the same
const restored = contacts.parse(text) // accepts a string or a parsed object
```

`parse` is the single entry point for untrusted input: it deserializes,
revives dates and custom field/operator values, validates against the
definition, and returns the typed query — or throws when the payload does not
fit. `serialize`/`parse` round-trip exactly: `parse(stringify(query))` deep
equals `query`.

The store exposes the same operations bound to its current value, so UI code
does not pass the query around:

```ts
store.validate() // validate the current value
store.evaluate(subject) // match one subject against the current value
store.serialize() // JSON-safe object of the current value
store.stringify() // JSON string of the current value
```

Condition queries include a format version. Dates are encoded as ISO strings
and restored according to the field type. Fields can customize scalar value
serialization without changing the query format:

```ts
const geometry = defineConditions({
  fields: {
    point: {
      type: 'point',
      schema: z.object({ x: z.number(), y: z.number() }),
      operators: ['equals'],
      serialize: ({ x, y }) => `${x},${y}`,
      deserialize: (value) => {
        const [x, y] = String(value).split(',').map(Number)
        return { x, y }
      },
    },
  },
})
```

For built-in `multiple` and `range` operators, field hooks are applied to each
item. Custom operators can define their own hooks, as in `matches` above;
operator hooks take precedence because their operand may differ from the field
value.

Committed store operations require synchronous Standard Schema validators.
Schema transformations are applied before a query is published, so committed
values always contain the inferred schema output. Async option loading remains
part of individual field definitions.

## End-to-end example

One definition carries a saved segment from the browser to the database and
back: the client builds and persists the query, the server re-validates the
untrusted payload with the same definition, and either side can run it against
data.

```ts
import { z } from 'zod'
import {
  type ConditionQueryForDefinition,
  defineConditions,
} from '@saas-js/conditions'

// 1. Define once — shared by client, server, and tests.
export const contactConditions = defineConditions({
  fields: {
    status: {
      type: 'enum',
      label: 'Status',
      schema: z.enum(['lead', 'customer', 'churned']),
      operators: ['equals', 'not', 'in'],
      defaultOperator: 'equals',
    },
    arr: {
      type: 'number',
      label: 'ARR',
      schema: z.coerce.number().min(0),
      operators: ['gte', 'lte', 'between'],
      defaultOperator: 'gte',
    },
    createdAt: {
      type: 'date',
      label: 'Created',
      schema: z.coerce.date(),
      operators: ['gte', 'lte', 'between'],
      defaultOperator: 'gte',
    },
  },
})

export type ContactsQuery = ConditionQueryForDefinition<
  typeof contactConditions
>
```

```ts
// 2. Build a query. In an app this is usually driven by a UI
//    (see @saas-js/conditions-react); the store API is the same.
const store = contactConditions.createStore()

store.actions.addCondition({ id: 'active', field: 'status', value: 'customer' })

const revenue = store.actions.addGroup({ id: 'revenue', combinator: 'or' })
store.actions.addCondition(
  { field: 'arr', operator: 'gte', value: 50_000 },
  { parentId: revenue },
)
store.actions.addCondition(
  { field: 'createdAt', operator: 'gte', value: new Date('2025-01-01') },
  { parentId: revenue },
)
// → status is customer AND (arr ≥ 50k OR created since 2025)

// 3. Persist it. Dates become ISO strings; the payload is versioned JSON.
await api.saveSegment({ name: 'High value', query: store.stringify() })
```

```ts
// 4. On the server (or the next session), parse the untrusted payload with
//    the same definition. Invalid fields, operators, or values throw with
//    structured issues; valid payloads come back fully typed, with dates
//    revived and schema coercions applied.
const query: ContactsQuery = contactConditions.parse(saved.query)

// 5. Run it against data.
const matches = contactConditions.filter(query, contacts)
contactConditions.evaluate(query, {
  status: 'customer',
  arr: 84_000,
  createdAt: new Date('2025-01-14'),
}) // true

// Or translate the tree to another backend — it is a plain versioned
// structure of groups and conditions, and `foldConditionQuery` folds it
// bottom-up into any representation. @saas-js/conditions-drizzle turns it
// into a Drizzle `where` clause, @saas-js/conditions-tanstack-table filters
// TanStack Table rows with it, and @saas-js/conditions-zero converts it to
// a Zero (ZQL) where expression.
const summary = foldConditionQuery(query, {
  condition: (condition) => `${condition.field} ${condition.operator}`,
  group: (combinator, parts) => `(${parts.join(` ${combinator} `)})`,
})
```

To reject bad payloads without exceptions, use `validate` instead of `parse`
on the deserialized object and return `result.issues` to the client.

Rendering, focus management, and filter/rule-builder terminology belong to the
consuming SaaS UI packages.
