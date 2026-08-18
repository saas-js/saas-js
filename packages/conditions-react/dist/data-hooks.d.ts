import type { ConditionGroup } from '@saas-js/conditions';
import type { ConditionDraft } from './draft.ts';
import type { AnyConditionsDefinition, ConditionsController, DefinitionCondition, DefinitionQuery } from './types.ts';
/** The committed query. */
export declare function useConditionsValue<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>): DefinitionQuery<TDefinition>;
/** The root condition group. */
export declare function useConditionsRoot<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>): ConditionGroup<DefinitionCondition<TDefinition>>;
/** `true` while the query has no conditions or groups. */
export declare function useConditionsIsEmpty(conditions: ConditionsController<AnyConditionsDefinition>): boolean;
/** One condition by id, or `undefined` when missing (or a group). */
export declare function useCondition<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>, id: string): DefinitionCondition<TDefinition> | undefined;
/** One condition group by id, or `undefined` when missing (or a condition). */
export declare function useConditionGroup<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>, id: string): ConditionGroup<DefinitionCondition<TDefinition>> | undefined;
/** The active draft, if any. */
export declare function useConditionDraft<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>): ConditionDraft<TDefinition> | undefined;
/** The active draft while it edits the given condition. */
export declare function useConditionEditDraft<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>, conditionId: string): ConditionDraft<TDefinition> | undefined;
/** The active add draft targeting the given group. */
export declare function useConditionAddDraft<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>, parentId: string): ConditionDraft<TDefinition> | undefined;
/**
 * `true` while an add draft targets the given group. Unlike
 * `useConditionAddDraft`, this never rerenders on draft edits — use it in
 * group nodes and render the draft chip in a child component.
 */
export declare function useConditionHasAddDraft(conditions: ConditionsController<AnyConditionsDefinition>, parentId: string): boolean;
