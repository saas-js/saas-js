import type {
  Column,
  FilterFn,
  RowData,
  TableFeatures,
} from '@tanstack/table-core'

import type { ConditionQuery, ConditionsDefinition } from '@saas-js/conditions'

export interface ConditionsFilterOptions<TData extends RowData> {
  /**
   * Derive the evaluation subject from a row. Defaults to `row.original`.
   * Useful when rows wrap the domain object or need computed fields.
   */
  subject?: (row: { original: TData }) => unknown
}

/**
 * A TanStack Table `FilterFn` that evaluates the whole row against the
 * conditions query passed as the filter value. Rows pass while the filter
 * value is absent or the query has no conditions.
 *
 * Conditions queries are nested AND/OR trees, which TanStack Table's flat
 * per-column filter state cannot represent — so the integration filters at
 * the row level through the global filter instead of `columnFilters`.
 */
export function createConditionsFilterFn<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  definition: ConditionsDefinition<any, any>,
  options: ConditionsFilterOptions<TData> = {},
): FilterFn<TFeatures, TData> {
  return (row, _columnId, filterValue) => {
    const query = filterValue as ConditionQuery<any> | undefined | null
    if (!query || query.root.items.length === 0) return true
    return definition.evaluate(
      query,
      options.subject ? options.subject(row) : row.original,
    )
  }
}

/**
 * Table options that filter rows with a conditions query as the global
 * filter. Spread into `useTable` (requires `columnFilteringFeature`,
 * `globalFilteringFeature`, and `filteredRowModel` in the table's features)
 * and drive `state.globalFilter` with the query:
 *
 * ```tsx
 * const table = useTable({
 *   features,
 *   columns,
 *   data,
 *   ...conditionsGlobalFilter(definition),
 *   state: { globalFilter: query },
 * })
 * ```
 *
 * The returned `getColumnCanGlobalFilter` marks only the first leaf column
 * as globally filterable: the filter function evaluates the whole row, so a
 * single eligible column makes each row evaluate exactly once (TanStack
 * Table skips global filtering entirely when no column is eligible).
 */
export function conditionsGlobalFilter<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  definition: ConditionsDefinition<any, any>,
  options: ConditionsFilterOptions<TData> = {},
): {
  globalFilterFn: FilterFn<TFeatures, TData>
  getColumnCanGlobalFilter: <
    TColumnFeatures extends TableFeatures,
    TColumnData extends RowData,
    TValue,
  >(
    column: Column<TColumnFeatures, TColumnData, TValue>,
  ) => boolean
} {
  return {
    globalFilterFn: createConditionsFilterFn(definition, options),
    getColumnCanGlobalFilter: (column) =>
      column.table.getAllLeafColumns()[0]?.id === column.id,
  }
}
