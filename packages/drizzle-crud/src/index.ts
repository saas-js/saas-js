import { crudFactory } from './crud-factory.ts'
import type {
  Actor,
  CrudOptions,
  DrizzleCrudOptions,
  DrizzleDatabase,
  DrizzleTableWithId,
  ScopeFilters,
  ValidationAdapter,
} from './types.ts'

export type * from './types.ts'

export { parseFilters, parseFilterGroup } from './filters.ts'

export function drizzleCrud<TDatabase extends DrizzleDatabase>(
  db: TDatabase,
  options: DrizzleCrudOptions<TDatabase> = {},
) {
  return function createCrud<
    T extends DrizzleTableWithId,
    TActor extends Actor = Actor,
    TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
  >(
    table: T,
    crudOptions: CrudOptions<TDatabase, T, TActor, TScopeFilters> = {},
  ) {
    const validation = {
      ...options.validation,
      ...crudOptions.validation,
    } as ValidationAdapter<T>

    return crudFactory(db, table, {
      ...options,
      validation,
    })
  }
}
