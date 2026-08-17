import type {
  Condition,
  ConditionExpression,
  ConditionFields,
  ConditionOperators,
  ConditionQuery,
} from '../types/condition.types.ts'
import { isConditionGroup } from './expression.ts'
import type { ConditionsDefinition } from './schema.ts'
import {
  assertValidConditionQuery,
  getConditionOperator,
  parseStandardSchema,
} from './validation.ts'

export interface EvaluateConditionOptions {
  validate?: boolean
}

export function evaluateConditionQuery<
  TSubject,
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  query: ConditionQuery<any>,
  subject: TSubject,
  definition: ConditionsDefinition<TFields, TOperators>,
  options: EvaluateConditionOptions = {},
): boolean {
  const value =
    options.validate === false
      ? query
      : assertValidConditionQuery(query, definition)
  return evaluateConditionExpression(value.root, subject, definition)
}

export function evaluateConditionExpression<
  TSubject,
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  expression: ConditionExpression,
  subject: TSubject,
  definition: ConditionsDefinition<TFields, TOperators>,
): boolean {
  if (isConditionGroup(expression)) {
    if (expression.combinator === 'and') {
      return expression.items.every((item) =>
        evaluateConditionExpression(item, subject, definition),
      )
    }
    return expression.items.some((item) =>
      evaluateConditionExpression(item, subject, definition),
    )
  }

  return evaluateCondition(expression, subject, definition)
}

export function filterByConditionQuery<
  TSubject,
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  subjects: readonly TSubject[],
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<TFields, TOperators>,
): TSubject[] {
  const value = assertValidConditionQuery(query, definition)
  return subjects.filter((subject) =>
    evaluateConditionExpression(value.root, subject, definition),
  )
}

function evaluateCondition<TSubject>(
  condition: Condition,
  subject: TSubject,
  definition: ConditionsDefinition<any, any>,
) {
  const field = definition.fields[condition.field]
  const operator = getConditionOperator(definition, condition.operator)
  if (!field || !operator) return false

  const actualValue = field.accessor
    ? field.accessor(subject)
    : getValueAtPath(subject, condition.field)

  const parsedActual = operator.subjectSchema
    ? parseStandardSchema(
        operator.subjectSchema,
        actualValue,
        `operator "${operator.id}" subject`,
      )
    : { value: actualValue }

  if ('issues' in parsedActual && parsedActual.issues) return false

  return operator.comparator(parsedActual.value, condition.value, {
    field: condition.field,
    type: field.type,
    operator: condition.operator,
  })
}

function getValueAtPath(subject: unknown, path: string): unknown {
  if (subject == null || typeof subject !== 'object') return undefined
  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
  }, subject)
}
