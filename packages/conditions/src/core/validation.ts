import type {
  Condition,
  ConditionExpression,
  ConditionFieldDefinition,
  ConditionFieldId,
  ConditionFields,
  ConditionForFields,
  ConditionOperators,
  ConditionQuery,
  ConditionStandardSchema,
  ConditionValidationIssue,
  ConditionValidationResult,
} from '../types/condition.types.ts'
import { CONDITION_QUERY_VERSION } from '../types/condition.types.ts'
import { isConditionGroup } from './expression.ts'
import type { ConditionsDefinition } from './schema.ts'

export class InvalidConditionQueryError extends Error {
  readonly issues: ConditionValidationIssue[]

  constructor(issues: ConditionValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(' '))
    this.name = 'InvalidConditionQueryError'
    this.issues = issues
  }
}

export class AsyncConditionSchemaError extends Error {
  constructor(context: string) {
    super(
      `The Standard Schema used by ${context} validates asynchronously. ` +
        'Conditions store operations require synchronous schemas.',
    )
    this.name = 'AsyncConditionSchemaError'
  }
}

export function getConditionField<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  definition: ConditionsDefinition<TFields, TOperators>,
  id: string,
): (TFields[ConditionFieldId<TFields>] & ConditionFieldDefinition) | undefined {
  return definition.fields[id] as
    | (TFields[ConditionFieldId<TFields>] & ConditionFieldDefinition)
    | undefined
}

export function getConditionOperator<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  definition: ConditionsDefinition<TFields, TOperators>,
  id: string,
): TOperators[number] | undefined {
  return definition.operators.find((operator) => operator.id === id)
}

export function getConditionFieldOperators<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  definition: ConditionsDefinition<TFields, TOperators>,
  field: ConditionFieldDefinition<any, any, any, any, any>,
): TOperators[number][] {
  const allowed = field.operators
  return definition.operators.filter(
    (operator) =>
      (!allowed || allowed.includes(operator.id)) &&
      operator.types.includes(field.type),
  )
}

export function validateConditionQuery<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<TFields, TOperators>,
): ConditionValidationResult {
  return inspectConditionQuery(query, definition).result
}

export function assertValidConditionQuery<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<TFields, TOperators>,
): ConditionQuery<ConditionForFields<TFields, TOperators>> {
  const inspected = inspectConditionQuery(query, definition)
  if (!inspected.result.valid) {
    throw new InvalidConditionQueryError(inspected.result.issues)
  }
  return inspected.value as ConditionQuery<
    ConditionForFields<TFields, TOperators>
  >
}

interface InspectedQuery {
  result: ConditionValidationResult
  value: ConditionQuery<any>
}

function inspectConditionQuery(
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<any, any>,
): InspectedQuery {
  const issues: ConditionValidationIssue[] = []
  const ids = new Set<string>()

  if (query.version !== CONDITION_QUERY_VERSION) {
    issues.push({
      code: 'unsupported_version',
      message: `Unsupported condition query version "${query.version}".`,
      path: ['version'],
    })
  }

  const visit = (
    expression: ConditionExpression,
    path: readonly (string | number)[],
  ): ConditionExpression => {
    if (ids.has(expression.id)) {
      issues.push({
        code: 'duplicate_id',
        message: `Condition expression id "${expression.id}" is duplicated.`,
        nodeId: expression.id,
        path: [...path, 'id'],
      })
    }
    ids.add(expression.id)

    if (isConditionGroup(expression)) {
      let changed = false
      const items = expression.items.map((item, index) => {
        const inspected = visit(item, [...path, 'items', index])
        if (inspected !== item) changed = true
        return inspected
      })
      return changed ? { ...expression, items } : expression
    }

    return inspectCondition(expression, path, definition, issues)
  }

  const root = visit(query.root, ['root'])
  return {
    result: { valid: issues.length === 0, issues },
    value: root === query.root ? query : { ...query, root: root as any },
  }
}

