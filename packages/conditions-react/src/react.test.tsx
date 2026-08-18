import { useState } from 'react'

import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createConditionQuery } from '@saas-js/conditions'

import { createConditionsHookContexts } from './contexts.tsx'
import { createConditionsHook } from './create-hook.tsx'
import { testDefinition } from './test-fixtures.ts'

const contexts = createConditionsHookContexts()
const hook = createConditionsHook({
  contexts,
  conditionComponents: {
    RegisteredCondition: () => <span>registered</span>,
  },
})

describe('React conditions bindings', () => {
  it('supports uncontrolled state and component subscriptions', () => {
    const onValueChange = vi.fn()
    let conditions!: ReturnType<typeof hook.useConditions>

    function Example() {
      conditions = hook.useConditions({
        definition: testDefinition,
        onValueChange,
      })
      return (
        <conditions.Root>
          <conditions.Subscribe
            selector={(state) => state.value.root.items.length}
          >
            {(count) => <output>{count}</output>}
          </conditions.Subscribe>
          <conditions.RegisteredCondition />
        </conditions.Root>
      )
    }

    render(<Example />)
    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText('registered')).toBeTruthy()
    act(() => {
      conditions.actions.addCondition({ field: 'name', value: 'Ada' })
    })
    expect(screen.getByText('1')).toBeTruthy()
    expect(onValueChange).toHaveBeenCalledOnce()
  })

  it('synchronizes controlled state without callback loops', () => {
    const onValueChange = vi.fn()
    let conditions!: ReturnType<typeof hook.useConditions>
    const initial = createConditionQuery() as any

    function Example() {
      const [value, setValue] = useState(initial)
      conditions = hook.useConditions({
        definition: testDefinition,
        value,
        onValueChange(details) {
          onValueChange(details)
          setValue(details.value)
        },
      })
      return (
        <conditions.Root>
          <conditions.Subscribe
            selector={(state) => state.value.root.items.length}
          >
            {(count) => <output>{count}</output>}
          </conditions.Subscribe>
        </conditions.Root>
      )
    }

    render(<Example />)
    act(() => {
      conditions.actions.addCondition({ field: 'age', value: 42 })
    })
    expect(screen.getByText('1')).toBeTruthy()
    expect(onValueChange).toHaveBeenCalledOnce()
  })

  it('accepts externally created stores', () => {
    const store = testDefinition.createStore()
    let conditions!: ReturnType<typeof hook.useConditions>

    function Example() {
      conditions = hook.useConditions({ store })
      return (
        <conditions.Root>
          <conditions.Subscribe
            selector={(state) => state.value.root.items.length}
          >
            {(count) => <output>{count}</output>}
          </conditions.Subscribe>
        </conditions.Root>
      )
    }

    render(<Example />)
    act(() => {
      store.actions.addCondition({ field: 'status', value: 'active' })
    })
    expect(screen.getByText('1')).toBeTruthy()
    expect(conditions.store).toBe(store)
  })

  it('isolates condition selector rerenders', () => {
    const store = testDefinition.createStore()
    store.actions.addCondition({ id: 'one', field: 'name', value: 'one' })
    store.actions.addCondition({ id: 'two', field: 'name', value: 'two' })
    const renders = { one: 0, two: 0 }
    let conditions!: ReturnType<typeof hook.useConditions>

    function ConditionValue({ id }: { id: 'one' | 'two' }) {
      const value = hook.useConditionSelector(
        conditions,
        id,
        (condition) => condition?.value,
      )
      renders[id] += 1
      return <output>{String(value)}</output>
    }

    function Example() {
      conditions = hook.useConditions({ store })
      return (
        <conditions.Root>
          <ConditionValue id="one" />
          <ConditionValue id="two" />
        </conditions.Root>
      )
    }

    render(<Example />)
    const before = { ...renders }
    act(() => store.actions.updateCondition('one', { value: 'changed' }))
    expect(renders.one).toBe(before.one + 1)
    expect(renders.two).toBe(before.two)
  })

  it('reports provider misuse with a clear error', () => {
    function Misused() {
      hook.useConditionsContext()
      return null
    }
    expect(() => render(<Misused />)).toThrow(
      'useConditionsContext must be used inside a conditions.Root provider.',
    )
  })

  it('reports missing condition and group scopes and binds group UI', () => {
    let conditions!: ReturnType<typeof hook.useConditions>
    const GroupSummary = hook.withConditionGroup({
      render: ({ groupId }) => <output>{groupId}</output>,
    })

    function BoundGroup() {
      conditions = hook.useConditions({ definition: testDefinition })
      return (
        <conditions.Root>
          <conditions.ConditionGroupScope id="root">
            <GroupSummary />
          </conditions.ConditionGroupScope>
        </conditions.Root>
      )
    }
    render(<BoundGroup />)
    expect(screen.getByText('root')).toBeTruthy()

    function MissingConditionScope() {
      const local = hook.useConditions({ definition: testDefinition })
      function Child() {
        hook.useConditionContext()
        return null
      }
      return (
        <local.Root>
          <Child />
        </local.Root>
      )
    }
    expect(() => render(<MissingConditionScope />)).toThrow(
      'useConditionContext must be used inside a conditions.ConditionScope provider.',
    )

    function MissingGroupScope() {
      const local = hook.useConditions({ definition: testDefinition })
      function Child() {
        hook.useConditionGroupContext()
        return null
      }
      return (
        <local.Root>
          <Child />
        </local.Root>
      )
    }
    expect(() => render(<MissingGroupScope />)).toThrow(
      'useConditionGroupContext must be used inside a conditions.ConditionGroupScope provider.',
    )
  })

  it('binds a definition at hook creation', () => {
    const bound = createConditionsHook({ definition: testDefinition })
    let conditions!: ReturnType<typeof bound.useConditions>

    function Example() {
      conditions = bound.useConditions()
      return (
        <conditions.Root>
          <conditions.Subscribe
            selector={(state) => state.value.root.items.length}
          >
            {(count) => <output>{count}</output>}
          </conditions.Subscribe>
        </conditions.Root>
      )
    }

    render(<Example />)
    expect(screen.getByText('0')).toBeTruthy()
    act(() => {
      conditions.actions.addCondition({ field: 'name', value: 'Ada' })
    })
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('rejects registered components that shadow built-in members', () => {
    expect(() =>
      createConditionsHook({
        conditionComponents: { ValueEditor: () => null },
      }),
    ).toThrow('built-in')
  })

  it('keeps derived selections stable with an isEqual function', () => {
    const store = testDefinition.createStore()
    store.actions.addCondition({ id: 'one', field: 'name', value: 'one' })
    let renders = 0
    let conditions!: ReturnType<typeof hook.useConditions>

    function Ids() {
      const ids = hook.useConditionsSelector(
        conditions,
        (state) => state.value.root.items.map((item) => item.id),
        (a, b) => a.join(',') === b.join(','),
      )
      renders += 1
      return <output>{ids.join(',')}</output>
    }

    function Example() {
      conditions = hook.useConditions({ store })
      return (
        <conditions.Root>
          <Ids />
        </conditions.Root>
      )
    }

    render(<Example />)
    const before = renders
    // The derived id list is a fresh array but equal; no rerender expected.
    act(() => store.actions.updateCondition('one', { value: 'changed' }))
    expect(renders).toBe(before)
    act(() =>
      store.actions.addCondition({ id: 'two', field: 'name', value: 'two' }),
    )
    expect(renders).toBe(before + 1)
    expect(screen.getByText('one,two')).toBeTruthy()
  })

  it('filters subjects with the committed query', () => {
    const subjects = [{ name: 'Ada' }, { name: 'Grace' }]
    let conditions!: ReturnType<typeof hook.useConditions>

    function Example() {
      conditions = hook.useConditions({ definition: testDefinition })
      const matches = conditions.useFilter(subjects)
      return <output>{matches.map((subject) => subject.name).join(',')}</output>
    }

    render(<Example />)
    expect(screen.getByText('Ada,Grace')).toBeTruthy()
    act(() => {
      conditions.actions.addCondition({ field: 'name', value: 'Ad' })
    })
    expect(screen.getByText('Ada')).toBeTruthy()
    expect(conditions.filter(subjects)).toEqual([{ name: 'Ada' }])
  })

  it('binds definitions with withConditions and retains extensions', () => {
    const extended = hook.extendConditions({
      conditionComponents: {
        Summary: () => <span>summary</span>,
      },
    })
    const Bound = extended.withConditions({
      definition: testDefinition,
      render: ({ conditions }) => (
        <conditions.Root>
          <conditions.Summary />
          <conditions.Subscribe
            selector={(state) => state.value.root.items.length}
          >
            {(count) => <output>{count}</output>}
          </conditions.Subscribe>
        </conditions.Root>
      ),
    })
    render(<Bound />)
    expect(screen.getByText('summary')).toBeTruthy()
    expect(screen.getByText('0')).toBeTruthy()
  })
})
