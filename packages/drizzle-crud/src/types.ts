import type {
  Column as DrizzleColumn,
  Table as DrizzleTable,
  SQL,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'

import type { StandardSchemaV1 } from './standard-schema.ts'

export type DrizzleDatabase = PgDatabase<any, any, any>

export type { DrizzleTable, DrizzleColumn }

export type DrizzleTableWithId = DrizzleTable & {
  id: DrizzleColumn<any>
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

export type SoftDeleteConfig<T extends DrizzleTable> = {
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

export type CrudOptions<
  TDatabase extends DrizzleDatabase,
  T extends DrizzleTableWithId,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
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

export type ListParams<T extends DrizzleTableWithId> = {
  page?: number
  limit?: number
  search?: string
  filters?: FilterParams<T['$inferSelect']>
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
  T extends DrizzleTable,
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
  T extends DrizzleTable,
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

export type OrderByParams<T extends DrizzleTable> = {
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

export interface ListSchemaOptions<T extends DrizzleTable> {
  searchFields?: (keyof T['$inferSelect'])[]
  allowedFilters?: (keyof T['$inferSelect'])[]
  allowedOrderFields?: (keyof T['$inferSelect'])[]
  defaultLimit?: number
  maxLimit?: number
  allowIncludeDeleted?: boolean
}
