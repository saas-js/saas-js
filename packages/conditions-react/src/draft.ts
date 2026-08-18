import {
  type Condition,
  type ConditionGroup,
  type ConditionValidationIssue,
  createConditionQuery,
  findConditionExpression,
  getConditionFieldOperators,
  getConditionOperator,
  isConditionGroup,
} from '@saas-js/conditions'

import type {
  AnyConditionsDefinition,
  DefinitionFieldId,
  DefinitionOperatorId,
  DefinitionStore,
} from './types.ts'

export type ConditionDraftMode = 'add' | 'edit'

export interface ConditionDraft<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  mode: ConditionDraftMode
  /** Target group for `add` drafts. Absent while editing an existing condition. */
  parentId?: string
  index?: number
  conditionId?: string
  field?: DefinitionFieldId<TDefinition>
  operator?: DefinitionOperatorId<TDefinition>
  value?: unknown
  errors: readonly ConditionValidationIssue[]
}

export interface ConditionDraftState<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  draft?: ConditionDraft<TDefinition>
}

export interface BeginAddConditionOptions<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  parentId?: string
  index?: number
  field?: DefinitionFieldId<TDefinition>
  operator?: DefinitionOperatorId<TDefinition>
  value?: unknown
}

export interface ConditionDraftPatch<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  field?: DefinitionFieldId<TDefinition>
  operator?: DefinitionOperatorId<TDefinition>
  value?: unknown
}

export interface ConditionDraftValidation {
  valid: boolean
  issues: readonly ConditionValidationIssue[]
}

export interface ConditionDraftController<
  TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition,
> {
  get(): ConditionDraftState<TDefinition>
  subscribe(listener: () => void): () => void
  beginAddCondition(options?: BeginAddConditionOptions<TDefinition>): void
  beginEditCondition(id: string): void
  updateDraft(patch: ConditionDraftPatch<TDefinition>): void
  validateDraft(): ConditionDraftValidation
  /**
   * Validate and commit the draft, optionally applying a final patch first.
   * Returns the committed condition id, or `undefined` when validation failed.
   */
  commitDraft(patch?: ConditionDraftPatch<TDefinition>): string | undefined
  cancelDraft(): void
}

export function createConditionDraftController<
  TDefinition extends AnyConditionsDefinition,
>(
  definition: TDefinition,
  store: DefinitionStore<TDefinition>,
): ConditionDraftController<TDefinition> {
  let state: ConditionDraftState<TDefinition> = {}
  const listeners = new Set<() => void>()

  const setState = (next: ConditionDraftState<TDefinition>) => {
    if (next === state) return
    state = next
    listeners.forEach((listener) => listener())
  }

  const normalizePatch = (
    current: ConditionDraft<TDefinition>,
    patch: ConditionDraftPatch<TDefinition>,
  ): ConditionDraft<TDefinition> => {
    const next: ConditionDraft<TDefinition> = {
      ...current,
      ...patch,
      errors: [],
    }

    if (patch.field !== undefined && patch.field !== current.field) {
      const field = definition.fields[patch.field]
      if (field) {
        const operators = getConditionFieldOperators(definition, field)
        next.operator = field.defaultOperator ?? operators[0]?.id
        next.value = field.defaultValue
      } else {
        next.operator = undefined
        next.value = undefined
      }
    }

    if (patch.operator !== undefined && patch.operator !== current.operator) {
      const operator = getConditionOperator(definition, patch.operator)
      if (operator?.valueMode === 'none') next.value = undefined
      if (operator?.valueMode === 'multiple' && !Array.isArray(next.value)) {
        next.value = []
      }
      if (
        operator?.valueMode === 'range' &&
        (!Array.isArray(next.value) || next.value.length !== 2)
      ) {
        next.value = undefined
      }
      if (operator?.valueMode === 'single' && Array.isArray(next.value)) {
        next.value = undefined
      }
    }

    return next
  }

  const inspect = (draft: ConditionDraft<TDefinition>) => {
    const condition = {
      kind: 'condition',
      id: draft.conditionId ?? '__conditions-react-draft__',
      field: draft.field ?? '',
      operator: draft.operator ?? '',
      ...(Object.prototype.hasOwnProperty.call(draft, 'value')
        ? { value: draft.value }
        : {}),
    } as Condition
    const query = createConditionQuery({ items: [condition] })
    const result = definition.validate(query)
    let normalized: Condition | undefined
    if (result.valid) {
      normalized = definition.assert(query).root.items[0] as Condition
    }
    return { result, normalized }
  }

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    beginAddCondition(options = {}) {
      const rootId = store.get().value.root.id
      let draft: ConditionDraft<TDefinition> = {
        mode: 'add',
        parentId: options.parentId ?? rootId,
        index: options.index,
        errors: [],
      }
      if (options.field) draft = normalizePatch(draft, { field: options.field })
      if (options.operator) {
        draft = normalizePatch(draft, { operator: options.operator })
      }
      if (Object.prototype.hasOwnProperty.call(options, 'value')) {
        draft = normalizePatch(draft, { value: options.value })
      }
      setState({ draft })
    },
    beginEditCondition(id) {
      const expression = findConditionExpression(store.get().value.root, id) as
        | Condition
        | ConditionGroup
        | undefined
      if (!expression) throw new Error(`Condition "${id}" was not found.`)
      if (isConditionGroup(expression)) {
        throw new Error(`Condition expression "${id}" is a group.`)
      }
      setState({
        draft: {
          mode: 'edit',
          conditionId: id,
          field: expression.field as DefinitionFieldId<TDefinition>,
          operator: expression.operator as DefinitionOperatorId<TDefinition>,
          value: expression.value,
          errors: [],
        },
      })
    },
    updateDraft(patch) {
      if (!state.draft) {
        throw new Error('No condition draft is active.')
      }
      setState({ draft: normalizePatch(state.draft, patch) })
    },
    validateDraft() {
      if (!state.draft) return { valid: false, issues: [] }
      const { result } = inspect(state.draft)
      setState({ draft: { ...state.draft, errors: result.issues } })
      return { valid: result.valid, issues: result.issues }
    },
    commitDraft(patch) {
      let draft = state.draft
      if (!draft) return undefined
      if (patch) {
        draft = normalizePatch(draft, patch)
      }
      const { result, normalized } = inspect(draft)
      if (!result.valid || !normalized) {
        setState({ draft: { ...draft, errors: result.issues } })
        return undefined
      }

      let id: string
      if (draft.mode === 'edit' && draft.conditionId) {
        store.actions.updateCondition(draft.conditionId, {
          field: normalized.field,
          operator: normalized.operator,
          ...(normalized.value === undefined
            ? { value: undefined }
            : { value: normalized.value }),
        })
        id = draft.conditionId
      } else {
        id = store.actions.addCondition(
          {
            field: normalized.field,
            operator: normalized.operator,
            ...(normalized.value === undefined
              ? {}
              : { value: normalized.value }),
          } as any,
          { parentId: draft.parentId, index: draft.index },
        )
      }
      setState({})
      return id
    },
    cancelDraft() {
      setState({})
    },
  }
}
