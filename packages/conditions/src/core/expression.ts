import {
  CONDITION_QUERY_VERSION,
  type Condition,
  type ConditionCombinator,
  type ConditionExpression,
  type ConditionGroup,
  type ConditionQuery,
} from '../types/condition.types.ts'

export class ConditionTreeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConditionTreeError'
  }
}

export const isConditionGroup = <TCondition extends Condition>(
  expression: ConditionExpression<TCondition>,
): expression is ConditionGroup<TCondition> => expression.kind === 'group'

export function createConditionQuery<TCondition extends Condition = Condition>(
  options: {
    id?: string
    combinator?: ConditionCombinator
    items?: ConditionExpression<TCondition>[]
  } = {},
): ConditionQuery<TCondition> {
  return {
    version: CONDITION_QUERY_VERSION,
    root: {
      kind: 'group',
      id: options.id ?? 'root',
      combinator: options.combinator ?? 'and',
      items: options.items ?? [],
    },
  }
}

export function visitConditionExpression<TCondition extends Condition>(
  expression: ConditionExpression<TCondition>,
  visitor: (expression: ConditionExpression<TCondition>) => void,
) {
  visitor(expression)
  if (isConditionGroup(expression)) {
    expression.items.forEach((item) => visitConditionExpression(item, visitor))
  }
}

export interface ConditionQueryFolder<TCondition extends Condition, TResult> {
  /** Map one condition to a result, or return `undefined` to skip it. */
  condition(condition: TCondition): TResult | undefined
  /**
   * Combine the mapped results of a group's items. Skipped items are already
   * filtered out; `results` may be empty when every item was skipped.
   */
  group(
    combinator: ConditionCombinator,
    results: TResult[],
    group: ConditionGroup<TCondition>,
  ): TResult | undefined
}

/**
 * Fold a condition query bottom-up into another representation (a SQL where
 * clause, a predicate, an OData string, …). Conditions map through
 * `folder.condition`; each group combines its mapped items through
 * `folder.group`. Returns `undefined` for an empty query.
 */
export function foldConditionQuery<TCondition extends Condition, TResult>(
  query: ConditionQuery<TCondition> | ConditionGroup<TCondition>,
  folder: ConditionQueryFolder<TCondition, TResult>,
): TResult | undefined {
  const foldExpression = (
    expression: ConditionExpression<TCondition>,
  ): TResult | undefined => {
    if (!isConditionGroup(expression)) return folder.condition(expression)
    const results = expression.items
      .map(foldExpression)
      .filter((result): result is TResult => result !== undefined)
    return folder.group(expression.combinator, results, expression)
  }
  return foldExpression('root' in query ? query.root : query)
}

export function findConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
): ConditionExpression<TCondition> | undefined {
  if (root.id === id) return root
  for (const item of root.items) {
    if (item.id === id) return item
    if (isConditionGroup(item)) {
      const match = findConditionExpression(item, id)
      if (match) return match
    }
  }
}

export function findParentConditionGroup<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
): ConditionGroup<TCondition> | undefined {
  if (root.items.some((item) => item.id === id)) return root
  for (const item of root.items) {
    if (isConditionGroup(item)) {
      const match = findParentConditionGroup(item, id)
      if (match) return match
    }
  }
}

export function flattenConditions<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
): TCondition[] {
  const conditions: TCondition[] = []
  visitConditionExpression(root, (expression) => {
    if (!isConditionGroup(expression)) conditions.push(expression)
  })
  return conditions
}

export function countConditions<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
) {
  return flattenConditions(root).length
}

