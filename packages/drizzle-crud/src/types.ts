import type {
  Column as DrizzleColumn,
  Table as DrizzleTable,
  SQL,
} from 'drizzle-orm'
import type { PgAsyncDatabase, PgTable } from 'drizzle-orm/pg-core'

import type { StandardSchemaV1 } from './standard-schema.ts'

/**
 * Any Postgres database instance. Relational operations (`findById`, `list`)
 * require the db to be created with `relations` (drizzle 1.0 RQB v2):
 * `drizzle(client, { relations: defineRelations(schema) })`.
 */
export type DrizzleDatabase = PgAsyncDatabase<any, any>

export type { DrizzleTable, DrizzleColumn }

/**
 * A table carrying its inferred models. drizzle 1.0 declares
 * `$inferSelect`/`$inferInsert` on concrete tables only, so generic helpers
 * constrain to this instead of the bare `Table` type.
 */
export type DrizzleTableWithModels = DrizzleTable & {
  $inferSelect: Record<string, any>
  $inferInsert: Record<string, any>
}

export type DrizzleTableWithId = PgTable & {
  id: DrizzleColumn
  // drizzle 1.0 moved $inferSelect/$inferInsert off the base Table type onto
  // concrete tables; declare them structurally so generics can index them.
  $inferSelect: Record<string, any> & { id: any }
  $inferInsert: Record<string, any>
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'like'
  | 'ilike'

export type FilterValue<T> =
  | T
  | {
      op: FilterOperator
      value: T | T[]
    }

export type ColumnsSelection<T extends DrizzleTableWithId> = Partial<
  Record<keyof T['$inferSelect'], boolean>
>

type WithRelations<T extends DrizzleTableWithId> = Record<
  string,
  true | { columns?: ColumnsSelection<T>; with?: WithRelations<T> }
>

export type SoftDeleteConfig<T extends DrizzleTableWithModels> = {
  field: keyof T['$inferSelect'] // e.g., 'deletedAt' or 'isDeleted'
  deletedValue?: any // What to set when soft deleting (defaults to new Date() for timestamps, true for booleans)
  notDeletedValue?: any // What represents "not deleted" (defaults to null for timestamps, false for booleans)
}

export type DrizzleCrudOptions<TDatabase extends DrizzleDatabase> = {
  validation?: ValidationAdapter
}

export type CrudOperation =
  | 'create'
  | 'update'
  | 'findById'
  | 'list'
  | 'deleteOne'
  | 'restore'
  | 'permanentDelete'
  | 'bulkCreate'
  | 'bulkDelete'
  | 'bulkRestore'

export interface FilterFnContext<
  T extends DrizzleTableWithId = DrizzleTableWithId,
> {
  table: T
  /** The crud's `allowedFilters` allowlist; empty when unrestricted. */
  allowedFilters: (keyof T['$inferSelect'])[]
}

/**
 * A pluggable filter for the `list` operation: converts the `filters`
 * parameter into a where clause. The input type of the configured `filterFn`
 * becomes the type of `list({ filters })`, so the filter language is defined
 * by the adapter — e.g. `conditionsCrudFilter` from
 * `@saas-js/conditions-drizzle` accepts serialized condition queries.
 * Implementations must treat the input as untrusted and validate it.
 */
export type FilterFn<
  T extends DrizzleTableWithId = DrizzleTableWithId,
  TInput = unknown,
> = (input: TInput, context: FilterFnContext<T>) => SQL | undefined

export type CrudOptions<
  TDatabase extends DrizzleDatabase,
  T extends DrizzleTableWithId,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
  TFilterInput = FilterParams<T['$inferSelect']>,
> = {
  searchFields?: (keyof T['$inferSelect'])[]
  /**
   * The default limit of items returned.
   * @default 20
   */
  defaultLimit?: number
  /**
   * The max limit of items returned.
   * @default 100
   */
  maxLimit?: number
  /**
   * The allowed fields to be used in the filters parameter.
   * e.g., ['name', 'email']
   */
  allowedFilters?: (keyof T['$inferSelect'])[]
  /**
   * Plug in the filter language for `list({ filters })`. The function's
   * input type becomes the `filters` parameter type, and the function owns
   * validation and conversion to SQL — e.g. `conditionsCrudFilter` from
   * @saas-js/conditions-drizzle accepts serialized condition queries (saved
   * segments built with @saas-js/conditions). It receives `allowedFilters`
   * so the same allowlist applies. When omitted, `filters` uses the built-in
   * `FilterParams` object language.
   */
  filterFn?: FilterFn<T, TFilterInput>
  /**
   * Enable soft delete for the table.
   * e.g., { field: 'deletedAt', deletedValue: new Date(), notDeletedValue: null }
   */
  softDelete?: SoftDeleteConfig<T>
  /**
   * Scope filters are used to filter the data based on the actor.
   * e.g., { workspaceId: (value) => eq(table.workspaceId, value) }
   */
  scopeFilters?: TScopeFilters
  /**
   * Hooks are used to run code before crud operations.
   */
  hooks?: {
    validate?: (params: {
      data: any
      context: OperationContext<TDatabase, T, TActor, TScopeFilters>
      operation: CrudOperation | 'custom'
    }) => boolean
    beforeCreate?: (data: T['$inferInsert']) => T['$inferInsert']
    beforeUpdate?: (
      data: Partial<T['$inferInsert']>,
    ) => Partial<T['$inferInsert']>
  }
  /**
   * Validation adapter is used to validate the data.
   */
  validation?: ValidationAdapter<T>
}

export type ListParams<
  T extends DrizzleTableWithId,
  TFilterInput = FilterParams<T['$inferSelect']>,
> = {
  page?: number
  limit?: number
  search?: string
  /**
   * Row filters, converted to SQL by the crud's `filterFn`. Typed by the
   * configured filter function's input — the built-in `FilterParams` object
   * language when no `filterFn` is configured.
   */
  filters?: TFilterInput
  orderBy?: {
    field: keyof T['$inferSelect']
    direction: 'asc' | 'desc'
  }[]
  includeDeleted?: boolean
}

export type FindByIdParams = {
  includeDeleted?: boolean
}

export interface Actor<
  T extends string = string,
  TProperties extends Record<string, any> = Record<string, any>,
  TMetadata extends Record<string, any> = Record<string, any>,
> {
  type: T
  properties: TProperties
  metadata?: TMetadata
}

export type ScopeFilters<
  T extends DrizzleTableWithModels,
  TActor extends Actor = Actor,
> = Partial<{
  [K in keyof T['$inferSelect']]: (
    value: T['$inferSelect'][K],
    actor: TActor,
  ) => SQL | undefined
}> &
  Record<string, (value: any, actor: TActor) => SQL | undefined>

type ScopeFromFilters<T> =
  T extends Record<infer K, any> ? Partial<Record<K, any>> : Record<string, any>

export type OperationContext<
  TDatabase extends DrizzleDatabase,
  T extends DrizzleTableWithModels,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
> = {
  db?: TDatabase
  scope?: ScopeFromFilters<TScopeFilters> // Context-based filters like { workspaceId: 'workspace-123' }
  actor?: TActor
  skipValidation?: boolean
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export type OrderByParams<T extends DrizzleTableWithModels> = {
  field: keyof T['$inferSelect']
  direction: 'asc' | 'desc'
}

export type Filter<T = any> = {
  equals?: T
  not?: T
  gt?: T
  gte?: T
  lt?: T
  lte?: T
  in?: T[]
  like?: string
  ilike?: string
}

export type FilterParams<T extends Record<string, any>> = {
  [K in keyof T]?: T[K] | Filter<T[K]>
} & {
  AND?: FilterParams<T>[]
  OR?: FilterParams<T>[]
}

export interface ValidationAdapter<
  T extends DrizzleTableWithId = DrizzleTableWithId,
> {
  createInsertSchema: <TSchema extends StandardSchemaV1<T['$inferInsert']>>(
    table: T,
  ) => TSchema
  createUpdateSchema: <
    TSchema extends StandardSchemaV1<Partial<T['$inferInsert']>>,
  >(
    table: T,
  ) => TSchema
  createListSchema: <TSchema extends StandardSchemaV1<ListParams<T>>>(
    table: T,
    options: ListSchemaOptions<T>,
  ) => TSchema
  createPaginationSchema: <TSchema extends StandardSchemaV1<PaginationParams>>(
    options: PaginationOptions,
  ) => TSchema
  createIdSchema: <TSchema extends StandardSchemaV1<T['$inferSelect']['id']>>(
    table: T,
  ) => TSchema
  createFilterSchema: <TSchema extends StandardSchemaV1<FilterParams<T>>>(
    allowedFilters?: (keyof T['$inferSelect'])[],
  ) => TSchema
  createOrderBySchema: <TSchema extends StandardSchemaV1<OrderByParams<T>>>(
    table: T,
    allowedFields?: (keyof T['$inferSelect'])[],
  ) => TSchema
}

export interface PaginationOptions {
  defaultLimit: number
  maxLimit: number
}

export interface ListSchemaOptions<T extends DrizzleTableWithModels> {
  searchFields?: (keyof T['$inferSelect'])[]
  allowedFilters?: (keyof T['$inferSelect'])[]
  allowedOrderFields?: (keyof T['$inferSelect'])[]
  defaultLimit?: number
  maxLimit?: number
  allowIncludeDeleted?: boolean
  /**
   * `true` when a custom `filterFn` owns the `filters` parameter: the list
   * schema passes `filters` through untouched and the filter function
   * validates it.
   */
  customFilters?: boolean
}
