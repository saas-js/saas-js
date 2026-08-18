import {
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  type ConditionGroup,
  type ConditionsStore,
  getConditionField,
  getConditionOperator,
} from '@saas-js/conditions'

import { useConditionChip } from './chip.ts'
import {
  useCondition,
  useConditionAddDraft,
  useConditionDraft,
  useConditionEditDraft,
  useConditionGroup,
  useConditionHasAddDraft,
  useConditionsIsEmpty,
  useConditionsRoot,
  useConditionsValue,
} from './data-hooks.ts'
import type { ConditionDraft } from './draft.ts'
import {
  createConditionsHookContexts,
  useConditionGroupScopeContext,
  useConditionScopeContext,
  useConditionsRootContext,
} from './contexts.tsx'
import { createConditionsController } from './controller.ts'
import { useConditionOptions } from './options.ts'
import {
  useConditionDraftSelector,
  useConditionGroupSelector,
  useConditionSelector,
  useConditionsFilter,
  useConditionsSelector,
} from './selectors.ts'
import type {
  AnyConditionsDefinition,
  ConditionGroupScopeProps,
  ConditionScopeProps,
  ConditionsBoundComponentProps,
  ConditionsComponentRegistry,
  ConditionsController,
  ConditionsHookContexts,
  ConditionsRootProps,
  ConditionsSubscribeProps,
  ConditionsValueChangeDetails,
  ConditionsValueEditorProps,
  DefinitionCondition,
  DefinitionFields,
  DefinitionFromStore,
  DefinitionQuery,
  ValueEditorComponent,
  ValueEditorRegistries,
  ValueEditorRegistry,
  ValueEditorResolverContext,
} from './types.ts'
import { resolveValueEditor } from './value-editors.ts'

export interface CreateConditionsHookOptions<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
  TValueEditors extends ValueEditorRegistry = {},
  TFieldValueEditors extends ValueEditorRegistry = {},
  TOperatorValueEditors extends ValueEditorRegistry = {},
  TFieldOperatorValueEditors extends ValueEditorRegistry = {},
  TConditionComponents extends ConditionsComponentRegistry = {},
  TGroupComponents extends ConditionsComponentRegistry = {},
  TConditionsComponents extends ConditionsComponentRegistry = {},
> {
  /**
   * Bind a definition so `useConditions()` and every context hook are fully
   * typed without generic annotations at call sites.
   */
  definition?: TDefinition
  /**
   * Shared contexts, only needed when several hook compositions must resolve
   * the same providers. Created internally when omitted.
   */
  contexts?: ConditionsHookContexts
  valueEditors?: TValueEditors
  fieldValueEditors?: TFieldValueEditors
  operatorValueEditors?: TOperatorValueEditors
  fieldOperatorValueEditors?: TFieldOperatorValueEditors
  fallbackValueEditor?: ValueEditorComponent<any>
  resolveValueEditor?: ValueEditorRegistries['resolveValueEditor']
  conditionComponents?: TConditionComponents
  groupComponents?: TGroupComponents
  conditionsComponents?: TConditionsComponents
}

type RegisteredComponents<
  TConditionComponents extends ConditionsComponentRegistry,
  TGroupComponents extends ConditionsComponentRegistry,
  TConditionsComponents extends ConditionsComponentRegistry,
> = TConditionComponents & TGroupComponents & TConditionsComponents

export interface ConditionsInstanceComponents<
  TDefinition extends AnyConditionsDefinition,
