import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, UsersRound } from 'lucide-react'

import { conditionsGlobalFilter } from '@saas-js/conditions-tanstack-table'

import {
  type Contact,
  contacts,
  contactsDefinition,
  formatContactValue,
} from '../shared/definition.ts'
import { base } from './conditions-hook.ts'
import { cn } from './lib/utils.ts'

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

const helper = createColumnHelper<typeof features, Contact>()

const columns = helper.columns([
  helper.accessor('name', { header: 'Contact' }),
  helper.accessor('status', { header: 'Status' }),
  helper.accessor('arr', {
    header: 'ARR',
    cell: ({ getValue }) => formatContactValue('arr', getValue()),
  }),
  helper.accessor('owner', {
    header: 'Owner',
    cell: ({ getValue }) => formatContactValue('owner', getValue()),
  }),
])

// The conditions query drives TanStack Table's global filter: the filter fn
// evaluates each row's original against the query through the definition.
const filterOptions = conditionsGlobalFilter<typeof features, Contact>(
  contactsDefinition,
)

/**
 * A real TanStack (React) Table v9 filtered by the conditions query and
 * sortable by column, instead of the hand-rolled ContactTable.
 */
export function TanStackContactTable() {
  const conditions = base.useConditionsContext()
  const query = conditions.useValue()

  const table = useTable({
    features,
    columns,
    data: contacts,
    ...filterOptions,
    state: { globalFilter: query },
  })

  const rows = table.getRowModel().rows

  return (
    <section
      className="overflow-hidden rounded-xl border bg-white"
      aria-label="Matching contacts"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Contacts</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            TanStack Table v9 · global filter driven by the condition query
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-600">
          {rows.length} of {contacts.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b bg-zinc-50/70 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th key={header.id} className="px-4 py-2 text-left">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-zinc-800"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : null}
                          {sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : null}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-zinc-50/70"
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-4 py-3',
                      cell.column.id === 'arr' && 'font-mono text-xs',
                      cell.column.id === 'status' && 'capitalize',
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <div className="px-4 py-14 text-center">
            <UsersRound className="mx-auto h-5 w-5 text-zinc-400" />
            <p className="mt-3 text-sm font-medium">No matching contacts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try widening or removing a filter.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
