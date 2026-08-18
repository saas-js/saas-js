import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createConditionsHook } from './create-hook.tsx'
import { testDefinition } from './test-fixtures.ts'

const hook = createConditionsHook({ definition: testDefinition })

describe('common data hooks', () => {
  it('serves committed data through instance hooks', () => {
    let conditions!: ReturnType<typeof hook.useConditions>
    const observed: Record<string, unknown> = {}

    function Example() {
      conditions = hook.useConditions()
      Object.assign(observed, {
        value: conditions.useValue(),
        root: conditions.useRoot(),
        isEmpty: conditions.useIsEmpty(),
        condition: conditions.useCondition('one'),
        group: conditions.useGroup('nested'),
      })
      return null
    }

    render(<Example />)
    expect(observed.isEmpty).toBe(true)
    expect(observed.condition).toBeUndefined()

    act(() => {
      conditions.actions.addCondition({ id: 'one', field: 'name', value: 'A' })
      conditions.actions.addGroup({ id: 'nested', combinator: 'or' })
    })
    expect(observed.isEmpty).toBe(false)
    expect(observed.condition).toMatchObject({ field: 'name', value: 'A' })
    expect(observed.group).toMatchObject({ kind: 'group', combinator: 'or' })
    expect(observed.value).toBe(conditions.store.get().value)
    expect(observed.root).toBe(conditions.store.get().value.root)
  })

  it('scopes draft hooks to their chip', () => {
    const store = testDefinition.createStore()
    const rootId = store.get().value.root.id
    let conditions!: ReturnType<typeof hook.useConditions>
    const observed: Record<string, unknown> = {}

    function Example() {
      conditions = hook.useConditions({ store })
      Object.assign(observed, {
        draft: conditions.useDraft(),
        addDraft: conditions.useAddDraft(rootId),
        addDraftElsewhere: conditions.useAddDraft('other-group'),
        hasAddDraft: conditions.useHasAddDraft(rootId),
        editDraft: conditions.useEditDraft('one'),
      })
      return null
    }

    render(<Example />)
    expect(observed.draft).toBeUndefined()
    expect(observed.hasAddDraft).toBe(false)

    act(() => conditions.draft.beginAddCondition({ field: 'name' }))
    expect(observed.hasAddDraft).toBe(true)
    expect(observed.addDraft).toMatchObject({ mode: 'add', field: 'name' })
    expect(observed.addDraftElsewhere).toBeUndefined()

    act(() => {
      conditions.draft.cancelDraft()
      conditions.actions.addCondition({ id: 'one', field: 'name', value: 'A' })
      conditions.draft.beginEditCondition('one')
    })
    expect(observed.hasAddDraft).toBe(false)
    expect(observed.editDraft).toMatchObject({
      mode: 'edit',
      conditionId: 'one',
    })
  })
})
