import type { ConditionOption } from '@saas-js/conditions';
import type { AnyConditionsDefinition, ConditionsController, DefinitionFieldId } from './types.ts';
export interface UseConditionOptionsOptions<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    field: DefinitionFieldId<TDefinition>;
    /**
     * Current condition value, forwarded to async option sources for context.
     * Changing it does not trigger a refetch; sources receive the latest value
     * when they run.
     */
    value?: unknown;
    initialQuery?: string;
    /** Debounce applied to query-driven refetches of async sources. */
    debounceMs?: number;
}
export interface ConditionOptionsResult<TValue = unknown, TMeta = unknown> {
    options: readonly ConditionOption<TValue, TMeta>[];
    query: string;
    setQuery(query: string): void;
    loading: boolean;
    error: Error | undefined;
    reload(): void;
}
export declare function useConditionOptions<TDefinition extends AnyConditionsDefinition, TValue = unknown, TMeta = unknown>(conditions: ConditionsController<TDefinition>, options: UseConditionOptionsOptions<TDefinition>): ConditionOptionsResult<TValue, TMeta>;
