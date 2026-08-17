import type {
  ConditionOperator,
  ConditionOperatorId,
  ConditionOperators,
  ConditionStandardSchema,
  ConditionType,
  ConditionValueMode,
} from '../types/condition.types.ts'

export type { ConditionOperator, ConditionOperatorId, ConditionType }

const comparable = (value: unknown) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    if (!Number.isNaN(timestamp) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return timestamp
    }
  }
  return value as any
}

export const defaultOperators = [
  {
    id: 'equals',
    label: 'is',
    types: ['enum', 'string', 'number', 'boolean', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return comparable(actual) === comparable(expected)
    },
  },
  {
    id: 'not',
    label: 'is not',
    types: ['enum', 'string', 'number', 'boolean', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return comparable(actual) !== comparable(expected)
    },
  },
  {
    id: 'gt',
    label: 'greater than',
    types: ['number', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return actual != null && comparable(actual) > comparable(expected)
    },
  },
  {
    id: 'gte',
    label: 'greater than or equal',
    types: ['number', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return actual != null && comparable(actual) >= comparable(expected)
    },
  },
  {
    id: 'lt',
    label: 'less than',
    types: ['number', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return actual != null && comparable(actual) < comparable(expected)
    },
  },
  {
    id: 'lte',
    label: 'less than or equal',
    types: ['number', 'date', 'datetime'],
    valueMode: 'single',
    comparator(actual, expected) {
      return actual != null && comparable(actual) <= comparable(expected)
    },
  },
  {
    id: 'between',
    label: 'is between',
    types: ['number', 'date', 'datetime'],
    valueMode: 'range',
    comparator(actual, expected) {
      if (actual == null || !Array.isArray(expected) || expected.length !== 2) {
        return false
      }
      const value = comparable(actual)
      return (
        value >= comparable(expected[0]) && value <= comparable(expected[1])
      )
    },
  },
  {
    id: 'contains',
    label: 'contains',
    types: ['string'],
    valueMode: 'single',
    comparator(actual, expected) {
      if (Array.isArray(actual)) return actual.includes(expected)
      if (typeof actual !== 'string' || typeof expected !== 'string')
        return false
      return actual.toLocaleLowerCase().includes(expected.toLocaleLowerCase())
    },
  },
  {
    id: 'startsWith',
    label: 'starts with',
    types: ['string'],
    valueMode: 'single',
    comparator(actual, expected) {
      if (typeof actual !== 'string' || typeof expected !== 'string')
        return false
      return actual.toLocaleLowerCase().startsWith(expected.toLocaleLowerCase())
    },
  },
  {
    id: 'endsWith',
    label: 'ends with',
    types: ['string'],
    valueMode: 'single',
    comparator(actual, expected) {
      if (typeof actual !== 'string' || typeof expected !== 'string')
        return false
      return actual.toLocaleLowerCase().endsWith(expected.toLocaleLowerCase())
    },
  },
  {
    id: 'in',
    label: 'is any of',
    types: ['enum', 'string', 'number'],
    valueMode: 'multiple',
    comparator(actual, expected) {
      return Array.isArray(expected) && expected.includes(actual)
    },
  },
  {
    id: 'notIn',
    label: 'is none of',
    types: ['enum', 'string', 'number'],
    valueMode: 'multiple',
    comparator(actual, expected) {
      return Array.isArray(expected) && !expected.includes(actual)
    },
  },
  {
    id: 'some',
    label: 'has some of',
    types: ['enum'],
    valueMode: 'multiple',
    comparator(actual, expected) {
      return (
        Array.isArray(actual) &&
        Array.isArray(expected) &&
        expected.some((item) => actual.includes(item))
      )
    },
  },
  {
    id: 'every',
    label: 'has all of',
    types: ['enum'],
    valueMode: 'multiple',
    comparator(actual, expected) {
      return (
        Array.isArray(actual) &&
        Array.isArray(expected) &&
        expected.every((item) => actual.includes(item))
      )
    },
  },
  {
    id: 'isNull',
    label: 'is empty',
    types: ['enum', 'string', 'number', 'boolean', 'date', 'datetime'],
    valueMode: 'none',
    comparator(actual) {
      return actual == null
    },
  },
  {
    id: 'isNotNull',
    label: 'is not empty',
    types: ['enum', 'string', 'number', 'boolean', 'date', 'datetime'],
    valueMode: 'none',
    comparator(actual) {
      return actual != null
    },
  },
] as const satisfies ConditionOperators

type ConditionOperatorDefinition<
  TOperator extends string,
  TTypes extends readonly string[],
  TValueMode extends ConditionValueMode,
  TSubjectSchema extends ConditionStandardSchema | undefined,
  TValueSchema extends ConditionStandardSchema | undefined,
> = Omit<
  ConditionOperator<
    TOperator,
    TTypes[number],
    TValueMode,
    TSubjectSchema,
    TValueSchema
  >,
  'types'
> & { types: TTypes }

export function defineOperator<
  const TOperator extends string,
  const TTypes extends readonly string[],
  const TValueMode extends Exclude<ConditionValueMode, 'none'>,
  TSubjectSchema extends ConditionStandardSchema,
  TValueSchema extends ConditionStandardSchema,
>(
  operator: ConditionOperatorDefinition<
    TOperator,
    TTypes,
    TValueMode,
    TSubjectSchema,
    TValueSchema
  > & {
    subjectSchema: TSubjectSchema
    valueSchema: TValueSchema
  },
): ConditionOperatorDefinition<
  TOperator,
  TTypes,
  TValueMode,
  TSubjectSchema,
  TValueSchema
> & {
  subjectSchema: TSubjectSchema
  valueSchema: TValueSchema
}
export function defineOperator<
  const TOperator extends string,
  const TTypes extends readonly string[],
  TSubjectSchema extends ConditionStandardSchema,
>(
  operator: ConditionOperatorDefinition<
    TOperator,
    TTypes,
    'none',
    TSubjectSchema,
    undefined
  > & {
    subjectSchema: TSubjectSchema
    valueSchema?: never
  },
): ConditionOperatorDefinition<
  TOperator,
  TTypes,
  'none',
  TSubjectSchema,
  undefined
> & {
  subjectSchema: TSubjectSchema
  valueSchema?: never
}
export function defineOperator(
  operator: ConditionOperator<any, any, any, any, any>,
) {
  return operator
}

export const createOperators = <const TOperators extends ConditionOperators>(
  operators: TOperators,
) => operators

export const getOperatorsByType = <
  TOperators extends ConditionOperators,
  TType extends string,
>(
  type: TType,
  operators: TOperators = defaultOperators as unknown as TOperators,
) => operators.filter(({ types }) => types.includes(type))

export const getOperator = <TOperators extends ConditionOperators>(
  id: string,
  operators: TOperators = defaultOperators as unknown as TOperators,
): TOperators[number] | undefined =>
  operators.find((operator) => operator.id === id)
