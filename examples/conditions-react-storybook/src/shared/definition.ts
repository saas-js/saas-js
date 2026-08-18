import { z } from 'zod'

import {
  type ConditionQueryForDefinition,
  defaultOperators,
  defineConditions,
} from '@saas-js/conditions'

export interface Contact {
  id: string
  name: string
  status: 'lead' | 'customer' | 'churned'
  company: string
  arr: number
  createdAt: Date
  subscribed: boolean
  owner: string
}

export const owners = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'katherine', label: 'Katherine Johnson' },
  { value: 'margaret', label: 'Margaret Hamilton' },
] as const

const loadOwners = async ({
  query,
  signal,
}: {
  query: string
  signal: AbortSignal
}) => {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, 350)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
  const normalized = query.trim().toLocaleLowerCase()
  return owners.filter((owner) =>
    owner.label.toLocaleLowerCase().includes(normalized),
  )
}

export const contactsDefinition = defineConditions({
  operators: defaultOperators,
  fields: {
    status: {
      type: 'enum',
      label: 'Status',
      schema: z.enum(['lead', 'customer', 'churned']),
      operators: ['equals', 'not', 'in'],
      defaultOperator: 'equals',
      options: [
        { value: 'lead', label: 'Lead' },
        { value: 'customer', label: 'Customer' },
        { value: 'churned', label: 'Churned' },
      ],
    },
    company: {
      type: 'string',
      label: 'Company',
      schema: z.string().min(1),
      operators: ['contains', 'equals', 'startsWith', 'isNull'],
      defaultOperator: 'contains',
    },
    arr: {
      type: 'number',
      label: 'ARR',
      schema: z.coerce.number().min(0),
      operators: ['equals', 'gte', 'lte', 'between'],
      defaultOperator: 'gte',
      meta: { format: 'currency' },
    },
    createdAt: {
      type: 'date',
      label: 'Created',
      schema: z.coerce.date(),
      operators: ['equals', 'gte', 'lte', 'between'],
      defaultOperator: 'gte',
    },
    subscribed: {
      type: 'boolean',
      label: 'Subscribed',
      schema: z.boolean(),
      operators: ['equals'],
      defaultOperator: 'equals',
    },
    owner: {
      type: 'string',
      label: 'Owner',
      schema: z.string(),
      operators: ['equals', 'not'],
      defaultOperator: 'equals',
      options: loadOwners,
    },
  },
})

export type ContactsQuery = ConditionQueryForDefinition<
  typeof contactsDefinition
>

export const contacts: Contact[] = [
  {
    id: 'northstar',
    name: 'Maya Chen',
    status: 'customer',
    company: 'Northstar Labs',
    arr: 84000,
    createdAt: new Date('2025-01-14'),
    subscribed: true,
    owner: 'ada',
  },
  {
    id: 'foundry',
    name: 'Jon Bell',
    status: 'lead',
    company: 'Foundry Works',
    arr: 24000,
    createdAt: new Date('2025-06-03'),
    subscribed: false,
    owner: 'grace',
  },
  {
    id: 'meridian',
    name: 'Priya Shah',
    status: 'customer',
    company: 'Meridian Health',
    arr: 132000,
    createdAt: new Date('2024-11-22'),
    subscribed: true,
    owner: 'katherine',
  },
  {
    id: 'paperplane',
    name: 'Alex Moreno',
    status: 'churned',
    company: 'Paperplane Studio',
    arr: 18000,
    createdAt: new Date('2024-08-09'),
    subscribed: false,
    owner: 'margaret',
  },
  {
    id: 'signal',
    name: 'Noor Aziz',
    status: 'lead',
    company: 'Signal & Tide',
    arr: 56000,
    createdAt: new Date('2025-05-18'),
    subscribed: true,
    owner: 'ada',
  },
]

function makeQuery(
  build: (store: ReturnType<typeof contactsDefinition.createStore>) => void,
) {
  const store = contactsDefinition.createStore()
  build(store)
  return store.get().value
}

export const compactQuery = makeQuery((store) => {
  store.actions.addCondition({
    id: 'status-customer',
    field: 'status',
    value: 'customer',
  })
})

export const advancedQuery = makeQuery((store) => {
  const group = store.actions.addGroup({
    id: 'revenue-or-date',
    combinator: 'or',
  })
  store.actions.addCondition(
    { id: 'high-arr', field: 'arr', operator: 'gte', value: 50000 },
    { parentId: group },
  )
  store.actions.addCondition(
    {
      id: 'recent',
      field: 'createdAt',
      operator: 'gte',
      value: new Date('2025-01-01'),
    },
    { parentId: group },
  )
  store.actions.addCondition({
    id: 'subscribed',
    field: 'subscribed',
    value: true,
  })
})

export const ownerQuery = makeQuery((store) => {
  store.actions.addCondition({ id: 'owner', field: 'owner', value: 'ada' })
})

export const customEditorQuery = makeQuery((store) => {
  store.actions.addCondition({
    id: 'arr',
    field: 'arr',
    operator: 'between',
    value: [25000, 100000],
  })
})

export const formatContactValue = (field: string, value: unknown) => {
  if (field === 'arr')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(value))
  if (field === 'createdAt' && value instanceof Date)
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  if (field === 'owner')
    return owners.find((owner) => owner.value === value)?.label ?? String(value)
  return String(value)
}
