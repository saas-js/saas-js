import type { AnyConditionsDefinition, ConditionsController, ConditionsHookContexts } from './types.ts';
export declare function createConditionsHookContexts(): ConditionsHookContexts;
export declare function useConditionsRootContext<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition>(contexts: ConditionsHookContexts): ConditionsController<TDefinition>;
export declare function useConditionScopeContext(contexts: ConditionsHookContexts): {
    conditions: ConditionsController<AnyConditionsDefinition>;
    id: string;
};
export declare function useConditionGroupScopeContext(contexts: ConditionsHookContexts): {
    conditions: ConditionsController<AnyConditionsDefinition>;
    id: string;
};
