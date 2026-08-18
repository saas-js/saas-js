import type { ValueEditorComponent, ValueEditorRegistries, ValueEditorResolverContext } from './types.ts';
/**
 * Resolve an editor in this order: field/operator, field, operator, field
 * type, then fallback. A custom resolver receives that result and may replace it.
 */
export declare function resolveValueEditor(registries: ValueEditorRegistries, context: ValueEditorResolverContext): ValueEditorComponent<any> | undefined;
