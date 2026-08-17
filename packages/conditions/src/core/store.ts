import { createStore } from '@tanstack/store'

import type {
  Condition,
  ConditionCombinator,
  ConditionFields,
  ConditionForFields,
  ConditionGroupInput,
  ConditionInput,
  ConditionOperators,
  ConditionPatch,
  ConditionQuery,
  ConditionValidationResult,
  SerializedConditionQuery,
} from '../types/condition.types.ts'
import { evaluateConditionQuery } from './evaluate.ts'
import {
  ConditionTreeError,
  createConditionQuery,
  findConditionExpression,
  groupConditionExpressions,
  insertConditionExpression,
  isConditionGroup,
  moveConditionExpression,
  removeConditionExpression,
  ungroupConditionExpression,
  updateConditionExpression,
} from './expression.ts'
import type { ConditionsDefinition } from './schema.ts'
import {
  serializeConditionQuery,
  stringifyConditionQuery,
} from './serialization.ts'
import {
  assertValidConditionQuery,
  getConditionFieldOperators,
  validateConditionQuery,
} from './validation.ts'

export type ConditionChangeReason =
  | 'add-condition'
  | 'add-group'
  | 'clear'
  | 'group'
  | 'move'
  | 'remove'
  | 'reset'
  | 'set-value'
  | 'ungroup'
  | 'update-condition'
  | 'update-group'

export interface ConditionsState<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> {
  value: ConditionQuery<ConditionForFields<TFields, TOperators>>
}

export interface ConditionValueChangeDetails<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> {
  value: ConditionQuery<ConditionForFields<TFields, TOperators>>
  previousValue: ConditionQuery<ConditionForFields<TFields, TOperators>>
  reason: ConditionChangeReason
}

export interface CreateConditionsStoreOptions<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> {
  initialValue?: ConditionQuery<ConditionForFields<TFields, TOperators>>
  getId?(kind: 'condition' | 'group'): string
  onValueChange?(details: ConditionValueChangeDetails<TFields, TOperators>): void
  validate?: boolean
}

export interface ConditionInsertOptions {
  parentId?: string
  index?: number
}

export interface ConditionGroupOptions {
  id?: string
}

export interface ConditionsActions<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> {
  addCondition(
    input: ConditionInput<TFields, TOperators>,
    options?: ConditionInsertOptions,
  ): string
  addGroup(
    input?: ConditionGroupInput<ConditionForFields<TFields, TOperators>>,
    options?: ConditionInsertOptions,
  ): string
  updateCondition(id: string, patch: ConditionPatch): void
  updateGroup(id: string, patch: { combinator: ConditionCombinator }): void
  remove(id: string): void
  move(
    id: string,
    options: Required<Pick<ConditionInsertOptions, 'parentId'>> &
      ConditionInsertOptions,
  ): void
  group(
    ids: readonly string[],
    combinator: ConditionCombinator,
    options?: ConditionGroupOptions,
  ): string
  ungroup(id: string): void
  clear(groupId?: string): void
  setValue(value: ConditionQuery<ConditionForFields<TFields, TOperators>>): void
  reset(): void
  update(
    updater: (
      value: ConditionQuery<ConditionForFields<TFields, TOperators>>,
    ) => ConditionQuery<ConditionForFields<TFields, TOperators>>,
  ): void
}

export interface ConditionSubscription {
  unsubscribe(): void
}

export interface ConditionsStore<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
> {
  readonly definition: ConditionsDefinition<TFields, TOperators>
  readonly actions: ConditionsActions<TFields, TOperators>
  get(): ConditionsState<TFields, TOperators>
  getState(): ConditionsState<TFields, TOperators>
  subscribe(
    listener: (state: ConditionsState<TFields, TOperators>) => void,
  ): ConditionSubscription
  validate(): ConditionValidationResult
  evaluate(subject: unknown): boolean
  serialize(): SerializedConditionQuery
  stringify(): string
}

export function createConditionsStore<
  TFields extends ConditionFields,
  TOperators extends ConditionOperators,
