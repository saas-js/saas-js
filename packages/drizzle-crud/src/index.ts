import { crudFactory } from './crud-factory.ts'
import type {
  Actor,
  CrudOptions,
  DrizzleCrudOptions,
  DrizzleDatabase,
  DrizzleTableWithId,
  FilterParams,
  ScopeFilters,
  ValidationAdapter,
} from './types.ts'

export type * from './types.ts'

export { filtersToWhere } from './filters.ts'

export function drizzleCrud<TDatabase extends DrizzleDatabase>(
  db: TDatabase,
  options: DrizzleCrudOptions<TDatabase> = {},
) {
  return function createCrud<
    T extends DrizzleTableWithId,
    TActor extends Actor = Actor,
    TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
    TFilterInput = FilterParams<T['$inferSelect']>,
  >(
    table: T,
    crudOptions: CrudOptions<
      TDatabase,
      T,
      TActor,
      TScopeFilters,
      TFilterInput
    > = {},
  ) {
    const validation =
      options.validation || crudOptions.validation
        ? ({
            ...options.validation,
            ...crudOptions.validation,
          } as ValidationAdapter<T>)
        : undefined

    return crudFactory(db, table, {
      ...options,
      ...crudOptions,
      validation,
    })
  }
}
