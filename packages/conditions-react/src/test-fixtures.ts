import { z } from 'zod'

import { defineConditions } from '@saas-js/conditions'

export const testDefinition = defineConditions({
  fields: {
    name: {
      type: 'string',
      label: 'Name',
      schema: z.string().min(1),
      operators: ['contains', 'equals', 'isNull'],
      defaultOperator: 'contains',
    },
    age: {
      type: 'number',
      label: 'Age',
      schema: z.coerce.number().min(0),
      operators: ['equals', 'between'],
      defaultOperator: 'equals',
    },
    status: {
      type: 'enum',
      label: 'Status',
      schema: z.enum(['active', 'paused', 'closed']),
      operators: ['equals', 'in'],
      defaultOperator: 'equals',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  },
})
