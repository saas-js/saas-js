import type { AnyConditionsDefinition, ConditionsController, ConditionsValueChangeDetails, DefinitionQuery, DefinitionStore } from './types.ts';
export interface CreateConditionsControllerOptions<TDefinition extends AnyConditionsDefinition> {
    definition: TDefinition;
    defaultValue?: DefinitionQuery<TDefinition>;
    onValueChange?: (details: ConditionsValueChangeDetails<TDefinition>) => void;
}
export interface CreateConditionsControllerFromStoreOptions<TDefinition extends AnyConditionsDefinition> {
    store: DefinitionStore<TDefinition>;
}
export declare function createConditionsController<TDefinition extends AnyConditionsDefinition>(options: CreateConditionsControllerOptions<TDefinition> | CreateConditionsControllerFromStoreOptions<TDefinition>): ConditionsController<TDefinition>;
