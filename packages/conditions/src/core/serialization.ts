import {
  CONDITION_QUERY_VERSION,
  type Condition,
  type ConditionExpression,
  type ConditionFields,
  type ConditionForFields,
  type ConditionGroup,
  type ConditionOperators,
  type ConditionQuery,
  type JsonValue,
  type SerializedCondition,
  type SerializedConditionExpression,
  type SerializedConditionGroup,
  type SerializedConditionQuery,
} from '../types/condition.types.ts'
import { isConditionGroup } from './expression.ts'
import type { ConditionsDefinition } from './schema.ts'
import {
  assertValidConditionQuery,
  getConditionOperator,
} from './validation.ts'

export class ConditionSerializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConditionSerializationError'
  }
}

export interface ConditionSerializationOptions {
  validate?: boolean
}

export function serializeConditionQuery<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<TFields, TOperators>,
  options: ConditionSerializationOptions = {},
): SerializedConditionQuery {
  const value =
    options.validate === false
      ? query
      : assertValidConditionQuery(query, definition)
  return {
    version: CONDITION_QUERY_VERSION,
    root: serializeGroup(value.root, definition),
  }
}

export function stringifyConditionQuery<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  query: ConditionQuery<any>,
  definition: ConditionsDefinition<TFields, TOperators>,
  options?: ConditionSerializationOptions,
) {
  return JSON.stringify(
    serializeConditionQuery(query, definition, options),
  )
}

export function deserializeConditionQuery<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  input: string | unknown,
  definition: ConditionsDefinition<TFields, TOperators>,
  options: ConditionSerializationOptions = {},
): ConditionQuery<ConditionForFields<TFields, TOperators>> {
  const value = typeof input === 'string' ? parseJson(input) : input
  const serialized = parseSerializedQuery(value)
  const query: ConditionQuery<any> = {
    version: CONDITION_QUERY_VERSION,
    root: deserializeGroup(serialized.root, definition),
  }
  return options.validate === false
    ? (query as ConditionQuery<ConditionForFields<TFields, TOperators>>)
    : assertValidConditionQuery(query, definition)
}

export const parseConditionQuery = deserializeConditionQuery

function serializeGroup(
  group: ConditionGroup,
  definition: ConditionsDefinition<any, any>,
): SerializedConditionGroup {
  return {
    kind: 'group',
    id: group.id,
    combinator: group.combinator,
    items: group.items.map((item) => serializeExpression(item, definition)),
  }
}

function serializeExpression(
  expression: ConditionExpression,
  definition: ConditionsDefinition<any, any>,
): SerializedConditionExpression {
  if (isConditionGroup(expression)) {
    return serializeGroup(expression, definition)
  }

  const field = definition.fields[expression.field]
  const operator = getConditionOperator(definition, expression.operator)
  const serialized: SerializedCondition = {
    kind: 'condition',
    id: expression.id,
    field: expression.field,
    operator: expression.operator,
  }
  if (expression.value !== undefined) {
    serialized.value = serializeConditionValue(
      expression.value,
      field,
      operator,
    )
  }
  return serialized
}

function deserializeGroup(
  group: SerializedConditionGroup,
  definition: ConditionsDefinition<any, any>,
): ConditionGroup {
  return {
    kind: 'group',
    id: group.id,
    combinator: group.combinator,
    items: group.items.map((item) =>
      deserializeExpression(item, definition),
    ),
  }
}

function deserializeExpression(
  expression: SerializedConditionExpression,
  definition: ConditionsDefinition<any, any>,
): ConditionExpression {
  if (expression.kind === 'group') {
    return deserializeGroup(expression, definition)
  }

  const field = definition.fields[expression.field]
  const operator = getConditionOperator(definition, expression.operator)
  const condition: Condition = {
    kind: 'condition',
    id: expression.id,
    field: expression.field,
    operator: expression.operator as any,
  }
  if (expression.value !== undefined) {
    condition.value = deserializeConditionValue(
      expression.value,
      field,
      operator,
    )
  }
  return condition
}

function serializeConditionValue(
  value: unknown,
  field: ConditionsDefinition<any, any>['fields'][string] | undefined,
  operator: ConditionsDefinition<any, any>['operators'][number] | undefined,
): JsonValue {
  if (operator?.serialize) return toJsonValue(operator.serialize(value))

  if (!operator?.valueSchema && field?.serialize) {
    return toJsonValue(
      mapConditionValue(
        value,
        operator?.valueMode ?? 'single',
        field.serialize,
        'serialize',
      ),
    )
  }

  return toJsonValue(value)
}

