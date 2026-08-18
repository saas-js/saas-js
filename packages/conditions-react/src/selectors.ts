import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import {
  type ConditionGroup,
  findConditionExpression,
  isConditionGroup,
} from '@saas-js/conditions'

import type { ConditionDraftState } from './draft.ts'
import type {
  AnyConditionsDefinition,
  ConditionsController,
  DefinitionCondition,
  DefinitionState,
} from './types.ts'

export type SelectorEquality<TSelected> = (
  a: TSelected,
  b: TSelected,
) => boolean

/**
 * `useSyncExternalStore` with selector memoization. When the selector derives
 * a fresh object, an `isEqual` function keeps the previous reference (and
 * skips the rerender) as long as the selected data is equal.
 */
function useStoreSelector<TState, TSelected>(
  subscribe: (notify: () => void) => () => void,
  getState: () => TState,
  selector: (state: TState) => TSelected,
  isEqual?: SelectorEquality<TSelected>,
): TSelected {
  const committed = useRef<{ hasValue: boolean; value?: TSelected }>({
    hasValue: false,
  })

  const getSelection = useMemo(() => {
    let hasMemo = false
    let memoizedState: TState
    let memoizedSelection: TSelected

    return () => {
      const nextState = getState()
      if (!hasMemo) {
        hasMemo = true
        memoizedState = nextState
        let nextSelection = selector(nextState)
        // Reuse the selection committed by a previous selector identity when
        // the selected data is still equal, so inline selectors stay stable.
        if (isEqual && committed.current.hasValue) {
          const previous = committed.current.value as TSelected
          if (isEqual(previous, nextSelection)) {
            nextSelection = previous
          }
        }
        memoizedSelection = nextSelection
        return nextSelection
      }

      if (Object.is(memoizedState, nextState)) return memoizedSelection

      const nextSelection = selector(nextState)
      if (
        isEqual
          ? isEqual(memoizedSelection, nextSelection)
          : Object.is(memoizedSelection, nextSelection)
      ) {
        memoizedState = nextState
        return memoizedSelection
      }

      memoizedState = nextState
      memoizedSelection = nextSelection
      return nextSelection
    }
  }, [getState, selector, isEqual])

  const selection = useSyncExternalStore(subscribe, getSelection, getSelection)

  useEffect(() => {
    committed.current.hasValue = true
    committed.current.value = selection
  }, [selection])

  return selection
}

export function useConditionsSelector<
  TDefinition extends AnyConditionsDefinition,
  TSelected,
>(
  conditions: ConditionsController<TDefinition>,
  selector: (state: DefinitionState<TDefinition>) => TSelected,
  isEqual?: SelectorEquality<TSelected>,
): TSelected {
  const subscribe = useCallback(
    (notify: () => void) => {
      const subscription = conditions.store.subscribe(() => notify())
      return () => subscription.unsubscribe()
    },
    [conditions.store],
  )
  const getState = useCallback(
    () => conditions.store.get(),
    [conditions.store],
  )
  return useStoreSelector(subscribe, getState, selector, isEqual)
}

export function useConditionDraftSelector<
  TDefinition extends AnyConditionsDefinition,
  TSelected,
>(
  conditions: ConditionsController<TDefinition>,
  selector: (state: ConditionDraftState<TDefinition>) => TSelected,
  isEqual?: SelectorEquality<TSelected>,
): TSelected {
  const subscribe = useCallback(
    (notify: () => void) => conditions.draft.subscribe(notify),
    [conditions.draft],
  )
  const getState = useCallback(
    () => conditions.draft.get(),
    [conditions.draft],
  )
  return useStoreSelector(subscribe, getState, selector, isEqual)
}

/**
 * Filter subjects with the committed query, resubscribing on query changes.
 * The result is memoized against the query and the `subjects` reference.
 */
export function useConditionsFilter<
  TDefinition extends AnyConditionsDefinition,
  TSubject,
>(
  conditions: ConditionsController<TDefinition>,
  subjects: readonly TSubject[],
): TSubject[] {
  const query = useConditionsSelector(conditions, (state) => state.value)
  return useMemo(
    () => conditions.definition.filter(query, subjects),
    [conditions.definition, query, subjects],
  )
}

export function useConditionSelector<
  TDefinition extends AnyConditionsDefinition,
  TSelected,
>(
  conditions: ConditionsController<TDefinition>,
  id: string,
  selector: (
    condition: DefinitionCondition<TDefinition> | undefined,
  ) => TSelected,
  isEqual?: SelectorEquality<TSelected>,
): TSelected {
  const conditionSelector = useCallback(
    (state: DefinitionState<TDefinition>) => {
      const expression = findConditionExpression(state.value.root, id)
      return selector(
        expression && !isConditionGroup(expression)
          ? (expression as DefinitionCondition<TDefinition>)
          : undefined,
      )
    },
    [id, selector],
  )
  return useConditionsSelector(conditions, conditionSelector, isEqual)
}

export function useConditionGroupSelector<
  TDefinition extends AnyConditionsDefinition,
  TSelected,
>(
  conditions: ConditionsController<TDefinition>,
  id: string,
  selector: (
    group: ConditionGroup<DefinitionCondition<TDefinition>> | undefined,
  ) => TSelected,
  isEqual?: SelectorEquality<TSelected>,
): TSelected {
  const groupSelector = useCallback(
    (state: DefinitionState<TDefinition>) => {
      const expression = findConditionExpression(state.value.root, id)
      return selector(
        expression && isConditionGroup(expression)
          ? (expression as ConditionGroup<DefinitionCondition<TDefinition>>)
          : undefined,
      )
    },
    [id, selector],
  )
  return useConditionsSelector(conditions, groupSelector, isEqual)
}