> {
  Root: FC<ConditionsRootProps>
  ConditionScope: FC<ConditionScopeProps>
  ConditionGroupScope: FC<ConditionGroupScopeProps>
  Subscribe: <TSelected>(
    props: ConditionsSubscribeProps<TDefinition, TSelected>,
  ) => ReactNode
  /**
   * Renders the value editor resolved from the registered editors for the
   * given field and operator. Renders nothing for unknown fields/operators or
   * operators without a value.
   */
  ValueEditor: FC<ConditionsValueEditorProps<TDefinition>>
  getValueEditor(
    context: ValueEditorResolverContext,
  ): ValueEditorComponent<any> | undefined
  /**
   * Reactive counterpart of `filter`: filters subjects with the committed
   * query and rerenders when the query changes.
   */
  useFilter<TSubject>(subjects: readonly TSubject[]): TSubject[]
  /** The committed query. */
  useValue(): DefinitionQuery<TDefinition>
  /** The root condition group. */
  useRoot(): ConditionGroup<DefinitionCondition<TDefinition>>
  /** `true` while the query has no conditions or groups. */
  useIsEmpty(): boolean
  /** One condition by id, or `undefined` when missing (or a group). */
  useCondition(id: string): DefinitionCondition<TDefinition> | undefined
  /** One condition group by id, or `undefined` when missing (or a condition). */
  useGroup(id: string): ConditionGroup<DefinitionCondition<TDefinition>> | undefined
  /** The active draft, if any. */
  useDraft(): ConditionDraft<TDefinition> | undefined
  /** The active draft while it edits the given condition. */
  useEditDraft(conditionId: string): ConditionDraft<TDefinition> | undefined
  /** The active add draft targeting the given group. */
  useAddDraft(parentId: string): ConditionDraft<TDefinition> | undefined
  /** `true` while an add draft targets the given group; never rerenders on draft edits. */
  useHasAddDraft(parentId: string): boolean
}

export type ConditionsInstance<
  TDefinition extends AnyConditionsDefinition,
  TComponents extends ConditionsComponentRegistry = {},
> = ConditionsController<TDefinition> &
  ConditionsInstanceComponents<TDefinition> &
  TComponents

export interface UseConditionsBoundOptions<
  TDefinition extends AnyConditionsDefinition,
> {
  /** Controlled query value. Leave `undefined` for uncontrolled usage. */
  value?: DefinitionQuery<TDefinition>
  defaultValue?: DefinitionQuery<TDefinition>
  onValueChange?: (details: ConditionsValueChangeDetails<TDefinition>) => void
}

export interface UseConditionsDefinitionOptions<
  TDefinition extends AnyConditionsDefinition,
> extends UseConditionsBoundOptions<TDefinition> {
  definition: TDefinition
}

export interface UseConditionsStoreOptions<
  TStore extends ConditionsStore<any, any>,
> {
  store: TStore
}

/** `true` when the hook factory was created with a concrete definition. */
type IsBoundDefinition<TDefinition extends AnyConditionsDefinition> =
  0 extends 1 & DefinitionFields<TDefinition> ? false : true

interface UseConditionsBase<TComponents extends ConditionsComponentRegistry> {
  <TDefinition extends AnyConditionsDefinition>(
    options: UseConditionsDefinitionOptions<TDefinition>,
  ): ConditionsInstance<TDefinition, TComponents>
  <TStore extends ConditionsStore<any, any>>(
    options: UseConditionsStoreOptions<TStore>,
  ): ConditionsInstance<DefinitionFromStore<TStore>, TComponents>
}

type UseConditionsBound<
  TDefinition extends AnyConditionsDefinition,
  TComponents extends ConditionsComponentRegistry,
> =
  IsBoundDefinition<TDefinition> extends true
    ? {
        (
          options?: UseConditionsBoundOptions<TDefinition>,
        ): ConditionsInstance<TDefinition, TComponents>
      }
    : unknown

interface WithConditionsBase<TComponents extends ConditionsComponentRegistry> {
  <TDefinition extends AnyConditionsDefinition>(options: {
    definition: TDefinition
    render(props: {
      conditions: ConditionsInstance<TDefinition, TComponents>
    }): ReactNode
  }): FC<ConditionsBoundComponentProps<TDefinition>>
}

type WithConditionsBound<
  TDefinition extends AnyConditionsDefinition,
  TComponents extends ConditionsComponentRegistry,
> =
  IsBoundDefinition<TDefinition> extends true
    ? {
        (options: {
          render(props: {
            conditions: ConditionsInstance<TDefinition, TComponents>
          }): ReactNode
        }): FC<ConditionsBoundComponentProps<TDefinition>>
      }
    : unknown

