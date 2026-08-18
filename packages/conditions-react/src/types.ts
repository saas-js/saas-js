import type { ComponentType, Context, ReactNode } from 'react'

import type {
  ConditionFieldDefinition,
  ConditionFieldId,
  ConditionForDefinition,
  ConditionOperator,
  ConditionOperatorIdFromList,
  ConditionQueryForDefinition,
  ConditionValueChangeDetails,
  ConditionsActions,
  ConditionsDefinition,
  ConditionsState,
  ConditionsStore,
} from '@saas-js/conditions'

import type { ConditionDraftController } from './draft.ts'

export type AnyConditionsDefinition = ConditionsDefinition<any, any>

export type DefinitionFields<TDefinition extends AnyConditionsDefinition> =
  TDefinition extends ConditionsDefinition<infer TFields, any> ? TFields : never

export type DefinitionOperators<TDefinition extends AnyConditionsDefinition> =
  TDefinition extends ConditionsDefinition<any, infer TOperators>
    ? TOperators
    : never

export type DefinitionFieldId<TDefinition extends AnyConditionsDefinition> =
  ConditionFieldId<DefinitionFields<TDefinition>>

export type DefinitionOperatorId<TDefinition extends AnyConditionsDefinition> =
  ConditionOperatorIdFromList<DefinitionOperators<TDefinition>> & string

export type DefinitionStore<TDefinition extends AnyConditionsDefinition> =
  ConditionsStore<
    DefinitionFields<TDefinition>,
    DefinitionOperators<TDefinition>
  >

export type DefinitionState<TDefinition extends AnyConditionsDefinition> =
  ConditionsState<
    DefinitionFields<TDefinition>,
    DefinitionOperators<TDefinition>
  >

export type DefinitionActions<TDefinition extends AnyConditionsDefinition> =
  ConditionsActions<
    DefinitionFields<TDefinition>,
    DefinitionOperators<TDefinition>
  >

export type DefinitionCondition<TDefinition extends AnyConditionsDefinition> =
  ConditionForDefinition<TDefinition>

export type DefinitionQuery<TDefinition extends AnyConditionsDefinition> =
  ConditionQueryForDefinition<TDefinition>

export type DefinitionFromStore<TStore extends ConditionsStore<any, any>> =
  TStore extends ConditionsStore<infer TFields, infer TOperators>
    ? ConditionsDefinition<TFields, TOperators>
    : never

export type ConditionsValueChangeDetails<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> = ConditionValueChangeDetails<
  DefinitionFields<TDefinition>,
  DefinitionOperators<TDefinition>
>

export interface ConditionsController<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  readonly definition: TDefinition
  readonly store: DefinitionStore<TDefinition>
  readonly actions: DefinitionActions<TDefinition>
  readonly draft: ConditionDraftController<TDefinition>
  /**
   * Filter subjects with the current committed query. Non-reactive; inside
   * components prefer `useFilter` on the instance (or `useConditionsFilter`)
   * to resubscribe when the query changes.
   */
  filter<TSubject>(subjects: readonly TSubject[]): TSubject[]
}

export interface ValueEditorProps<
  TValue = unknown,
  TField extends ConditionFieldDefinition = ConditionFieldDefinition,
  TOperator extends ConditionOperator = ConditionOperator,
> {
  value: TValue | undefined
  onValueChange(value: TValue): void
  field: TField
  operator: TOperator
  disabled?: boolean
  readOnly?: boolean
  error?: string
}

export type ValueEditorComponent<TValue = any> = ComponentType<
  ValueEditorProps<TValue, any, any>
>

export type ValueEditorRegistry = Record<string, ValueEditorComponent<any>>
export type ConditionsComponentRegistry = Record<string, ComponentType<any>>

export interface ValueEditorRegistries {
  valueEditors?: ValueEditorRegistry
  fieldValueEditors?: ValueEditorRegistry
  operatorValueEditors?: ValueEditorRegistry
  fieldOperatorValueEditors?: ValueEditorRegistry
  fallbackValueEditor?: ValueEditorComponent<any>
  resolveValueEditor?: (
    context: ValueEditorResolverContext,
    resolved: ValueEditorComponent<any> | undefined,
  ) => ValueEditorComponent<any> | undefined
}

export interface ValueEditorResolverContext {
  fieldId: string
  field: ConditionFieldDefinition
  operator: ConditionOperator
}

export interface ConditionsHookContexts {
  readonly RootContext: Context<ConditionsController | null>
  readonly ConditionContext: Context<string | null>
  readonly GroupContext: Context<string | null>
}

export interface ConditionsRootProps {
  children?: ReactNode
}

export interface ConditionScopeProps {
  id: string
  children?: ReactNode
}

export interface ConditionGroupScopeProps {
  id: string
  children?: ReactNode
}

export interface ConditionsSubscribeProps<
  TDefinition extends AnyConditionsDefinition,
  TSelected,
> {
  selector(state: DefinitionState<TDefinition>): TSelected
  isEqual?(a: TSelected, b: TSelected): boolean
  children(value: TSelected): ReactNode
}

/**
 * Props for the built-in `conditions.ValueEditor` component. The editor is
 * resolved through the hook's registries; nothing renders when the field or
 * operator is unknown, or when the operator takes no value.
 */
export interface ConditionsValueEditorProps<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  field: DefinitionFieldId<TDefinition> | undefined
  operator: DefinitionOperatorId<TDefinition> | undefined
  value: unknown
  onValueChange(value: unknown): void
  disabled?: boolean
  readOnly?: boolean
  error?: string
}

export interface ConditionsBoundComponentProps<
  TDefinition extends AnyConditionsDefinition,
> {
  defaultValue?: DefinitionQuery<TDefinition>
  value?: DefinitionQuery<TDefinition>
  onValueChange?: (details: ConditionsValueChangeDetails<TDefinition>) => void
}
