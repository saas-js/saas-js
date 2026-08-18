import type { FC } from 'react'

import { describe, expect, it } from 'vitest'

import { testDefinition } from './test-fixtures.ts'
import type { ValueEditorProps } from './types.ts'
import { resolveValueEditor } from './value-editors.ts'

const TypeEditor: FC<ValueEditorProps> = () => null
const OperatorEditor: FC<ValueEditorProps> = () => null
const FieldEditor: FC<ValueEditorProps> = () => null
const CombinationEditor: FC<ValueEditorProps> = () => null
const FallbackEditor: FC<ValueEditorProps> = () => null
const CustomEditor: FC<ValueEditorProps> = () => null

const context = {
  fieldId: 'name',
  field: testDefinition.fields.name,
  operator: testDefinition.operators.find(
    (operator) => operator.id === 'contains',
  )!,
}

describe('value editor resolution', () => {
  it('uses combination, field, operator, type, and fallback precedence', () => {
    const base = {
      valueEditors: { string: TypeEditor },
      operatorValueEditors: { contains: OperatorEditor },
      fieldValueEditors: { name: FieldEditor },
      fieldOperatorValueEditors: { 'name:contains': CombinationEditor },
      fallbackValueEditor: FallbackEditor,
    }
    expect(resolveValueEditor(base, context)).toBe(CombinationEditor)
    expect(
      resolveValueEditor(
        { ...base, fieldOperatorValueEditors: undefined },
        context,
      ),
    ).toBe(FieldEditor)
    expect(
      resolveValueEditor(
        {
          ...base,
          fieldOperatorValueEditors: undefined,
          fieldValueEditors: undefined,
        },
        context,
      ),
    ).toBe(OperatorEditor)
    expect(
      resolveValueEditor(
        {
          valueEditors: base.valueEditors,
          fallbackValueEditor: FallbackEditor,
        },
        context,
      ),
    ).toBe(TypeEditor)
    expect(
      resolveValueEditor({ fallbackValueEditor: FallbackEditor }, context),
    ).toBe(FallbackEditor)
  })

  it('allows a final custom resolver to replace the registered editor', () => {
    expect(
      resolveValueEditor(
        {
          valueEditors: { string: TypeEditor },
          resolveValueEditor: (_context, resolved) =>
            resolved === TypeEditor ? CustomEditor : resolved,
        },
        context,
      ),
    ).toBe(CustomEditor)
  })
})