type NoDuplicateKeys<
  TExtension extends Record<string, any>,
  TExisting extends Record<string, any>,
> =
  Extract<keyof TExtension, keyof TExisting> extends never ? TExtension : never

export interface ConditionsHookApi<
  TDefinition extends AnyConditionsDefinition,
  TValueEditors extends ValueEditorRegistry,
  TFieldValueEditors extends ValueEditorRegistry,
  TOperatorValueEditors extends ValueEditorRegistry,
  TFieldOperatorValueEditors extends ValueEditorRegistry,
  TConditionComponents extends ConditionsComponentRegistry,
  TGroupComponents extends ConditionsComponentRegistry,
  TConditionsComponents extends ConditionsComponentRegistry,
> {
  useConditions: UseConditionsBase<
    RegisteredComponents<
      TConditionComponents,
      TGroupComponents,
      TConditionsComponents
    >
  > &
    UseConditionsBound<
      TDefinition,
      RegisteredComponents<
        TConditionComponents,
        TGroupComponents,
        TConditionsComponents
      >
    >
  useConditionsContext: <
    TContextDefinition extends AnyConditionsDefinition = TDefinition,
  >() => ConditionsInstance<
    TContextDefinition,
    RegisteredComponents<
      TConditionComponents,
      TGroupComponents,
      TConditionsComponents
    >
  >
  useConditionContext: () => {
    conditions: ConditionsInstance<
      TDefinition,
      RegisteredComponents<
        TConditionComponents,
        TGroupComponents,
        TConditionsComponents
      >
    >
    id: string
  }
  useConditionGroupContext: () => {
    conditions: ConditionsInstance<
      TDefinition,
      RegisteredComponents<
        TConditionComponents,
        TGroupComponents,
        TConditionsComponents
      >
    >
    id: string
  }
  useConditionsSelector: typeof useConditionsSelector
  useConditionSelector: typeof useConditionSelector
  useConditionGroupSelector: typeof useConditionGroupSelector
  useConditionDraftSelector: typeof useConditionDraftSelector
  useConditionsFilter: typeof useConditionsFilter
  useConditionsValue: typeof useConditionsValue
  useConditionsRoot: typeof useConditionsRoot
  useConditionsIsEmpty: typeof useConditionsIsEmpty
  useCondition: typeof useCondition
  useConditionGroup: typeof useConditionGroup
  useConditionDraft: typeof useConditionDraft
  useConditionEditDraft: typeof useConditionEditDraft
  useConditionAddDraft: typeof useConditionAddDraft
  useConditionHasAddDraft: typeof useConditionHasAddDraft
  useConditionOptions: typeof useConditionOptions
  useConditionChip: typeof useConditionChip
  withConditions: WithConditionsBase<
    RegisteredComponents<
      TConditionComponents,
      TGroupComponents,
      TConditionsComponents
    >
  > &
    WithConditionsBound<
      TDefinition,
      RegisteredComponents<
        TConditionComponents,
        TGroupComponents,
        TConditionsComponents
      >
    >
  withConditionGroup(options: {
    render(props: {
      conditions: ConditionsInstance<
        TDefinition,
        RegisteredComponents<
          TConditionComponents,
          TGroupComponents,
          TConditionsComponents
        >
      >
      groupId: string
    }): ReactNode
  }): FC<{ id?: string }>
  extendConditions<
    TNextValueEditors extends ValueEditorRegistry = {},
    TNextFieldValueEditors extends ValueEditorRegistry = {},
    TNextOperatorValueEditors extends ValueEditorRegistry = {},
    TNextFieldOperatorValueEditors extends ValueEditorRegistry = {},
    TNextConditionComponents extends ConditionsComponentRegistry = {},
    TNextGroupComponents extends ConditionsComponentRegistry = {},
    TNextConditionsComponents extends ConditionsComponentRegistry = {},
  >(
    extension: Omit<
      CreateConditionsHookOptions<
        TDefinition,
        TNextValueEditors,
        TNextFieldValueEditors,
        TNextOperatorValueEditors,
        TNextFieldOperatorValueEditors,
        TNextConditionComponents,
        TNextGroupComponents,
        TNextConditionsComponents
      >,
      | 'definition'
      | 'contexts'
      | 'valueEditors'
      | 'fieldValueEditors'
      | 'operatorValueEditors'
      | 'fieldOperatorValueEditors'
      | 'conditionComponents'
      | 'groupComponents'
      | 'conditionsComponents'
    > & {
      valueEditors?: NoDuplicateKeys<TNextValueEditors, TValueEditors>
      fieldValueEditors?: NoDuplicateKeys<
        TNextFieldValueEditors,
        TFieldValueEditors
      >
      operatorValueEditors?: NoDuplicateKeys<
        TNextOperatorValueEditors,
        TOperatorValueEditors
      >
      fieldOperatorValueEditors?: NoDuplicateKeys<
        TNextFieldOperatorValueEditors,
        TFieldOperatorValueEditors
      >
      conditionComponents?: NoDuplicateKeys<
        TNextConditionComponents,
        TConditionComponents
      >
      groupComponents?: NoDuplicateKeys<TNextGroupComponents, TGroupComponents>
      conditionsComponents?: NoDuplicateKeys<
        TNextConditionsComponents,
        TConditionsComponents
      >
    },
  ): ConditionsHookApi<
    TDefinition,
    TValueEditors & TNextValueEditors,
    TFieldValueEditors & TNextFieldValueEditors,
    TOperatorValueEditors & TNextOperatorValueEditors,
    TFieldOperatorValueEditors & TNextFieldOperatorValueEditors,
    TConditionComponents & TNextConditionComponents,
    TGroupComponents & TNextGroupComponents,
    TConditionsComponents & TNextConditionsComponents
  >
}

