import {
  type AnyColumn,
  Column,
  type SQL,
  and,
  between,
  eq,
  gt,
  gte,
  inArray,
  is,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'

import {
  type Condition,
  type ConditionFieldDefinition,
  type ConditionFieldId,
  type ConditionOperator,
  type ConditionQuery,
  type ConditionQueryForDefinition,
  type ConditionsDefinition,
  type SerializedConditionQuery,
  foldConditionQuery,
  getConditionField,
  getConditionOperator,
} from '@saas-js/conditions'

export type DrizzleConditionTarget = AnyColumn | SQL

export interface DrizzleOperatorContext {
  condition: Condition
  field: ConditionFieldDefinition | undefined
  operator: ConditionOperator | undefined
}

/**
 * Translates one condition into a SQL expression. Return `undefined` to make
 * the condition unconstrained (it matches every row).
 */
export type DrizzleOperatorConverter = (
  target: DrizzleConditionTarget,
  value: unknown,
  context: DrizzleOperatorContext,
) => SQL | undefined

type DefinitionFieldIds<TDefinition extends ConditionsDefinition<any, any>> =
  TDefinition extends ConditionsDefinition<infer TFields, any>
    ? ConditionFieldId<TFields>
    : string

export interface ConditionsToDrizzleOptions<
  TDefinition extends ConditionsDefinition<any, any>,
> {
  /**
   * Map field ids to Drizzle columns (or SQL expressions, e.g. a JSON path).
   * A condition on an unmapped field throws.
   */
  columns: Partial<Record<DefinitionFieldIds<TDefinition>, DrizzleConditionTarget>>
  /**
   * Override built-in operator translations or add translations for custom
   * operators. Keyed by operator id.
   */
  operators?: Record<string, DrizzleOperatorConverter>
}

export class UnsupportedConditionOperatorError extends Error {
  constructor(operator: string) {
    super(
      `Operator "${operator}" has no Drizzle translation. ` +
        'Provide one via the `operators` option.',
    )
    this.name = 'UnsupportedConditionOperatorError'
  }
}

export class UnmappedConditionFieldError extends Error {
  constructor(field: string) {
    super(`No Drizzle column is mapped for field "${field}".`)
    this.name = 'UnmappedConditionFieldError'
  }
}

const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (character) => `\\${character}`)

/**
 * Case-insensitive LIKE, mirroring the default string operators' JavaScript
 * semantics across SQLite, Postgres, and MySQL.
 */
const likeInsensitive = (target: DrizzleConditionTarget, pattern: string) =>
  sql`lower(${target}) like ${pattern.toLowerCase()} escape '\\'`

const NO_MATCH = sql`1 = 0`

/**
 * Built-in translations for the default operator set. `some`/`every` compare
 * against array subjects and have no generic SQL form; map them yourself for
 * your storage model (e.g. a join or array operator).
 */
export const defaultDrizzleOperators: Record<string, DrizzleOperatorConverter> =
  {
    equals: (target, value) => eq(target as AnyColumn, value),
    not: (target, value) => ne(target as AnyColumn, value),
    gt: (target, value) => gt(target as AnyColumn, value),
    gte: (target, value) => gte(target as AnyColumn, value),
    lt: (target, value) => lt(target as AnyColumn, value),
    lte: (target, value) => lte(target as AnyColumn, value),
    between: (target, value) => {
      const [min, max] = value as [unknown, unknown]
      return between(target as AnyColumn, min, max)
    },
    contains: (target, value) =>
      likeInsensitive(target, `%${escapeLikePattern(String(value))}%`),
    startsWith: (target, value) =>
      likeInsensitive(target, `${escapeLikePattern(String(value))}%`),
    endsWith: (target, value) =>
      likeInsensitive(target, `%${escapeLikePattern(String(value))}`),
    in: (target, value) => {
      const values = value as unknown[]
      return values.length ? inArray(target as AnyColumn, values) : NO_MATCH
    },
    notIn: (target, value) => {
      const values = value as unknown[]
      // An empty exclusion list constrains nothing.
      return values.length ? notInArray(target as AnyColumn, values) : undefined
    },
    isNull: (target) => isNull(target as AnyColumn),
    isNotNull: (target) => isNotNull(target as AnyColumn),
  }

