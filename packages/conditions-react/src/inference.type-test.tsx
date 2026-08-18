import type { FC } from 'react'

import { z } from 'zod'

import {
  type ConditionForDefinition,
  defaultOperators,
  defineConditions,
  defineOperator,
} from '@saas-js/conditions'

import { createConditionsHookContexts } from './contexts.tsx'
import { createConditionsHook } from './create-hook.tsx'
import type { ValueEditorProps } from './types.ts'

const matches = defineOperator({
  id: 'matches',
  label: 'matches',
  types: ['string'],
  valueMode: 'single',
  subjectSchema: z.string(),
  valueSchema: z.object({
    pattern: z.string(),
    flags: z.string().default('i'),
  }),
  comparator(actual, expected) {
    return new RegExp(expected.pattern, expected.flags).test(actual)
  },
})

const definition = defineConditions({
  operators: [...defaultOperators, matches],
  fields: {
    name: {
      type: 'string',
      schema: z.string(),
      operators: ['equals', 'matches'],
      defaultOperator: 'matches',
    },
    age: {
      type: 'number',
      schema: z.number(),
      operators: ['equals', 'between'],
    },
  },
})

const Editor: FC<ValueEditorProps<string>> = () => null
const Summary = () => null
const hook = createConditionsHook({
  contexts: createConditionsHookContexts(),
  valueEditors: { string: Editor },
  conditionComponents: { Summary },
})

function InferredConsumer() {
  const conditions = hook.useConditions({ definition })
  conditions.actions.addCondition({
    field: 'name',
    value: { pattern: '^Ada' },
  })
  conditions.actions.addCondition({
    field: 'age',
    operator: 'between',
    value: [18, 65],
  })

  // @ts-expect-error unknown field
  conditions.actions.addCondition({ field: 'missing', value: 'x' })
  // @ts-expect-error matches has a structured value schema
  conditions.actions.addCondition({ field: 'name', value: 'Ada' })
  // @ts-expect-error between requires a tuple of field values
  conditions.actions.addCondition({
    field: 'age',
    operator: 'between',
    value: 18,
  })
  // @ts-expect-error string operators are unavailable for number fields
  conditions.actions.addCondition({
    field: 'age',
    operator: 'contains',
    value: 18,
  })

  return (
    <conditions.Root>
      <conditions.Summary />
    </conditions.Root>
  )
}

const boundHook = createConditionsHook({ definition })

function BoundConsumer() {
  // No definition or generics needed: bound at hook creation.
  const conditions = boundHook.useConditions()
  conditions.actions.addCondition({
    field: 'age',
    operator: 'between',
    value: [18, 65],
  })
  // @ts-expect-error unknown fields are rejected on the bound hook
  conditions.actions.addCondition({ field: 'missing', value: 'x' })

  conditions.draft.updateDraft({ field: 'name' })
  // @ts-expect-error draft patches only accept known fields
  conditions.draft.updateDraft({ field: 'missing' })

  return null
}

function BoundContextConsumer() {
  // Context hooks are typed without generic annotations.
  const conditions = boundHook.useConditionsContext()
  conditions.actions.addCondition({ field: 'name', value: { pattern: 'x' } })
  // @ts-expect-error unknown fields are rejected via context too
  conditions.actions.addCondition({ field: 'missing', value: 'x' })
  return null
}

void BoundConsumer
void BoundContextConsumer

const extended = hook.extendConditions({
  valueEditors: { currency: Editor },
  conditionComponents: { Badge: Summary },
})

function ExtendedConsumer() {
  const conditions = extended.useConditions({ definition })
  return <conditions.Badge />
}

// @ts-expect-error duplicate editor registrations are rejected
hook.extendConditions({ valueEditors: { string: Editor } })
// @ts-expect-error duplicate component registrations are rejected
hook.extendConditions({ conditionComponents: { Summary } })

type InferredCondition = ConditionForDefinition<typeof definition>
const validCustomCondition: InferredCondition = {
  kind: 'condition',
  id: 'name',
  field: 'name',
  operator: 'matches',
  value: { pattern: 'Ada', flags: 'i' },
}

void InferredConsumer
void ExtendedConsumer
void validCustomCondition