const RESERVED_COMPONENT_NAMES = new Set([
  'Root',
  'ConditionScope',
  'ConditionGroupScope',
  'Subscribe',
  'ValueEditor',
  'getValueEditor',
  'useFilter',
  'useValue',
  'useRoot',
  'useIsEmpty',
  'useCondition',
  'useGroup',
  'useDraft',
  'useEditDraft',
  'useAddDraft',
  'useHasAddDraft',
  'definition',
  'store',
  'actions',
  'draft',
  'filter',
])

export function createConditionsHook<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
  const TValueEditors extends ValueEditorRegistry = {},
  const TFieldValueEditors extends ValueEditorRegistry = {},
  const TOperatorValueEditors extends ValueEditorRegistry = {},
  const TFieldOperatorValueEditors extends ValueEditorRegistry = {},
  const TConditionComponents extends ConditionsComponentRegistry = {},
  const TGroupComponents extends ConditionsComponentRegistry = {},
  const TConditionsComponents extends ConditionsComponentRegistry = {},
>(
  options: CreateConditionsHookOptions<
    TDefinition,
    TValueEditors,
    TFieldValueEditors,
    TOperatorValueEditors,
    TFieldOperatorValueEditors,
    TConditionComponents,
    TGroupComponents,
    TConditionsComponents
  > = {},
): ConditionsHookApi<
  TDefinition,
  TValueEditors,
  TFieldValueEditors,
  TOperatorValueEditors,
  TFieldOperatorValueEditors,
  TConditionComponents,
  TGroupComponents,
  TConditionsComponents