function deserializeConditionValue(
  value: JsonValue,
  field: ConditionsDefinition<any, any>['fields'][string] | undefined,
  operator: ConditionsDefinition<any, any>['operators'][number] | undefined,
): unknown {
  if (operator?.deserialize) return operator.deserialize(value)

  if (!operator?.valueSchema && field?.deserialize) {
    return mapConditionValue(
      value,
      operator?.valueMode ?? 'single',
      field.deserialize,
      'deserialize',
    )
  }

  return deserializeDefaultValue(value, field?.type)
}

function mapConditionValue(
  value: unknown,
  mode: string,
  transform: (value: any) => unknown,
  operation: 'serialize' | 'deserialize',
): any {
  if (mode !== 'multiple' && mode !== 'range') return transform(value)
  if (!Array.isArray(value)) {
    throw new ConditionSerializationError(
      `Cannot ${operation} a ${mode} condition value that is not an array.`,
    )
  }
  return value.map((item) => transform(item))
}

function deserializeDefaultValue(value: JsonValue, type?: string): unknown {
  if (type !== 'date' && type !== 'datetime') return value
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'string' ? new Date(item) : item,
    )
  }
  return typeof value === 'string' ? new Date(value) : value
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value as JsonValue
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ConditionSerializationError(
        'Condition values must be finite numbers.',
      )
    }
    return value
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ConditionSerializationError(
        'Condition values cannot contain invalid dates.',
      )
    }
    return value.toISOString()
  }
  if (Array.isArray(value)) return value.map(toJsonValue)
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new ConditionSerializationError(
        'Custom condition values require field or operator serialization hooks.',
      )
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]),
    )
  }
  throw new ConditionSerializationError(
    `Condition value of type "${typeof value}" is not serializable.`,
  )
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    throw new ConditionSerializationError(
      'Condition query contains invalid JSON.',
    )
  }
}

function parseSerializedQuery(input: unknown): SerializedConditionQuery {
  if (!isRecord(input)) {
    throw new ConditionSerializationError('Condition query must be an object.')
  }
  if (input.version !== CONDITION_QUERY_VERSION) {
    throw new ConditionSerializationError(
      `Unsupported condition query version "${String(input.version)}".`,
    )
  }
  return {
    version: CONDITION_QUERY_VERSION,
    root: parseSerializedGroup(input.root, ['root']),
  }
}

function parseSerializedGroup(
  input: unknown,
  path: readonly (string | number)[],
): SerializedConditionGroup {
  if (
    !isRecord(input) ||
    input.kind !== 'group' ||
    typeof input.id !== 'string' ||
    (input.combinator !== 'and' && input.combinator !== 'or') ||
    !Array.isArray(input.items)
  ) {
    throw new ConditionSerializationError(
      `Invalid condition group at "${path.join('.')}".`,
    )
  }
  return {
    kind: 'group',
    id: input.id,
    combinator: input.combinator,
    items: input.items.map((item, index) =>
      parseSerializedExpression(item, [...path, 'items', index]),
    ),
  }
}

function parseSerializedExpression(
  input: unknown,
  path: readonly (string | number)[],
): SerializedConditionExpression {
  if (isRecord(input) && input.kind === 'group') {
    return parseSerializedGroup(input, path)
  }
  if (
    !isRecord(input) ||
    input.kind !== 'condition' ||
    typeof input.id !== 'string' ||
    typeof input.field !== 'string' ||
    typeof input.operator !== 'string'
  ) {
    throw new ConditionSerializationError(
      `Invalid condition at "${path.join('.')}".`,
    )
  }
  const condition: SerializedCondition = {
    kind: 'condition',
    id: input.id,
    field: input.field,
    operator: input.operator,
  }
  if (input.value !== undefined) {
    condition.value = assertJsonValue(input.value, [...path, 'value'])
  }
  return condition
}

function assertJsonValue(
  value: unknown,
  path: readonly (string | number)[],
): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value as JsonValue
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => assertJsonValue(item, [...path, index]))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        assertJsonValue(item, [...path, key]),
      ]),
    )
  }
  throw new ConditionSerializationError(
    `Invalid JSON value at "${path.join('.')}".`,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