export function insertConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  parentId: string,
  expression: ConditionExpression<TCondition>,
  index?: number,
): ConditionGroup<TCondition> {
  let inserted = false

  const visit = (
    group: ConditionGroup<TCondition>,
  ): ConditionGroup<TCondition> => {
    if (group.id === parentId) {
      const nextItems = [...group.items]
      nextItems.splice(index ?? nextItems.length, 0, expression)
      inserted = true
      return { ...group, items: nextItems }
    }

    let changed = false
    const items = group.items.map((item) => {
      if (!isConditionGroup(item)) return item
      const next = visit(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...group, items } : group
  }

  const nextRoot = visit(root)
  if (!inserted) {
    throw new ConditionTreeError(`Condition group "${parentId}" was not found.`)
  }
  return nextRoot
}

export function updateConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
  updater: (
    expression: ConditionExpression<TCondition>,
  ) => ConditionExpression<TCondition>,
): ConditionGroup<TCondition> {
  if (root.id === id) {
    const updated = updater(root)
    if (!isConditionGroup(updated)) {
      throw new ConditionTreeError('The root expression must remain a group.')
    }
    return updated
  }

  let found = false
  const visit = (
    group: ConditionGroup<TCondition>,
  ): ConditionGroup<TCondition> => {
    let changed = false
    const items = group.items.map((item) => {
      if (item.id === id) {
        found = true
        changed = true
        return updater(item)
      }
      if (!isConditionGroup(item)) return item
      const next = visit(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...group, items } : group
  }

  const nextRoot = visit(root)
  if (!found) {
    throw new ConditionTreeError(`Condition expression "${id}" was not found.`)
  }
  return nextRoot
}

export function removeConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
): {
  root: ConditionGroup<TCondition>
  expression: ConditionExpression<TCondition>
} {
  if (root.id === id) {
    throw new ConditionTreeError('The root condition group cannot be removed.')
  }

  let removed: ConditionExpression<TCondition> | undefined

  const visit = (
    group: ConditionGroup<TCondition>,
  ): ConditionGroup<TCondition> => {
    const directMatch = group.items.findIndex((item) => item.id === id)
    if (directMatch >= 0) {
      const items = [...group.items]
      removed = items.splice(directMatch, 1)[0]
      return { ...group, items }
    }

    let changed = false
    const items = group.items.map((item) => {
      if (!isConditionGroup(item) || removed) return item
      const next = visit(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...group, items } : group
  }

  const nextRoot = visit(root)
  if (!removed) {
    throw new ConditionTreeError(`Condition expression "${id}" was not found.`)
  }
  return { root: nextRoot, expression: removed }
}

export function moveConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
  parentId: string,
  index?: number,
) {
  const expression = findConditionExpression(root, id)
  if (!expression) {
    throw new ConditionTreeError(`Condition expression "${id}" was not found.`)
  }
  if (
    isConditionGroup(expression) &&
    findConditionExpression(expression, parentId)
  ) {
    throw new ConditionTreeError(
      'A condition group cannot be moved into itself.',
    )
  }

  const removed = removeConditionExpression(root, id)
  return insertConditionExpression(
    removed.root,
    parentId,
    removed.expression,
    index,
  )
}

export function groupConditionExpressions<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  ids: readonly string[],
  group: ConditionGroup<TCondition>,
): ConditionGroup<TCondition> {
  const selectedIds = new Set(ids)
  if (!selectedIds.size) {
    throw new ConditionTreeError(
      'At least one condition expression is required.',
    )
  }

  let grouped = false
  const visit = (
    parent: ConditionGroup<TCondition>,
  ): ConditionGroup<TCondition> => {
    const directMatches = parent.items.filter((item) =>
      selectedIds.has(item.id),
    )
    if (directMatches.length === selectedIds.size) {
      const firstIndex = parent.items.findIndex((item) =>
        selectedIds.has(item.id),
      )
      const items = parent.items.filter((item) => !selectedIds.has(item.id))
      items.splice(firstIndex, 0, { ...group, items: directMatches })
      grouped = true
      return { ...parent, items }
    }

    let changed = false
    const items = parent.items.map((item) => {
      if (!isConditionGroup(item) || grouped) return item
      const next = visit(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...parent, items } : parent
  }

  const nextRoot = visit(root)
  if (!grouped) {
    throw new ConditionTreeError(
      'Grouped condition expressions must share the same parent group.',
    )
  }
  return nextRoot
}

export function ungroupConditionExpression<TCondition extends Condition>(
  root: ConditionGroup<TCondition>,
  id: string,
): ConditionGroup<TCondition> {
  if (root.id === id) {
    throw new ConditionTreeError(
      'The root condition group cannot be ungrouped.',
    )
  }

  let ungrouped = false
  const visit = (
    parent: ConditionGroup<TCondition>,
  ): ConditionGroup<TCondition> => {
    const directIndex = parent.items.findIndex((item) => item.id === id)
    if (directIndex >= 0) {
      const expression = parent.items[directIndex]
      if (!isConditionGroup(expression)) {
        throw new ConditionTreeError(
          `Condition expression "${id}" is not a group.`,
        )
      }
      const items = [...parent.items]
      items.splice(directIndex, 1, ...expression.items)
      ungrouped = true
      return { ...parent, items }
    }

    let changed = false
    const items = parent.items.map((item) => {
      if (!isConditionGroup(item) || ungrouped) return item
      const next = visit(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...parent, items } : parent
  }

  const nextRoot = visit(root)
  if (!ungrouped) {
    throw new ConditionTreeError(`Condition group "${id}" was not found.`)
  }
  return nextRoot
}
