import { type FC, type ReactNode } from 'react';
import { type ConditionGroup, type ConditionsStore } from '@saas-js/conditions';
import { useConditionChip } from './chip.ts';
import { useCondition, useConditionAddDraft, useConditionDraft, useConditionEditDraft, useConditionGroup, useConditionHasAddDraft, useConditionsIsEmpty, useConditionsRoot, useConditionsValue } from './data-hooks.ts';
import type { ConditionDraft } from './draft.ts';
import { useConditionOptions } from './options.ts';
import { useConditionDraftSelector, useConditionGroupSelector, useConditionSelector, useConditionsFilter, useConditionsSelector } from './selectors.ts';
import type { AnyConditionsDefinition, ConditionGroupScopeProps, ConditionScopeProps, ConditionsBoundComponentProps, ConditionsComponentRegistry, ConditionsController, ConditionsHookContexts, ConditionsRootProps, ConditionsSubscribeProps, ConditionsValueChangeDetails, ConditionsValueEditorProps, DefinitionCondition, DefinitionFields, DefinitionFromStore, DefinitionQuery, ValueEditorComponent, ValueEditorRegistries, ValueEditorRegistry, ValueEditorResolverContext } from './types.ts';
export interface CreateConditionsHookOptions<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition, TValueEditors extends ValueEditorRegistry = {}, TFieldValueEditors extends ValueEditorRegistry = {}, TOperatorValueEditors extends ValueEditorRegistry = {}, TFieldOperatorValueEditors extends ValueEditorRegistry = {}, TConditionComponents extends ConditionsComponentRegistry = {}, TGroupComponents extends ConditionsComponentRegistry = {}, TConditionsComponents extends ConditionsComponentRegistry = {}> {
    /**
     * Bind a definition so `useConditions()` and every context hook are fully
     * typed without generic annotations at call sites.
     */
    definition?: TDefinition;
    /**
     * Shared contexts, only needed when several hook compositions must resolve
     * the same providers. Created internally when omitted.
     */
    contexts?: ConditionsHookContexts;
    valueEditors?: TValueEditors;
    fieldValueEditors?: TFieldValueEditors;
    operatorValueEditors?: TOperatorValueEditors;
    fieldOperatorValueEditors?: TFieldOperatorValueEditors;
    fallbackValueEditor?: ValueEditorComponent<any>;
    resolveValueEditor?: ValueEditorRegistries['resolveValueEditor'];
    conditionComponents?: TConditionComponents;
    groupComponents?: TGroupComponents;
    conditionsComponents?: TConditionsComponents;
}
type RegisteredComponents<TConditionComponents extends ConditionsComponentRegistry, TGroupComponents extends ConditionsComponentRegistry, TConditionsComponents extends ConditionsComponentRegistry> = TConditionComponents & TGroupComponents & TConditionsComponents;
export interface ConditionsInstanceComponents<TDefinition extends AnyConditionsDefinition> {
    Root: FC<ConditionsRootProps>;
    ConditionScope: FC<ConditionScopeProps>;
    ConditionGroupScope: FC<ConditionGroupScopeProps>;
    Subscribe: <TSelected>(props: ConditionsSubscribeProps<TDefinition, TSelected>) => ReactNode;
    /**
     * Renders the value editor resolved from the registered editors for the
     * given field and operator. Renders nothing for unknown fields/operators or
     * operators without a value.
     */
    ValueEditor: FC<ConditionsValueEditorProps<TDefinition>>;
    getValueEditor(context: ValueEditorResolverContext): ValueEditorComponent<any> | undefined;
    /**
     * Reactive counterpart of `filter`: filters subjects with the committed
     * query and rerenders when the query changes.
     */
    useFilter<TSubject>(subjects: readonly TSubject[]): TSubject[];
    /** The committed query. */
    useValue(): DefinitionQuery<TDefinition>;
    /** The root condition group. */
    useRoot(): ConditionGroup<DefinitionCondition<TDefinition>>;
    /** `true` while the query has no conditions or groups. */
    useIsEmpty(): boolean;
    /** One condition by id, or `undefined` when missing (or a group). */
    useCondition(id: string): DefinitionCondition<TDefinition> | undefined;
    /** One condition group by id, or `undefined` when missing (or a condition). */
    useGroup(id: string): ConditionGroup<DefinitionCondition<TDefinition>> | undefined;
    /** The active draft, if any. */
    useDraft(): ConditionDraft<TDefinition> | undefined;
    /** The active draft while it edits the given condition. */
    useEditDraft(conditionId: string): ConditionDraft<TDefinition> | undefined;
    /** The active add draft targeting the given group. */
    useAddDraft(parentId: string): ConditionDraft<TDefinition> | undefined;
    /** `true` while an add draft targets the given group; never rerenders on draft edits. */
    useHasAddDraft(parentId: string): boolean;
}
export type ConditionsInstance<TDefinition extends AnyConditionsDefinition, TComponents extends ConditionsComponentRegistry = {}> = ConditionsController<TDefinition> & ConditionsInstanceComponents<TDefinition> & TComponents;
export interface UseConditionsBoundOptions<TDefinition extends AnyConditionsDefinition> {
    /** Controlled query value. Leave `undefined` for uncontrolled usage. */
    value?: DefinitionQuery<TDefinition>;
    defaultValue?: DefinitionQuery<TDefinition>;
    onValueChange?: (details: ConditionsValueChangeDetails<TDefinition>) => void;
}
export interface UseConditionsDefinitionOptions<TDefinition extends AnyConditionsDefinition> extends UseConditionsBoundOptions<TDefinition> {
    definition: TDefinition;
}
export interface UseConditionsStoreOptions<TStore extends ConditionsStore<any, any>> {
    store: TStore;
}
/** `true` when the hook factory was created with a concrete definition. */
type IsBoundDefinition<TDefinition extends AnyConditionsDefinition> = 0 extends 1 & DefinitionFields<TDefinition> ? false : true;
interface UseConditionsBase<TComponents extends ConditionsComponentRegistry> {
    <TDefinition extends AnyConditionsDefinition>(options: UseConditionsDefinitionOptions<TDefinition>): ConditionsInstance<TDefinition, TComponents>;
    <TStore extends ConditionsStore<any, any>>(options: UseConditionsStoreOptions<TStore>): ConditionsInstance<DefinitionFromStore<TStore>, TComponents>;
}
type UseConditionsBound<TDefinition extends AnyConditionsDefinition, TComponents extends ConditionsComponentRegistry> = IsBoundDefinition<TDefinition> extends true ? {
    (options?: UseConditionsBoundOptions<TDefinition>): ConditionsInstance<TDefinition, TComponents>;
} : unknown;
interface WithConditionsBase<TComponents extends ConditionsComponentRegistry> {
    <TDefinition extends AnyConditionsDefinition>(options: {
        definition: TDefinition;
        render(props: {
            conditions: ConditionsInstance<TDefinition, TComponents>;
        }): ReactNode;
    }): FC<ConditionsBoundComponentProps<TDefinition>>;
}
type WithConditionsBound<TDefinition extends AnyConditionsDefinition, TComponents extends ConditionsComponentRegistry> = IsBoundDefinition<TDefinition> extends true ? {
    (options: {
        render(props: {
            conditions: ConditionsInstance<TDefinition, TComponents>;
        }): ReactNode;
    }): FC<ConditionsBoundComponentProps<TDefinition>>;
} : unknown;
type NoDuplicateKeys<TExtension extends Record<string, any>, TExisting extends Record<string, any>> = Extract<keyof TExtension, keyof TExisting> extends never ? TExtension : never;
export interface ConditionsHookApi<TDefinition extends AnyConditionsDefinition, TValueEditors extends ValueEditorRegistry, TFieldValueEditors extends ValueEditorRegistry, TOperatorValueEditors extends ValueEditorRegistry, TFieldOperatorValueEditors extends ValueEditorRegistry, TConditionComponents extends ConditionsComponentRegistry, TGroupComponents extends ConditionsComponentRegistry, TConditionsComponents extends ConditionsComponentRegistry> {
    useConditions: UseConditionsBase<RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>> & UseConditionsBound<TDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
    useConditionsContext: <TContextDefinition extends AnyConditionsDefinition = TDefinition>() => ConditionsInstance<TContextDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
    useConditionContext: () => {
        conditions: ConditionsInstance<TDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
        id: string;
    };
    useConditionGroupContext: () => {
        conditions: ConditionsInstance<TDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
        id: string;
    };
    useConditionsSelector: typeof useConditionsSelector;
    useConditionSelector: typeof useConditionSelector;
    useConditionGroupSelector: typeof useConditionGroupSelector;
    useConditionDraftSelector: typeof useConditionDraftSelector;
    useConditionsFilter: typeof useConditionsFilter;
    useConditionsValue: typeof useConditionsValue;
    useConditionsRoot: typeof useConditionsRoot;
    useConditionsIsEmpty: typeof useConditionsIsEmpty;
    useCondition: typeof useCondition;
    useConditionGroup: typeof useConditionGroup;
    useConditionDraft: typeof useConditionDraft;
    useConditionEditDraft: typeof useConditionEditDraft;
    useConditionAddDraft: typeof useConditionAddDraft;
    useConditionHasAddDraft: typeof useConditionHasAddDraft;
    useConditionOptions: typeof useConditionOptions;
    useConditionChip: typeof useConditionChip;
    withConditions: WithConditionsBase<RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>> & WithConditionsBound<TDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
    withConditionGroup(options: {
        render(props: {
            conditions: ConditionsInstance<TDefinition, RegisteredComponents<TConditionComponents, TGroupComponents, TConditionsComponents>>;
            groupId: string;
        }): ReactNode;
    }): FC<{
        id?: string;
    }>;
    extendConditions<TNextValueEditors extends ValueEditorRegistry = {}, TNextFieldValueEditors extends ValueEditorRegistry = {}, TNextOperatorValueEditors extends ValueEditorRegistry = {}, TNextFieldOperatorValueEditors extends ValueEditorRegistry = {}, TNextConditionComponents extends ConditionsComponentRegistry = {}, TNextGroupComponents extends ConditionsComponentRegistry = {}, TNextConditionsComponents extends ConditionsComponentRegistry = {}>(extension: Omit<CreateConditionsHookOptions<TDefinition, TNextValueEditors, TNextFieldValueEditors, TNextOperatorValueEditors, TNextFieldOperatorValueEditors, TNextConditionComponents, TNextGroupComponents, TNextConditionsComponents>, 'definition' | 'contexts' | 'valueEditors' | 'fieldValueEditors' | 'operatorValueEditors' | 'fieldOperatorValueEditors' | 'conditionComponents' | 'groupComponents' | 'conditionsComponents'> & {
        valueEditors?: NoDuplicateKeys<TNextValueEditors, TValueEditors>;
        fieldValueEditors?: NoDuplicateKeys<TNextFieldValueEditors, TFieldValueEditors>;
        operatorValueEditors?: NoDuplicateKeys<TNextOperatorValueEditors, TOperatorValueEditors>;
        fieldOperatorValueEditors?: NoDuplicateKeys<TNextFieldOperatorValueEditors, TFieldOperatorValueEditors>;
        conditionComponents?: NoDuplicateKeys<TNextConditionComponents, TConditionComponents>;
        groupComponents?: NoDuplicateKeys<TNextGroupComponents, TGroupComponents>;
        conditionsComponents?: NoDuplicateKeys<TNextConditionsComponents, TConditionsComponents>;
    }): ConditionsHookApi<TDefinition, TValueEditors & TNextValueEditors, TFieldValueEditors & TNextFieldValueEditors, TOperatorValueEditors & TNextOperatorValueEditors, TFieldOperatorValueEditors & TNextFieldOperatorValueEditors, TConditionComponents & TNextConditionComponents, TGroupComponents & TNextGroupComponents, TConditionsComponents & TNextConditionsComponents>;
}
export declare function createConditionsHook<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition, const TValueEditors extends ValueEditorRegistry = {}, const TFieldValueEditors extends ValueEditorRegistry = {}, const TOperatorValueEditors extends ValueEditorRegistry = {}, const TFieldOperatorValueEditors extends ValueEditorRegistry = {}, const TConditionComponents extends ConditionsComponentRegistry = {}, const TGroupComponents extends ConditionsComponentRegistry = {}, const TConditionsComponents extends ConditionsComponentRegistry = {}>(options?: CreateConditionsHookOptions<TDefinition, TValueEditors, TFieldValueEditors, TOperatorValueEditors, TFieldOperatorValueEditors, TConditionComponents, TGroupComponents, TConditionsComponents>): ConditionsHookApi<TDefinition, TValueEditors, TFieldValueEditors, TOperatorValueEditors, TFieldOperatorValueEditors, TConditionComponents, TGroupComponents, TConditionsComponents>;
export {};
