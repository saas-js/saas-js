import type { StandardSchemaV1 } from '@standard-schema/spec'

export const CONDITION_QUERY_VERSION = 1 as const

export type ConditionCombinator = 'and' | 'or'

export type ConditionType =
  | 'enum'
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'

export type ConditionOperatorId =
  | 'equals'
  | 'not'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'some'
  | 'every'
  | 'isNull'
  | 'isNotNull'

export type ConditionValueMode = 'none' | 'single' | 'multiple' | 'range'

export type ConditionStandardSchema = StandardSchemaV1<any, any>

export type InferConditionInput<TSchema extends ConditionStandardSchema> =
  StandardSchemaV1.InferInput<TSchema>

export type InferConditionOutput<TSchema extends ConditionStandardSchema> =
  StandardSchemaV1.InferOutput<TSchema>

export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface ConditionOption<TValue = unknown, TMeta = unknown> {
  value: TValue
  label: string
  disabled?: boolean
  meta?: TMeta
}

export interface ConditionValueSourceContext<
  TField extends string = string,
  TValue = unknown,
> {
  field: TField
  query: string
  value?: TValue
  signal: AbortSignal
}

export type ConditionValueSource<
  TValue = unknown,
  TField extends string = string,
  TOptionMeta = unknown,
> =
  | readonly ConditionOption<TValue, TOptionMeta>[]
  | ((
      context: ConditionValueSourceContext<TField, TValue>,
    ) =>
      | readonly ConditionOption<TValue, TOptionMeta>[]
      | Promise<readonly ConditionOption<TValue, TOptionMeta>[]>)

export interface ConditionFieldDefinition<
  TSchema extends ConditionStandardSchema = ConditionStandardSchema,
  TType extends string = ConditionType,
  TOperator extends string = ConditionOperatorId,
  TMeta = unknown,
  TOptionMeta = unknown,
> {
  schema: TSchema
  type: TType
  label?: string
  operators?: readonly TOperator[]
  defaultOperator?: TOperator
  defaultValue?: InferConditionOutput<TSchema>
  options?: ConditionValueSource<
    InferConditionOutput<TSchema>,
    string,
    TOptionMeta
  >
  accessor?(subject: unknown): unknown
  serialize?(value: InferConditionOutput<TSchema>): JsonValue
  deserialize?(value: JsonValue): InferConditionInput<TSchema>
  meta?: TMeta
}

export interface ConditionComparatorContext {
  field: string
  type: string
  operator: string
}

type InferSchemaOutputOrUnknown<
  TSchema extends ConditionStandardSchema | undefined,
> = TSchema extends ConditionStandardSchema
  ? InferConditionOutput<TSchema>
  : unknown

type InferSchemaInputOrUnknown<
  TSchema extends ConditionStandardSchema | undefined,
> = TSchema extends ConditionStandardSchema
  ? InferConditionInput<TSchema>
  : unknown

export interface ConditionOperator<
  TOperator extends string = ConditionOperatorId,
  TType extends string = ConditionType,
  TValueMode extends ConditionValueMode = ConditionValueMode,
  TSubjectSchema extends ConditionStandardSchema | undefined = undefined,
  TValueSchema extends ConditionStandardSchema | undefined = undefined,
> {
  id: TOperator
  label: string
  types: readonly TType[]
  valueMode: TValueMode
  subjectSchema?: TSubjectSchema
  valueSchema?: TValueSchema
  serialize?(value: InferSchemaOutputOrUnknown<TValueSchema>): JsonValue
  deserialize?(value: JsonValue): InferSchemaInputOrUnknown<TValueSchema>
  comparator(
    actualValue: InferSchemaOutputOrUnknown<TSubjectSchema>,
    conditionValue: InferSchemaOutputOrUnknown<TValueSchema>,
    context: ConditionComparatorContext,
  ): boolean
}

export type ConditionOperators = readonly ConditionOperator<
  any,
  any,
  any,
  any,
  any
>[]

export type ConditionOperatorIdFromList<
  TOperators extends ConditionOperators,
> = TOperators[number]['id']

export interface Condition<
  TField extends string = string,
  TValue = unknown,
  TOperator extends string = string,
> {
  kind: 'condition'
  id: string
  field: TField
  operator: TOperator
  value?: TValue
}

export interface ConditionGroup<TCondition extends Condition = Condition> {
  kind: 'group'
  id: string
  combinator: ConditionCombinator
  items: ConditionExpression<TCondition>[]
}

export type ConditionExpression<TCondition extends Condition = Condition> =
  | TCondition
  | ConditionGroup<TCondition>

export interface ConditionQuery<TCondition extends Condition = Condition> {
  version: typeof CONDITION_QUERY_VERSION
  root: ConditionGroup<TCondition>
}

export type ConditionFields<TOperator extends string = string> = Record<
  string,
  ConditionFieldDefinition<any, any, TOperator, any, any>