>(
  definition: ConditionsDefinition<TFields, TOperators>,
  options: CreateConditionsStoreOptions<TFields, TOperators> = {},
): ConditionsStore<TFields, TOperators> {
  type TCondition = ConditionForFields<TFields, TOperators>
  type TQuery = ConditionQuery<TCondition>

  const initialValue =
    options.initialValue ?? (createConditionQuery() as TQuery)
  const shouldValidate = options.validate !== false
  const normalizedInitialValue = shouldValidate
    ? (assertValidConditionQuery(initialValue, definition) as TQuery)
    : initialValue

  const idFactory = options.getId ?? createDefaultIdFactory()

  const internal = createStore(
    { value: normalizedInitialValue } as ConditionsState<TFields, TOperators>,
    ({ get, setState }) => {
      const commit = (value: TQuery, reason: ConditionChangeReason) => {
        const previousValue = get().value
        if (value === previousValue) return
        const normalizedValue = shouldValidate
          ? (assertValidConditionQuery(value, definition) as TQuery)
          : value
        setState(() => ({ value: normalizedValue }))
        options.onValueChange?.({
          value: normalizedValue,
          previousValue,
          reason,
        })
      }

      const nextId = (kind: 'condition' | 'group') => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          const id = idFactory(kind)
          if (!findConditionExpression(get().value.root, id)) return id
        }
        throw new ConditionTreeError(
          'Unable to generate a unique condition id.',
        )
      }

      const actions: ConditionsActions<TFields, TOperators> = {
        addCondition(input, insertOptions = {}) {
          const conditionInput = input as {
            id?: string
            field: string
            operator?: string
            value?: unknown
          }
          const field = definition.fields[conditionInput.field]
          if (!field) {
            throw new ConditionTreeError(
              `Unknown condition field "${conditionInput.field}".`,
            )
          }
          const availableOperators = getConditionFieldOperators(
            definition,
            field,
          )
          const operator =
            conditionInput.operator ??
            field.defaultOperator ??
            availableOperators[0]?.id
          if (!operator) {
            throw new ConditionTreeError(
              `Condition field "${conditionInput.field}" has no available operators.`,
            )
          }

          const condition = {
            kind: 'condition',
            id: conditionInput.id ?? nextId('condition'),
            field: conditionInput.field,
            operator,
            value: Object.prototype.hasOwnProperty.call(conditionInput, 'value')
              ? conditionInput.value
              : field.defaultValue,
          } as TCondition
          const value = get().value
          const root = insertConditionExpression(
            value.root,
            insertOptions.parentId ?? value.root.id,
            condition,
            insertOptions.index,
          )
          commit({ ...value, root }, 'add-condition')
          return (condition as Condition).id
        },

        addGroup(input = {}, insertOptions = {}) {
          const value = get().value
          const group = {
            kind: 'group',
            id: input.id ?? nextId('group'),
            combinator: input.combinator ?? 'and',
            items: input.items ?? [],
          } as const
          const root = insertConditionExpression(
            value.root,
            insertOptions.parentId ?? value.root.id,
            group,
            insertOptions.index,
          )
          commit({ ...value, root }, 'add-group')
          return group.id
        },

        updateCondition(id, patch) {
          const value = get().value
          const root = updateConditionExpression(
            value.root,
            id,
            (expression) => {
              if (isConditionGroup(expression)) {
                throw new ConditionTreeError(
                  `Condition expression "${id}" is a group.`,
                )
              }

              const current = expression as Condition

              const fieldChanged =
                patch.field !== undefined && patch.field !== current.field
              const fieldId = patch.field ?? current.field
              const field = definition.fields[fieldId]
              if (!field) {
                throw new ConditionTreeError(
                  `Unknown condition field "${fieldId}".`,
                )
              }
              const availableOperators = getConditionFieldOperators(
                definition,
                field,
              )
              const operator =
                patch.operator ??
                (fieldChanged
                  ? (field.defaultOperator ?? availableOperators[0]?.id)
                  : current.operator)
              if (!operator) {
                throw new ConditionTreeError(
                  `Condition field "${fieldId}" has no available operators.`,
                )
              }

              return {
                ...current,
                field: fieldId,
                operator,
                value: Object.prototype.hasOwnProperty.call(patch, 'value')
                  ? patch.value
                  : fieldChanged
                    ? field.defaultValue
                    : current.value,
              } as TCondition
            },
          )
          commit({ ...value, root }, 'update-condition')
        },

        updateGroup(id, patch) {
          const value = get().value
          const root = updateConditionExpression(
            value.root,
            id,
            (expression) => {
              if (!isConditionGroup(expression)) {
                throw new ConditionTreeError(
                  `Condition expression "${id}" is not a group.`,
                )
              }
              return { ...expression, combinator: patch.combinator }
            },
          )
          commit({ ...value, root }, 'update-group')
        },

        remove(id) {
          const value = get().value
          const result = removeConditionExpression(value.root, id)
          commit({ ...value, root: result.root }, 'remove')
        },

        move(id, moveOptions) {
          const value = get().value
          const root = moveConditionExpression(
            value.root,
            id,
            moveOptions.parentId,
            moveOptions.index,
          )
          commit({ ...value, root }, 'move')
        },

        group(ids, combinator, groupOptions = {}) {
          const value = get().value
          const id = groupOptions.id ?? nextId('group')
          const root = groupConditionExpressions(value.root, ids, {
            kind: 'group',
            id,
            combinator,
            items: [],
          })
          commit({ ...value, root }, 'group')
          return id
        },

        ungroup(id) {
          const value = get().value
          const root = ungroupConditionExpression(value.root, id)
          commit({ ...value, root }, 'ungroup')
        },

        clear(groupId) {
          const value = get().value
          const root = updateConditionExpression(
            value.root,
            groupId ?? value.root.id,
            (expression) => {
              if (!isConditionGroup(expression)) {
                throw new ConditionTreeError(
                  `Condition expression "${groupId}" is not a group.`,
                )
              }
              return { ...expression, items: [] }
            },
          )
          commit({ ...value, root }, 'clear')
        },

        setValue(value) {
          commit(value, 'set-value')
        },

        reset() {
          commit(normalizedInitialValue, 'reset')
        },

        update(updater) {
          commit(updater(get().value), 'set-value')
        },
      }

      return actions as ConditionsActions<TFields, TOperators> &
        Record<string, (...args: any[]) => any>
    },
  )

  return {
    definition,
    actions: internal.actions,
    get: internal.get,
    getState: internal.get,
    subscribe: internal.subscribe,
    validate: () =>
      validateConditionQuery(internal.get().value, definition),
    evaluate: (subject) =>
      evaluateConditionQuery(internal.get().value, subject, definition, {
        validate: shouldValidate,
      }),
    serialize: () =>
      serializeConditionQuery(internal.get().value, definition, {
        validate: shouldValidate,
      }),
    stringify: () =>
      stringifyConditionQuery(internal.get().value, definition, {
        validate: shouldValidate,
      }),
  }
}

function createDefaultIdFactory() {
  let id = 0
  return (kind: 'condition' | 'group') => {
    const randomId = globalThis.crypto?.randomUUID?.()
    if (randomId) return randomId
    id += 1
    return `${kind}-${Date.now().toString(36)}-${id.toString(36)}`
  }
}