/**
 * Convert a conditions query into a Drizzle `where` expression.
 *
 * Returns `undefined` for an empty query (no `where` clause). Validate
 * untrusted input first — `definition.parse(payload)` or
 * `definition.assert(query)` — so values reaching SQL are schema outputs.
 */
export interface ConditionsCrudFilterOptions<
  TDefinition extends ConditionsDefinition<any, any>,
> {
  /**
   * Override or extend the automatic field → column mapping (e.g. a SQL
   * expression for a field that is not a plain table column).
   */
  columns?: ConditionsToDrizzleOptions<TDefinition>['columns']
  operators?: Record<string, DrizzleOperatorConverter>
}

/**
 * What the crud's `filters` parameter accepts with `conditionsCrudFilter`
 * configured: the JSON string or serialized payload produced by
 * `definition.stringify`/`serialize`, or an already-parsed query.
 */
export type ConditionsCrudFilterInput<
  TDefinition extends ConditionsDefinition<any, any> = ConditionsDefinition<
    any,
    any
  >,
> =
  | string
  | SerializedConditionQuery
  | ConditionQueryForDefinition<TDefinition>

/**
 * A drizzle-crud `filterFn`: makes `list({ filters })` accept a (serialized)
 * condition query, parsed and validated by the definition and converted to
 * a where clause with fields mapped to the crud table's columns.
 *
 * The crud's `allowedFilters` allowlist gates which fields get mapped (all
 * definition fields when the allowlist is empty), so a condition on a
 * disallowed field throws `UnmappedConditionFieldError` instead of widening
 * the result set.
 *
 * ```ts
 * const contacts = createCrud(contactsTable, {
 *   allowedFilters: ['status', 'arr'],
 *   filterFn: conditionsCrudFilter(contactConditions),
 * })
 *
 * await contacts.list({ filters: savedSegment.query })
 * ```
 */
export function conditionsCrudFilter<
  TDefinition extends ConditionsDefinition<any, any>,
>(
  definition: TDefinition,
  options: ConditionsCrudFilterOptions<TDefinition> = {},
): (
  input: ConditionsCrudFilterInput<TDefinition>,
  context: { table: object; allowedFilters: readonly PropertyKey[] },
) => SQL | undefined {
  return (input, context) => {
    const query = definition.parse(input)
    const allowed =
      context.allowedFilters.length > 0
        ? context.allowedFilters.map(String)
        : Object.keys(definition.fields as Record<string, unknown>)
    const overrides = (options.columns ?? {}) as Record<
      string,
      DrizzleConditionTarget | undefined
    >
    const table = context.table as Record<string, unknown>
    const columns: Record<string, DrizzleConditionTarget> = {}
    for (const field of allowed) {
      const target =
        overrides[field] ??
        (is(table[field], Column) ? (table[field] as AnyColumn) : undefined)
      if (target) columns[field] = target
    }
    return conditionsToDrizzle(definition, query, {
      columns: columns as ConditionsToDrizzleOptions<TDefinition>['columns'],
      operators: options.operators,
    })
  }
}

export function conditionsToDrizzle<
  TDefinition extends ConditionsDefinition<any, any>,
>(
  definition: TDefinition,
  query: ConditionQuery<any>,
  options: ConditionsToDrizzleOptions<TDefinition>,
): SQL | undefined {
  const columns = options.columns as Record<
    string,
    DrizzleConditionTarget | undefined
  >
  return foldConditionQuery<Condition, SQL>(query, {
    condition(condition) {
      const target = columns[condition.field]
      if (!target) throw new UnmappedConditionFieldError(condition.field)
      const converter =
        options.operators?.[condition.operator] ??
        defaultDrizzleOperators[condition.operator]
      if (!converter) {
        throw new UnsupportedConditionOperatorError(condition.operator)
      }
      return converter(target, condition.value, {
        condition,
        field: getConditionField(definition, condition.field),
        operator: getConditionOperator(definition, condition.operator),
      })
    },
    group(combinator, results) {
      if (results.length === 0) return undefined
      if (results.length === 1) return results[0]
      return combinator === 'and' ? and(...results) : or(...results)
    },
  })
}
