import { useCallback } from 'react'

import type { ConditionGroup } from '@saas-js/conditions'

import type { ConditionDraft, ConditionDraftState } from './draft.ts'
import {
  useConditionDraftSelector,
  useConditionGroupSelector,
  useConditionSelector,
  useConditionsSelector,
} from './selectors.ts'
import type {
  AnyConditionsDefinition,
  ConditionsController,
  DefinitionCondition,
  DefinitionQuery,
  DefinitionState,
} from './types.ts'

/**
 * Convenience hooks for the selections every conditions UI needs. Each one
 * subscribes through the memoized selector layer, so components rerender only
 * when the selected data actually changes. All of them are also pre-bound on
 * the instance returned by `useConditions` (`conditions.useValue()`, …).
 */

const selectValue = <TDefinition extends AnyConditionsDefinition>(
  state: DefinitionState<TDefinition>,
) => state.value

const selectRoot = <TDefinition extends AnyConditionsDefinition>(
  state: DefinitionState<TDefinition>,
) => state.value.root

const selectIsEmpty = (state: DefinitionState<AnyConditionsDefinition>) =>
  state.value.root.items.length === 0

const selectDraft = <TDefinition extends AnyConditionsDefinition>(
  state: ConditionDraftState<TDefinition>,
) => state.draft

const identity = <TSelected,>(value: TSelected) => value

/** The committed query. */
export function useConditionsValue<TDefinition extends AnyConditionsDefinition>(
  conditions: ConditionsController<TDefinition>,
): DefinitionQuery<TDefinition> {
  return useConditionsSelector(
    conditions,
    selectValue,
  ) as DefinitionQuery<TDefinition>
}

/** The root condition group. */
export function useConditionsRoot<TDefinition extends AnyConditionsDefinition>(
  conditions: ConditionsController<TDefinition>,
): ConditionGroup<DefinitionCondition<TDefinition>> {
  return useConditionsSelector(conditions, selectRoot) as ConditionGroup<
    DefinitionCondition<TDefinition>
  >
}

/** `true` while the query has no conditions or groups. */
export function useConditionsIsEmpty(
  conditions: ConditionsController<AnyConditionsDefinition>,
): boolean {
  return useConditionsSelector(conditions, selectIsEmpty)
}

/** One condition by id, or `undefined` when missing (or a group). */
export function useCondition<TDefinition extends AnyConditionsDefinition>(
  conditions: ConditionsController<TDefinition>,
  id: string,
): DefinitionCondition<TDefinition> | undefined {
  return useConditionSelector(conditions, id, identity)
}

/** One condition group by id, or `undefined` when missing (or a condition). */
export function useConditionGroup<TDefinition extends AnyConditionsDefinition>(
  conditions: ConditionsController<TDefinition>,
  id: string,
): ConditionGroup<DefinitionCondition<TDefinition>> | undefined {
  return useConditionGroupSelector(conditions, id, identity)
}

/** The active draft, if any. */
export function useConditionDraft<TDefinition extends AnyConditionsDefinition>(
  conditions: ConditionsController<TDefinition>,
): ConditionDraft<TDefinition> | undefined {
  return useConditionDraftSelector(conditions, selectDraft)
}

/** The active draft while it edits the given condition. */
export function useConditionEditDraft<
  TDefinition extends AnyConditionsDefinition,
>(
  conditions: ConditionsController<TDefinition>,
  conditionId: string,
): ConditionDraft<TDefinition> | undefined {
  const selector = useCallback(
    (state: ConditionDraftState<TDefinition>) =>
      state.draft?.conditionId === conditionId ? state.draft : undefined,
    [conditionId],
  )
  return useConditionDraftSelector(conditions, selector)
}

/** The active add draft targeting the given group. */
export function useConditionAddDraft<
  TDefinition extends AnyConditionsDefinition,
>(
  conditions: ConditionsController<TDefinition>,
  parentId: string,
): ConditionDraft<TDefinition> | undefined {
  const selector = useCallback(
    (state: ConditionDraftState<TDefinition>) =>
      state.draft?.mode === 'add' && state.draft.parentId === parentId
        ? state.draft
        : undefined,
    [parentId],
  )
  return useConditionDraftSelector(conditions, selector)
}

/**
 * `true` while an add draft targets the given group. Unlike
 * `useConditionAddDraft`, this never rerenders on draft edits — use it in
 * group nodes and render the draft chip in a child component.
 */
export function useConditionHasAddDraft(
  conditions: ConditionsController<AnyConditionsDefinition>,
  parentId: string,
): boolean {
  const selector = useCallback(
    (state: ConditionDraftState) =>
      state.draft?.mode === 'add' && state.draft.parentId === parentId,
    [parentId],
  )
  return useConditionDraftSelector(conditions, selector)
}