> {
  const contexts = options.contexts ?? createConditionsHookContexts()
  const editorRegistries: ValueEditorRegistries = options
  const registeredComponents = mergeRegistries(
    options.conditionComponents,
    options.groupComponents,
    options.conditionsComponents,
  )
  for (const name of Object.keys(registeredComponents)) {
    if (RESERVED_COMPONENT_NAMES.has(name)) {
      throw new Error(
        `"${name}" is a built-in conditions instance member and cannot be ` +
          'used as a registered component name.',
      )
    }
  }

  const ConditionScope: FC<ConditionScopeProps> = ({ id, children }) => (
    <contexts.ConditionContext.Provider value={id}>
      {children}
    </contexts.ConditionContext.Provider>
  )
  ConditionScope.displayName = 'ConditionScope'

  const ConditionGroupScope: FC<ConditionGroupScopeProps> = ({
    id,
    children,
  }) => (
    <contexts.GroupContext.Provider value={id}>
      {children}
    </contexts.GroupContext.Provider>
  )
  ConditionGroupScope.displayName = 'ConditionGroupScope'

  function createInstance(
    controller: ConditionsController<AnyConditionsDefinition>,
  ): ConditionsInstance<AnyConditionsDefinition, any> {
    const Root: FC<ConditionsRootProps> = ({ children }) => (
      <contexts.RootContext.Provider value={controller}>
        {children}
      </contexts.RootContext.Provider>
    )
    Root.displayName = 'ConditionsRoot'

    const Subscribe = <TSelected,>({
      selector,
      isEqual,
      children,
    }: ConditionsSubscribeProps<AnyConditionsDefinition, TSelected>) => {
      const selected = useConditionsSelector(controller, selector, isEqual)
      return children(selected)
    }

    const ValueEditor: FC<ConditionsValueEditorProps> = ({
      field: fieldId,
      operator: operatorId,
      value,
      onValueChange,
      disabled,
      readOnly,
      error,
    }) => {
      if (!fieldId || !operatorId) return null
      const field = getConditionField(controller.definition, fieldId)
      const operator = getConditionOperator(controller.definition, operatorId)
      if (!field || !operator || operator.valueMode === 'none') return null
      const Editor = resolveValueEditor(editorRegistries, {
        fieldId,
        field,
        operator,
      })
      if (!Editor) return null
      return (
        <Editor
          value={value}
          onValueChange={onValueChange}
          field={field}
          operator={operator}
          disabled={disabled}
          readOnly={readOnly}
          error={error}
        />
      )
    }
    ValueEditor.displayName = 'ConditionsValueEditor'

    return Object.assign(controller, registeredComponents, {
      Root,
      ConditionScope,
      ConditionGroupScope,
      Subscribe,
      ValueEditor,
      getValueEditor: (context: ValueEditorResolverContext) =>
        resolveValueEditor(editorRegistries, context),
      useFilter: <TSubject,>(subjects: readonly TSubject[]) =>
        useConditionsFilter(controller, subjects),
      useValue: () => useConditionsValue(controller),
      useRoot: () => useConditionsRoot(controller),
      useIsEmpty: () => useConditionsIsEmpty(controller),
      useCondition: (id: string) => useCondition(controller, id),
      useGroup: (id: string) => useConditionGroup(controller, id),
      useDraft: () => useConditionDraft(controller),
      useEditDraft: (conditionId: string) =>
        useConditionEditDraft(controller, conditionId),
      useAddDraft: (parentId: string) =>
        useConditionAddDraft(controller, parentId),
      useHasAddDraft: (parentId: string) =>
        useConditionHasAddDraft(controller, parentId),
    })
  }

  type AnyUseConditionsOptions = Partial<
    UseConditionsDefinitionOptions<AnyConditionsDefinition> &
      UseConditionsStoreOptions<ConditionsStore<any, any>>
  >

  function useConditions(hookOptions: AnyUseConditionsOptions = {}) {
    const definition = hookOptions.definition ?? options.definition
    const onValueChange = hookOptions.onValueChange
    const callbackRef = useRef(onValueChange)
    const suppressCallbackRef = useRef(false)

    const [instance] = useState(() => {
      if (hookOptions.store) {
        return createInstance(
          createConditionsController({ store: hookOptions.store }),
        )
      }
      if (!definition) {
        throw new Error(
          'useConditions requires a definition, a store, or a definition ' +
            'bound via createConditionsHook({ definition }).',
        )
      }
      const store = definition.createStore({
        initialValue: hookOptions.value ?? hookOptions.defaultValue,
        onValueChange(details: ConditionsValueChangeDetails) {
          if (suppressCallbackRef.current) return
          callbackRef.current?.(details)
        },
      })
      return createInstance(createConditionsController({ store }))
    })

    useEffect(() => {
      callbackRef.current = onValueChange
    })

    // Controlled reconciliation. Runs after every render so a parent that
    // rerenders with an unchanged `value` reverts store changes it rejected.
    const controlledValue = hookOptions.value
    useEffect(() => {
      if (
        controlledValue !== undefined &&
        instance.store.get().value !== controlledValue
      ) {
        suppressCallbackRef.current = true
        try {
          instance.actions.setValue(controlledValue)
        } finally {
          suppressCallbackRef.current = false
        }
      }
    })

    return instance
  }

  const api = {
    useConditions,
    useConditionsContext: () => useConditionsRootContext(contexts),
    useConditionContext: () => useConditionScopeContext(contexts),
    useConditionGroupContext: () => useConditionGroupScopeContext(contexts),
    useConditionsSelector,
    useConditionSelector,
    useConditionGroupSelector,
    useConditionDraftSelector,
    useConditionsFilter,
    useConditionsValue,
    useConditionsRoot,
    useConditionsIsEmpty,
    useCondition,
    useConditionGroup,
    useConditionDraft,
    useConditionEditDraft,
    useConditionAddDraft,
    useConditionHasAddDraft,
    useConditionOptions,
    useConditionChip,
    withConditions({
      definition,
      render,
    }: {
      definition?: AnyConditionsDefinition
      render(props: { conditions: any }): ReactNode
    }) {
      const BoundConditions: FC<
        ConditionsBoundComponentProps<AnyConditionsDefinition>
      > = (props) => {
        const conditions = useConditions({ definition, ...props })
        return render({ conditions })
      }
      BoundConditions.displayName = 'WithConditions'
      return BoundConditions
    },
    withConditionGroup({
      render,
    }: {
      render(props: { conditions: any; groupId: string }): ReactNode
    }) {
      const BoundConditionGroup: FC<{ id?: string }> = ({ id }) => {
        const conditions = useConditionsRootContext(contexts)
        const scopedId = useContext(contexts.GroupContext)
        const groupId = id ?? scopedId
        if (!groupId) {
          throw new Error(
            'A group id is required, or the component must be rendered inside conditions.ConditionGroupScope.',
          )
        }
        return render({ conditions, groupId })
      }
      BoundConditionGroup.displayName = 'WithConditionGroup'
      return BoundConditionGroup
    },
    extendConditions(extension: any) {
      return createConditionsHook({
        ...options,
        ...extension,
        definition: options.definition,
        contexts,
        valueEditors: mergeRegistry(
          options.valueEditors,
          extension.valueEditors,
        ),
        fieldValueEditors: mergeRegistry(
          options.fieldValueEditors,
          extension.fieldValueEditors,
        ),
        operatorValueEditors: mergeRegistry(
          options.operatorValueEditors,
          extension.operatorValueEditors,
        ),
        fieldOperatorValueEditors: mergeRegistry(
          options.fieldOperatorValueEditors,
          extension.fieldOperatorValueEditors,
        ),
        conditionComponents: mergeRegistry(
          options.conditionComponents,
          extension.conditionComponents,
        ),
        groupComponents: mergeRegistry(
          options.groupComponents,
          extension.groupComponents,
        ),
        conditionsComponents: mergeRegistry(
          options.conditionsComponents,
          extension.conditionsComponents,
        ),
      })
    },
  }

  return api as any
}

function mergeRegistry<
  TFirst extends Record<string, any> | undefined,
  TSecond extends Record<string, any> | undefined,
>(first: TFirst, second: TSecond) {
  if (first && second) {
    const duplicate = Object.keys(second).find((key) => key in first)
    if (duplicate) {
      throw new Error(
        `A component or editor named "${duplicate}" is already registered.`,
      )
    }
  }
  return { ...first, ...second }
}

function mergeRegistries(...registries: (Record<string, any> | undefined)[]) {
  let merged: Record<string, any> = {}
  for (const registry of registries) merged = mergeRegistry(merged, registry)
  return merged
}
