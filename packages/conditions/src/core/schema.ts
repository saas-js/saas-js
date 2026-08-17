import type {
  ConditionFields,
  ConditionForFields,
  ConditionOperatorIdFromList,
  ConditionOperators,
  ConditionQuery,
  ConditionStandardSchema,
  ConditionValidationResult,
  ConditionValueForDefinition,
  InferConditionInput,
  SerializedConditionQuery,
} from '../types/condition.types.ts'
import { evaluateConditionQuery, filterByConditionQuery } from './evaluate.ts'
import { defaultOperators } from './operators.ts'
import {
  deserializeConditionQuery,
  serializeConditionQuery,
  stringifyConditionQuery,
} from './serialization.ts'
import {
  type ConditionsStore,
  type CreateConditionsStoreOptions,
  createConditionsStore,
} from './store.ts'
import {
  assertValidConditionQuery,
  validateConditionQuery,
} from './validation.ts'

export interface ConditionsDefinition<
  TFields extends ConditionFields = ConditionFields,
  TOperators extends ConditionOperators = ConditionOperators,
> {
  readonly fields: TFields
  readonly operators: TOperators
  createStore(
    options?: CreateConditionsStoreOptions<TFields, TOperators>,
  ): ConditionsStore<TFields, TOperators>
  validate(query: ConditionQuery<any>): ConditionValidationResult
  assert(query: ConditionQuery<any>): ConditionQuery<
    ConditionForFields<TFields, TOperators>
  >
  evaluate(query: ConditionQuery<any>, subject: unknown): boolean
  filter<TSubject>(
    query: ConditionQuery<any>,
    subjects: readonly TSubject[],
  ): TSubject[]
  serialize(query: ConditionQuery<any>): SerializedConditionQuery
  stringify(query: ConditionQuery<any>): string
  parse(input: string | unknown): ConditionQuery<
    ConditionForFields<TFields, TOperators>
  >
}

export type ConditionForDefinition<
  TDefinition extends ConditionsDefinition<any, any>,
> = TDefinition extends ConditionsDefinition<infer TFields, infer TOperators>
  ? ConditionForFields<TFields, TOperators>
  : never

export type ConditionQueryForDefinition<
  TDefinition extends ConditionsDefinition<any, any>,
> = ConditionQuery<ConditionForDefinition<TDefinition>>

type CompatibleOperatorIds<
  TField,
  TOperators extends ConditionOperators,
> = TOperators[number] extends infer TOperator
  ? TOperator extends {
      id: infer TOperatorId extends string
      types: readonly (infer TType)[]
    }
    ? TField extends { type: infer TFieldType }
      ? TFieldType extends TType
        ? TOperator extends {
            subjectSchema: infer TSubjectSchema extends ConditionStandardSchema
          }
          ? ConditionValueForDefinition<TField> extends InferConditionInput<TSubjectSchema>
            ? TOperatorId
            : never
          : TOperatorId
        : never
      : never
    : never
  : never

type CheckedConditionFields<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> = {
  [TField in keyof TFields]: TFields[TField] & {
    operators?: readonly CompatibleOperatorIds<
      TFields[TField],
      TOperators
    >[]
    defaultOperator?: CompatibleOperatorIds<TFields[TField], TOperators>
  }
}

export function defineConditions<
  const TOperators extends ConditionOperators,
  const TFields extends ConditionFields<
    ConditionOperatorIdFromList<TOperators>
  >,
>(options: {
  fields: TFields & CheckedConditionFields<TFields, TOperators>
  operators: TOperators
}): ConditionsDefinition<TFields, TOperators>
export function defineConditions<
  const TFields extends ConditionFields<
    ConditionOperatorIdFromList<typeof defaultOperators>
  >,
>(options: {
  fields: TFields &
    CheckedConditionFields<TFields, typeof defaultOperators>
  operators?: undefined
}): ConditionsDefinition<TFields, typeof defaultOperators>
export function defineConditions(options: {
  fields: ConditionFields
  operators?: ConditionOperators
}): ConditionsDefinition<any, any> {
  const definition = {
    fields: options.fields,
    operators: options.operators ?? defaultOperators,
  } as ConditionsDefinition<any, any>

  definition.createStore = (storeOptions = {}) =>
    createConditionsStore(definition, storeOptions)
  definition.validate = (query) => validateConditionQuery(query, definition)
  definition.assert = (query) => assertValidConditionQuery(query, definition)
  definition.evaluate = (query, subject) =>
    evaluateConditionQuery(query, subject, definition)
  definition.filter = (query, subjects) =>
    filterByConditionQuery(subjects, query, definition)
  definition.serialize = (query) =>
    serializeConditionQuery(query, definition)
  definition.stringify = (query) =>
    stringifyConditionQuery(query, definition)
  definition.parse = (input) =>
    deserializeConditionQuery(input, definition)

  return definition
}
