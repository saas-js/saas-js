import type { Condition, ExpressionBuilder } from '@rocicorp/zero'

import {
  type Condition as ConditionNode,
  type ConditionFieldDefinition,
  type ConditionFieldId,
  type ConditionOperator,
  type ConditionQuery,
  type ConditionsDefinition,
  foldConditionQuery,
  getConditionField,
  getConditionOperator,
} from '@saas-js/conditions'

/**
 * The subset of ZQL's expression builder the converter uses. Structurally
 * compatible with `ExpressionBuilder` from `@rocicorp/zero`.
 */
export interface ZeroExpressionOps {
  cmp(field: string, op: string, value: unknown): Condition
  and(...conditions: (Condition | undefined)[]): Condition
  or(...conditions: (Condition | undefined)[]): Condition
  not(condition: Condition): Condition
}

export interface ZeroOperatorContext {
  /** The ZQL expression builder passed to the where factory. */
  eb: ZeroExpressionOps
  /** The mapped Zero column name. */
  column: string
  /** Map a raw condition value to a Zero literal (dates → epoch millis). */
  mapValue: (value: unknown) => unknown
  condition: ConditionNode
  field: ConditionFieldDefinition | undefined
  operator: ConditionOperator | undefined
}

/**
 * Translates one condition into a ZQL condition. Return `undefined` to make
 * the condition unconstrained (it matches every row).
 */
export type ZeroOperatorConverter = (
  value: unknown,
  context: ZeroOperatorContext,
) => Condition | undefined

export interface ZeroFieldMapping {
  /** Zero column name; defaults to the condition field id. */
  name?: string
  /** Map condition values to Zero literals for this field. */
  value?: (value: unknown) => unknown
}

type DefinitionFieldIds<TDefinition extends ConditionsDefinition<any, any>> =
  TDefinition extends ConditionsDefinition<infer TFields, any>
    ? ConditionFieldId<TFields>
    : string

export interface ConditionsToZeroOptions<
  TDefinition extends ConditionsDefinition<any, any>,
> {
  /**
   * Map condition field ids to Zero columns: a column name, or a mapping
   * with a name and/or a value transform. Unmapped fields use the field id
   * as the column name and the default value mapping.
   */
  fields?: Partial<
    Record<DefinitionFieldIds<TDefinition>, string | ZeroFieldMapping>
  >
  /**
   * Override built-in operator translations or add translations for custom
   * operators. Keyed by operator id.
   */
  operators?: Record<string, ZeroOperatorConverter>
}

export class UnsupportedConditionOperatorError extends Error {
  constructor(operator: string) {
    super(
      `Operator "${operator}" has no Zero translation. ` +
        'Provide one via the `operators` option.',
    )
    this.name = 'UnsupportedConditionOperatorError'
  }
}

/** Escape `%`, `_`, and `\` so a value matches literally inside a LIKE pattern. */
export const escapeZeroLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (character) => `\\${character}`)

/** Zero stores timestamps as numbers; other primitives pass through. */
const defaultValueMapper = (value: unknown) =>
  value instanceof Date ? value.getTime() : value

const mapList = (value: unknown, mapValue: (value: unknown) => unknown) =>
  (Array.isArray(value) ? value : [value]).map(mapValue)

/**
 * Built-in translations for the default operator set, mirroring the
 * in-memory operators' semantics (case-insensitive string matching via
 * ILIKE). `some`/`every` compare against array subjects and have no ZQL
 * form; map them yourself if your rows model them (e.g. via `exists` on a
 * relationship).
 */
export const defaultZeroOperators: Record<string, ZeroOperatorConverter> = {
  equals: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '=', mapValue(value)),
  not: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '!=', mapValue(value)),
  gt: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '>', mapValue(value)),
  gte: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '>=', mapValue(value)),
  lt: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '<', mapValue(value)),
  lte: (value, { eb, column, mapValue }) =>
    eb.cmp(column, '<=', mapValue(value)),
  between: (value, { eb, column, mapValue }) => {
    const [min, max] = value as [unknown, unknown]
    return eb.and(
      eb.cmp(column, '>=', mapValue(min)),
      eb.cmp(column, '<=', mapValue(max)),
    )
  },
  contains: (value, { eb, column }) =>
    eb.cmp(column, 'ILIKE', `%${escapeZeroLikePattern(String(value))}%`),
  startsWith: (value, { eb, column }) =>
    eb.cmp(column, 'ILIKE', `${escapeZeroLikePattern(String(value))}%`),
  endsWith: (value, { eb, column }) =>
    eb.cmp(column, 'ILIKE', `%${escapeZeroLikePattern(String(value))}`),
  in: (value, { eb, column, mapValue }) =>
    eb.cmp(column, 'IN', mapList(value, mapValue)),
  notIn: (value, { eb, column, mapValue }) => {
    const values = mapList(value, mapValue)
    // An empty exclusion list constrains nothing.
    return values.length ? eb.cmp(column, 'NOT IN', values) : undefined
  },
  isNull: (_value, { eb, column }) => eb.cmp(column, 'IS', null),
  isNotNull: (_value, { eb, column }) => eb.cmp(column, 'IS NOT', null),
}

/**
 * Convert a conditions query into a ZQL where-expression factory:
 *
 * ```ts
 * const query = definition.parse(savedSegment.query)
 * zql.contact.where(conditionsToZero(definition, query))
 * ```
 *
 * An empty query converts to `and()` (ZQL's TRUE), keeping every row.
 * Validate untrusted input first — `definition.parse(payload)` — so values
 * reaching the query are schema outputs.
 */
export function conditionsToZero<
  TDefinition extends ConditionsDefinition<any, any>,
>(
  definition: TDefinition,
  query: ConditionQuery<any>,
  options: ConditionsToZeroOptions<TDefinition> = {},
): (eb: ExpressionBuilder<any, any>) => Condition {
  const fieldMappings = (options.fields ?? {}) as Record<
    string,
    string | ZeroFieldMapping | undefined
  >

  return (builder) => {
    const eb = builder as unknown as ZeroExpressionOps
    const condition = foldConditionQuery<ConditionNode, Condition>(query, {
      condition(node) {
        const mapping = fieldMappings[node.field]
        const column =
          (typeof mapping === 'string' ? mapping : mapping?.name) ?? node.field
        const mapValue =
          (typeof mapping === 'object' ? mapping.value : undefined) ??
          defaultValueMapper
        const converter =
          options.operators?.[node.operator] ??
          defaultZeroOperators[node.operator]
        if (!converter) {
          throw new UnsupportedConditionOperatorError(node.operator)
        }
        return converter(node.value, {
          eb,
          column,
          mapValue,
          condition: node,
          field: getConditionField(definition, node.field),
          operator: getConditionOperator(definition, node.operator),
        })
      },
      group(combinator, results) {
        if (results.length === 0) return undefined
        if (results.length === 1) return results[0]
        return combinator === 'and' ? eb.and(...results) : eb.or(...results)
      },
    })
    return condition ?? eb.and()
  }
}
