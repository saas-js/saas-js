import { type ConditionGroup } from '@saas-js/conditions';
import type { ConditionDraftState } from './draft.ts';
import type { AnyConditionsDefinition, ConditionsController, DefinitionCondition, DefinitionState } from './types.ts';
export type SelectorEquality<TSelected> = (a: TSelected, b: TSelected) => boolean;
export declare function useConditionsSelector<TDefinition extends AnyConditionsDefinition, TSelected>(conditions: ConditionsController<TDefinition>, selector: (state: DefinitionState<TDefinition>) => TSelected, isEqual?: SelectorEquality<TSelected>): TSelected;
export declare function useConditionDraftSelector<TDefinition extends AnyConditionsDefinition, TSelected>(conditions: ConditionsController<TDefinition>, selector: (state: ConditionDraftState<TDefinition>) => TSelected, isEqual?: SelectorEquality<TSelected>): TSelected;
/**
 * Filter subjects with the committed query, resubscribing on query changes.
 * The result is memoized against the query and the `subjects` reference.
 */
export declare function useConditionsFilter<TDefinition extends AnyConditionsDefinition, TSubject>(conditions: ConditionsController<TDefinition>, subjects: readonly TSubject[]): TSubject[];
export declare function useConditionSelector<TDefinition extends AnyConditionsDefinition, TSelected>(conditions: ConditionsController<TDefinition>, id: string, selector: (condition: DefinitionCondition<TDefinition> | undefined) => TSelected, isEqual?: SelectorEquality<TSelected>): TSelected;
export declare function useConditionGroupSelector<TDefinition extends AnyConditionsDefinition, TSelected>(conditions: ConditionsController<TDefinition>, id: string, selector: (group: ConditionGroup<DefinitionCondition<TDefinition>> | undefined) => TSelected, isEqual?: SelectorEquality<TSelected>): TSelected;
