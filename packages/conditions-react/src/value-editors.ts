import type {
  ValueEditorComponent,
  ValueEditorRegistries,
  ValueEditorResolverContext,
} from './types.ts'

/**
 * Resolve an editor in this order: field/operator, field, operator, field
 * type, then fallback. A custom resolver receives that result and may replace it.
 */
export function resolveValueEditor(
  registries: ValueEditorRegistries,
  context: ValueEditorResolverContext,
): ValueEditorComponent<any> | undefined {
  const key = `${context.fieldId}:${context.operator.id}`
  const resolved =
    registries.fieldOperatorValueEditors?.[key] ??
    registries.fieldValueEditors?.[context.fieldId] ??
    registries.operatorValueEditors?.[context.operator.id] ??
    registries.valueEditors?.[context.field.type] ??
    registries.fallbackValueEditor

  return registries.resolveValueEditor?.(context, resolved) ?? resolved
}
