# `@saas-js/conditions-tanstack-table`

Filter [TanStack Table](https://tanstack.com/table) v9 rows with
[`@saas-js/conditions`](../conditions/README.md) queries: the condition query
becomes the table's global filter, and every row is evaluated against it
through the definition.

`@tanstack/table-core` v9 is a peer dependency; use it through any adapter
(`@tanstack/react-table`, solid, vue, …).

## Why the global filter

Condition queries are nested AND/OR trees. TanStack Table's `columnFilters`
state is flat — one value per column — so a tree cannot round-trip through
it. Instead of decomposing queries, this package filters at the row level:
`definition.evaluate(query, row.original)` as the table's `globalFilterFn`.
Sorting, pagination, grouping, and column filters stay plain TanStack Table.

## Usage (React)

```tsx
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'

import { conditionsGlobalFilter } from '@saas-js/conditions-tanstack-table'

import { contactConditions } from './conditions.ts' // defineConditions(...)

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
})

const helper = createColumnHelper<typeof features, Contact>()
const columns = helper.columns([
  helper.accessor('name', { header: 'Contact' }),
  helper.accessor('arr', { header: 'ARR' }),
])

// Module scope: stable across renders.
const filterOptions = conditionsGlobalFilter<typeof features, Contact>(
  contactConditions,
)

function ContactTable({ query }: { query: ContactsQuery }) {
  const table = useTable({
    features,
    columns,
    data: contacts,
    ...filterOptions,
    state: { globalFilter: query },
  })
  // render table.getHeaderGroups() / table.getRowModel() as usual
}
```

With `@saas-js/conditions-react`, the query comes straight from the builder
UI and the table refilters live as chips change:

```tsx
const conditions = contactUI.useConditionsContext()
const query = conditions.useValue()
// ...state: { globalFilter: query }
```

An empty query (or `undefined`) keeps every row.

## API

- `conditionsGlobalFilter(definition, options?)` — table options to spread
  into `useTable`: a `globalFilterFn` evaluating rows against the query, and
  a `getColumnCanGlobalFilter` restricting eligibility to the first leaf
  column. The filter function judges the whole row, so one eligible column
  means each row is evaluated exactly once (and global filtering is never
  skipped for lack of eligible columns).
- `createConditionsFilterFn(definition, options?)` — just the `FilterFn`,
  when you manage eligibility yourself.
- `options.subject` — derive the evaluation subject from a row (defaults to
  `row.original`), for rows that wrap the domain object.

## Server-side filtering

For manual/server filtering, skip this package on the client: set
`manualFiltering: true`, send the serialized query
(`definition.stringify(query)`) with the request, and convert it to SQL on
the server — see
[`@saas-js/conditions-drizzle`](../conditions-drizzle/README.md).

## Example

The [`conditions-react-storybook`](../../examples/conditions-react-storybook)
workspace includes a "TanStack Table" story: a sortable v9 table under the
shadcn filter bar, refiltering as conditions change.
