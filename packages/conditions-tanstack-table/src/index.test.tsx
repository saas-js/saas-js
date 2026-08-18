import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'

import {
  type ConditionQueryForDefinition,
  defineConditions,
} from '@saas-js/conditions'

import { conditionsGlobalFilter } from './index.ts'

const definition = defineConditions({
  fields: {
    status: {
      type: 'enum',
      schema: z.enum(['lead', 'customer', 'churned']),
      operators: ['equals', 'in'],
    },
    arr: {
      type: 'number',
      schema: z.number(),
      operators: ['gte', 'lte', 'between'],
    },
  },
})

type ContactsQuery = ConditionQueryForDefinition<typeof definition>

interface Contact {
  id: string
  status: 'lead' | 'customer' | 'churned'
  arr: number
}

const contacts: Contact[] = [
  { id: 'northstar', status: 'customer', arr: 84_000 },
  { id: 'foundry', status: 'lead', arr: 24_000 },
  { id: 'meridian', status: 'customer', arr: 132_000 },
  { id: 'paperplane', status: 'churned', arr: 18_000 },
]

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
})

const helper = createColumnHelper<typeof features, Contact>()
const columns = helper.columns([
  helper.accessor('id', { header: 'Id' }),
  helper.accessor('status', { header: 'Status' }),
  helper.accessor('arr', { header: 'ARR' }),
])

const filterOptions = conditionsGlobalFilter<typeof features, Contact>(
  definition,
)

function Rows({ query }: { query: ContactsQuery }) {
  const table = useTable({
    features,
    columns,
    data: contacts,
    ...filterOptions,
    state: { globalFilter: query },
  })
  return (
    <output>
      {table
        .getRowModel()
        .rows.map((row) => row.original.id)
        .join(',')}
    </output>
  )
}

const makeQuery = (
  build: (store: ReturnType<typeof definition.createStore>) => void,
): ContactsQuery => {
  const store = definition.createStore()
  build(store)
  return store.get().value
}

describe('conditionsGlobalFilter', () => {
  it('keeps every row for an empty query', () => {
    render(<Rows query={makeQuery(() => {})} />)
    expect(
      screen.getByText('northstar,foundry,meridian,paperplane'),
    ).toBeTruthy()
  })

  it('filters rows like the in-memory evaluator', () => {
    const query = makeQuery((store) => {
      store.actions.addCondition({ field: 'status', value: 'customer' })
      store.actions.addCondition({
        field: 'arr',
        operator: 'gte',
        value: 100_000,
      })
    })
    render(<Rows query={query} />)
    const expected = definition
      .filter(query, contacts)
      .map((contact) => contact.id)
      .join(',')
    expect(expected).toBe('meridian')
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('handles nested AND/OR groups', () => {
    const query = makeQuery((store) => {
      const group = store.actions.addGroup({ combinator: 'or' })
      store.actions.addCondition(
        { field: 'arr', operator: 'lte', value: 20_000 },
        { parentId: group },
      )
      store.actions.addCondition(
        { field: 'status', operator: 'equals', value: 'lead' },
        { parentId: group },
      )
    })
    render(<Rows query={query} />)
    expect(screen.getByText('foundry,paperplane')).toBeTruthy()
  })

  it('evaluates each row exactly once', () => {
    const evaluate = vi.fn(definition.evaluate)
    const spied = { ...definition, evaluate }
    const options = conditionsGlobalFilter<typeof features, Contact>(spied)

    function SpiedRows({ query }: { query: ContactsQuery }) {
      const table = useTable({
        features,
        columns,
        data: contacts,
        ...options,
        state: { globalFilter: query },
      })
      return <output>{table.getRowModel().rows.length}</output>
    }

    const query = makeQuery((store) =>
      store.actions.addCondition({ field: 'status', value: 'churned' }),
    )
    render(<SpiedRows query={query} />)
    expect(screen.getByText('1')).toBeTruthy()
    // One evaluation per row: eligibility is restricted to a single column,
    // so the row-level predicate never runs once per column.
    expect(evaluate).toHaveBeenCalledTimes(contacts.length)
  })
})