>

export type ConditionFieldId<TFields extends ConditionFields> = Extract<
  keyof TFields,
  string
>

export type ConditionValueForDefinition<TDefinition> =
  TDefinition extends ConditionFieldDefinition<
    infer TSchema,
    any,
    any,
    any,
    any
  >
    ? InferConditionOutput<TSchema>
    : unknown

export type ConditionInputForDefinition<TDefinition> =
  TDefinition extends ConditionFieldDefinition<
    infer TSchema,
    any,
    any,
    any,
    any
  >
    ? InferConditionInput<TSchema>
    : unknown

type ConditionOperatorsForDefinition<
  TDefinition,
  TOperators extends ConditionOperators,
> = TDefinition extends { operators: readonly (infer TOperator)[] }
  ? Extract<TOperators[number], { id: TOperator }>
  : TOperators[number] extends infer TOperator
    ? TOperator extends { types: readonly (infer TType)[] }
      ? TDefinition extends { type: infer TFieldType }
        ? TFieldType extends TType
          ? TOperator
          : never
        : never
      : never
    : never

type ConditionValueByMode<TValue, TValueMode> = TValueMode extends 'none'
  ? never
  : TValueMode extends 'multiple'
    ? readonly TValue[]
    : TValueMode extends 'range'
      ? readonly [TValue, TValue]
      : TValue

export type ConditionValueForOperator<
  TDefinition,
  TOperator,
  TDirection extends 'input' | 'output' = 'output',
> = TOperator extends { valueSchema: infer TValueSchema }
  ? TValueSchema extends ConditionStandardSchema
    ? TDirection extends 'input'
      ? InferConditionInput<TValueSchema>
      : InferConditionOutput<TValueSchema>
    : never
  : TOperator extends { valueMode: infer TValueMode }
    ? ConditionValueByMode<
        TDirection extends 'input'
          ? ConditionInputForDefinition<TDefinition>
          : ConditionValueForDefinition<TDefinition>,
        TValueMode
      >
    : never

type ConditionForField<
  TField extends string,
  TDefinition,
  TOperators extends ConditionOperators,
> = ConditionOperatorsForDefinition<TDefinition, TOperators> extends infer TOperator
  ? TOperator extends { id: infer TOperatorId extends string }
    ? Condition<
        TField,
        ConditionValueForOperator<TDefinition, TOperator>,
        TOperatorId
      >
    : never
  : never

export type ConditionForFields<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> = Condition & {
  [TField in ConditionFieldId<TFields>]: ConditionForField<
    TField,
    TFields[TField],
    TOperators
  >
}[ConditionFieldId<TFields>]

type ConditionInputForField<
  TField extends string,
  TDefinition,
  TOperators extends ConditionOperators,
> = ConditionOperatorsForDefinition<TDefinition, TOperators> extends infer TOperator
  ? TOperator extends { id: infer TOperatorId extends string }
    ? {
        id?: string
        field: TField
        value?: ConditionValueForOperator<
          TDefinition,
          TOperator,
          'input'
        >
      } & (TDefinition extends { defaultOperator: infer TDefaultOperator }
        ? TOperatorId extends TDefaultOperator
          ? { operator?: TOperatorId }
          : { operator: TOperatorId }
        : { operator?: TOperatorId })
    : never
  : never

export type ConditionInput<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> = {
  id?: string
  field: ConditionFieldId<TFields>
  operator?: string
  value?: unknown
} & {
  [TField in ConditionFieldId<TFields>]: ConditionInputForField<
    TField,
    TFields[TField],
    TOperators
  >
}[ConditionFieldId<TFields>]

export interface ConditionPatch {
  field?: string
  operator?: string
  value?: unknown
}

export interface ConditionGroupInput<TCondition extends Condition = Condition> {
  id?: string
  combinator?: ConditionCombinator
  items?: ConditionExpression<TCondition>[]
}

export interface ConditionValidationIssue {
  code:
    | 'duplicate_id'
    | 'invalid_value'
    | 'missing_value'
    | 'unknown_field'
    | 'unknown_operator'
    | 'operator_not_allowed'
    | 'unsupported_version'
  message: string
  nodeId?: string
  path: readonly (string | number)[]
}

export interface ConditionValidationResult {
  valid: boolean
  issues: ConditionValidationIssue[]
}

export interface SerializedCondition {
  kind: 'condition'
  id: string
  field: string
  operator: string
  value?: JsonValue
}

export interface SerializedConditionGroup {
  kind: 'group'
  id: string
  combinator: ConditionCombinator
  items: SerializedConditionExpression[]
}

export type SerializedConditionExpression =
  | SerializedCondition
  | SerializedConditionGroup

export interface SerializedConditionQuery {
  version: typeof CONDITION_QUERY_VERSION
  root: SerializedConditionGroup
}
