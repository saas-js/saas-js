import { createContext, useContext } from 'react'

import type {
  AnyConditionsDefinition,
  ConditionsController,
  ConditionsHookContexts,
} from './types.ts'

export function createConditionsHookContexts(): ConditionsHookContexts {
  const RootContext = createContext<ConditionsController | null>(null)
  const ConditionContext = createContext<string | null>(null)
  const GroupContext = createContext<string | null>(null)

  RootContext.displayName = 'ConditionsRootContext'
  ConditionContext.displayName = 'ConditionContext'
  GroupContext.displayName = 'ConditionGroupContext'

  return { RootContext, ConditionContext, GroupContext }
}

export function useConditionsRootContext<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
>(contexts: ConditionsHookContexts): ConditionsController<TDefinition> {
  const controller = useContext(contexts.RootContext)
  if (!controller) {
    throw new Error(
      'useConditionsContext must be used inside a conditions.Root provider.',
    )
  }
  return controller as ConditionsController<TDefinition>
}

export function useConditionScopeContext(contexts: ConditionsHookContexts) {
  const conditions = useConditionsRootContext(contexts)
  const id = useContext(contexts.ConditionContext)
  if (!id) {
    throw new Error(
      'useConditionContext must be used inside a conditions.ConditionScope provider.',
    )
  }
  return { conditions, id }
}

export function useConditionGroupScopeContext(
  contexts: ConditionsHookContexts,
) {
  const conditions = useConditionsRootContext(contexts)
  const id = useContext(contexts.GroupContext)
  if (!id) {
    throw new Error(
      'useConditionGroupContext must be used inside a conditions.ConditionGroupScope provider.',
    )
  }
  return { conditions, id }
}
