import { createConditionDraftController } from './draft.ts'
import type {
  AnyConditionsDefinition,
  ConditionsController,
  ConditionsValueChangeDetails,
  DefinitionQuery,
  DefinitionStore,
} from './types.ts'

export interface CreateConditionsControllerOptions<
  TDefinition extends AnyConditionsDefinition,
> {
  definition: TDefinition
  defaultValue?: DefinitionQuery<TDefinition>
  onValueChange?: (details: ConditionsValueChangeDetails<TDefinition>) => void
}

export interface CreateConditionsControllerFromStoreOptions<
  TDefinition extends AnyConditionsDefinition,
> {
  store: DefinitionStore<TDefinition>
}

export function createConditionsController<
  TDefinition extends AnyConditionsDefinition,
>(
  options:
    | CreateConditionsControllerOptions<TDefinition>
    | CreateConditionsControllerFromStoreOptions<TDefinition>,
): ConditionsController<TDefinition> {
  const store = (
    'store' in options
      ? options.store
      : options.definition.createStore({
          initialValue: options.defaultValue,
          onValueChange: options.onValueChange,
        })
  ) as DefinitionStore<TDefinition>

  const definition = store.definition as TDefinition
  return {
    definition,
    store,
    actions: store.actions,
    draft: createConditionDraftController(definition, store),
    filter: (subjects) => definition.filter(store.get().value, subjects),
  }
}
