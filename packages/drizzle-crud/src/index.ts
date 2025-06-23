import type { PgDatabase } from 'drizzle-orm/pg-core'

import {
  type Actor,
  type CrudOptions,
  type PgTableWithId,
  type ScopeFilters,
  crudFactory,
} from './crud-factory.ts'

export type {
  CrudOperation,
  CrudOptions,
  ListParams,
  FindByIdParams,
  Actor,
  ScopeFilters,
  OperationContext,
  FilterOperator,
  FilterValue,
  SoftDeleteConfig,
} from './crud-factory.ts'

export function drizzleCrud<TDatabase extends PgDatabase<any, any, any>>(
  db: TDatabase,
) {
  return function createCrud<
    T extends PgTableWithId,
    TActor extends Actor = Actor,
    TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
  >(table: T, options: CrudOptions<TDatabase, T, TActor, TScopeFilters> = {}) {
    return crudFactory(db, table, options)
  }
}