function inspectCondition(
  condition: Condition,
  path: readonly (string | number)[],
  definition: ConditionsDefinition<any, any>,
  issues: ConditionValidationIssue[],
): Condition {
  const field = definition.fields[condition.field]
  if (!field) {
    issues.push({
      code: 'unknown_field',
      message: `Unknown condition field "${condition.field}".`,
      nodeId: condition.id,
      path: [...path, 'field'],
    })
    return condition
  }

  const operator = getConditionOperator(definition, condition.operator)
  if (!operator) {
    issues.push({
      code: 'unknown_operator',
      message: `Unknown condition operator "${condition.operator}".`,
      nodeId: condition.id,
      path: [...path, 'operator'],
    })
    return condition
  }

  const isExplicitlyAllowed =
    !field.operators || field.operators.includes(condition.operator)
  const supportsType = operator.types.includes(field.type)
  if (!isExplicitlyAllowed || !supportsType) {
    issues.push({
      code: 'operator_not_allowed',
      message: `Operator "${condition.operator}" is not allowed for field "${condition.field}".`,
      nodeId: condition.id,
      path: [...path, 'operator'],
    })
    return condition
  }

  if (operator.valueMode === 'none') {
    if (condition.value !== undefined) {
      issues.push({
        code: 'invalid_value',
        message: `Condition "${condition.id}" does not accept a value.`,
        nodeId: condition.id,
        path: [...path, 'value'],
      })
    }
    return condition
  }

  if (condition.value === undefined) {
    issues.push({
      code: 'missing_value',
      message: `Condition "${condition.id}" requires a value.`,
      nodeId: condition.id,
      path: [...path, 'value'],
    })
    return condition
  }

  if (
    operator.valueMode === 'multiple' &&
    (!Array.isArray(condition.value) || condition.value.length === 0)
  ) {
    issues.push({
      code: 'invalid_value',
      message: `Condition "${condition.id}" requires one or more values.`,
      nodeId: condition.id,
      path: [...path, 'value'],
    })
    return condition
  }

  if (
    operator.valueMode === 'range' &&
    (!Array.isArray(condition.value) || condition.value.length !== 2)
  ) {
    issues.push({
      code: 'invalid_value',
      message: `Condition "${condition.id}" requires a two-value range.`,
      nodeId: condition.id,
      path: [...path, 'value'],
    })
    return condition
  }

  const parsed = operator.valueSchema
    ? parseStandardSchema(
        operator.valueSchema,
        condition.value,
        `operator "${operator.id}"`,
      )
    : parseFieldValue(field.schema, condition.value, operator.valueMode, field)

  if (parsed.issues) {
    for (const issue of parsed.issues) {
      issues.push({
        code: 'invalid_value',
        message: issue.message,
        nodeId: condition.id,
        path: [...path, 'value', ...issue.path],
      })
    }
    return condition
  }

  return parsed.value === condition.value
    ? condition
    : { ...condition, value: parsed.value }
}

interface ParsedSchemaValue {
  value?: unknown
  issues?: { message: string; path: readonly (string | number)[] }[]
}

function parseFieldValue(
  schema: ConditionStandardSchema,
  value: unknown,
  mode: 'single' | 'multiple' | 'range',
  field: ConditionFieldDefinition<any, any, any, any, any>,
): ParsedSchemaValue {
  if (mode === 'single') {
    return parseStandardSchema(schema, value, `field type "${field.type}"`)
  }

  const values = value as unknown[]
  const parsedValues: unknown[] = []
  const issues: { message: string; path: readonly (string | number)[] }[] = []
  let changed = false

  values.forEach((item, index) => {
    const parsed = parseStandardSchema(
      schema,
      item,
      `field type "${field.type}"`,
    )
    if (parsed.issues) {
      parsed.issues.forEach((issue) =>
        issues.push({ ...issue, path: [index, ...issue.path] }),
      )
      return
    }
    parsedValues.push(parsed.value)
    if (parsed.value !== item) changed = true
  })

  if (issues.length) return { issues }
  return { value: changed ? parsedValues : value }
}

export function parseStandardSchema(
  schema: ConditionStandardSchema,
  value: unknown,
  context: string,
): ParsedSchemaValue {
  const result = schema['~standard'].validate(value)
  if (isPromiseLike(result)) throw new AsyncConditionSchemaError(context)
  if (!('value' in result)) {
    return {
      issues: result.issues.map((issue) => ({
        message: issue.message,
        path: normalizeStandardSchemaPath(issue.path),
      })),
    }
  }
  return { value: result.value }
}

function normalizeStandardSchemaPath(
  path: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined,
): readonly (string | number)[] {
  if (!path) return []
  return path.map((segment) => {
    const key =
      typeof segment === 'object' && segment !== null && 'key' in segment
        ? segment.key
        : segment
    return typeof key === 'number' ? key : String(key)
  })
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof value.then === 'function'
  )
}
