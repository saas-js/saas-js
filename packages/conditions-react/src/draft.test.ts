import { describe, expect, it } from 'vitest'

import { createConditionsController } from './controller.ts'
import { testDefinition } from './test-fixtures.ts'

describe('condition drafts', () => {
  it('keeps incomplete additions out of the committed query', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })

    conditions.draft.beginAddCondition()
    expect(conditions.store.get().value.root.items).toEqual([])
    expect(conditions.draft.commitDraft()).toBeUndefined()
    expect(conditions.draft.get().draft?.errors[0]?.code).toBe('unknown_field')

    conditions.draft.updateDraft({ field: 'name' })
    conditions.draft.updateDraft({ value: 'Ada' })
    const id = conditions.draft.commitDraft()

    expect(id).toBeTypeOf('string')
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      field: 'name',
      operator: 'contains',
      value: 'Ada',
    })
    expect(conditions.draft.get().draft).toBeUndefined()
  })

  it('cancels additions and edits without changing committed values', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    const id = conditions.actions.addCondition({
      field: 'name',
      value: 'before',
    })

    conditions.draft.beginEditCondition(id)
    conditions.draft.updateDraft({ value: 'after' })
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      value: 'before',
    })
    conditions.draft.cancelDraft()
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      value: 'before',
    })
  })

  it('validates and atomically commits edits', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    const id = conditions.actions.addCondition({ field: 'age', value: 20 })

    conditions.draft.beginEditCondition(id)
    conditions.draft.updateDraft({ value: -1 })
    expect(conditions.draft.validateDraft().valid).toBe(false)
    expect(conditions.draft.commitDraft()).toBeUndefined()
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      value: 20,
    })

    conditions.draft.updateDraft({ value: '42' })
    expect(conditions.draft.commitDraft()).toBe(id)
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      value: 42,
    })
  })

  it('normalizes none, single, multiple, and range modes', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })

    conditions.draft.beginAddCondition({
      field: 'name',
      value: 'discard me',
    })
    conditions.draft.updateDraft({ operator: 'isNull' })
    expect(conditions.draft.get().draft?.value).toBeUndefined()
    expect(conditions.draft.commitDraft()).toBeTypeOf('string')

    conditions.draft.beginAddCondition({ field: 'status' })
    conditions.draft.updateDraft({ operator: 'in' })
    expect(conditions.draft.get().draft?.value).toEqual([])
    conditions.draft.updateDraft({ value: ['active', 'paused'] })
    expect(conditions.draft.commitDraft()).toBeTypeOf('string')

    conditions.draft.beginAddCondition({ field: 'age' })
    conditions.draft.updateDraft({ operator: 'between' })
    expect(conditions.draft.get().draft?.value).toBeUndefined()
    conditions.draft.updateDraft({ value: [18, 65] })
    expect(conditions.draft.commitDraft()).toBeTypeOf('string')

    conditions.draft.beginEditCondition(
      conditions.store.get().value.root.items[1]!.id,
    )
    conditions.draft.updateDraft({ operator: 'equals' })
    expect(conditions.draft.get().draft?.value).toBeUndefined()
  })

  it('supports nested AND/OR groups while drafts target a group', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    const groupId = conditions.actions.addGroup({
      id: 'nested',
      combinator: 'or',
    })
    conditions.draft.beginAddCondition({ parentId: groupId, field: 'name' })
    conditions.draft.updateDraft({ value: 'Ada' })
    conditions.draft.commitDraft()

    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      kind: 'group',
      combinator: 'or',
      items: [{ field: 'name', value: 'Ada' }],
    })
  })

  it('applies a final patch while committing', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })

    conditions.draft.beginAddCondition({ field: 'name' })
    const id = conditions.draft.commitDraft({ value: 'Ada' })
    expect(id).toBeTypeOf('string')
    expect(conditions.store.get().value.root.items[0]).toMatchObject({
      field: 'name',
      operator: 'contains',
      value: 'Ada',
    })

    conditions.draft.beginAddCondition({ field: 'age' })
    expect(conditions.draft.commitDraft({ value: -1 })).toBeUndefined()
    expect(conditions.draft.get().draft?.value).toBe(-1)
    expect(conditions.draft.get().draft?.errors.length).toBeGreaterThan(0)
  })

  it('round-trips committed draft output through the definition serializer', () => {
    const conditions = createConditionsController({
      definition: testDefinition,
    })
    conditions.draft.beginAddCondition({
      field: 'status',
      operator: 'in',
      value: ['active', 'paused'],
    })
    conditions.draft.commitDraft()

    const serialized = conditions.store.serialize()
    expect(testDefinition.parse(serialized)).toEqual(
      conditions.store.get().value,
    )
  })
})
