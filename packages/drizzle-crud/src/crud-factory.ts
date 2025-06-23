import * as z from 'zod/v4'
import {
  type Column,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  like,
  lt,
  lte,
  ne,
  or,
} from 'drizzle-orm'
import type {
  PgColumn,
  PgDatabase,
  PgTable,
  PgTransaction,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'

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

type ColumnsSelection<T extends PgTable> = Record<
  keyof T['$inferSelect'],
  boolean
>

type WithRelations<T extends PgTable> = Record<
  string,
  true | { columns?: ColumnsSelection<T>; with?: WithRelations<T> }
>

export type SoftDeleteConfig<T extends PgTable> = {
  field: keyof T['$inferSelect'] // e.g., 'deletedAt' or 'isDeleted'
  deletedValue?: any // What to set when soft deleting (defaults to new Date() for timestamps, true for booleans)
  notDeletedValue?: any // What represents "not deleted" (defaults to null for timestamps, false for booleans)
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
  TDatabase extends PgDatabase<any, any, any> | PgTransaction<any, any, any>,
  T extends PgTable,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
> = {
  searchFields?: (keyof T['$inferSelect'])[]
  defaultLimit?: number
  maxLimit?: number
  allowedFilters?: (keyof T['$inferSelect'])[]
  softDelete?: SoftDeleteConfig<T>
  scopeFilters?: TScopeFilters // e.g., { workspaceId: (value) => eq(table.workspaceId, value) }
  hooks?: {
    validate?: (params: {
      data: any
      context: OperationContext<TDatabase, T, TActor, TScopeFilters>
      operation: CrudOperation | 'custom'
    }) => boolean
    beforeCreate?: (data: T['$inferInsert']) => T['$inferInsert']
    afterCreate?: (result: T['$inferSelect']) => any
    beforeUpdate?: (
      data: Partial<T['$inferInsert']>,
    ) => Partial<T['$inferInsert']>
    afterUpdate?: (result: T['$inferSelect']) => any
    afterRead?: (result: T['$inferSelect']) => any
  }
  validation?: {
    create?: z.ZodType<T['$inferInsert']>
    update?: z.ZodType<Partial<T['$inferInsert']>>
  }
}

export type Filters<T extends PgTable> = {
  [K in keyof T['$inferSelect']]?: FilterValue<T['$inferSelect'][K]>
}

export type ListParams<T extends PgTable> = {
  page?: number
  limit?: number
  search?: string
  columns?: ColumnsSelection<T>
  filters?: Filters<T>
  orderBy?: {
    field: keyof T['$inferSelect']
    direction: 'asc' | 'desc'
  }[]
  with?: WithRelations<T>
  includeDeleted?: boolean
}

export type FindByIdParams<T extends PgTableWithId> = {
  columns?: ColumnsSelection<T>
  with?: WithRelations<T>
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
  T extends PgTable,
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
  TDatabase extends PgDatabase<any, any, any> | PgTransaction<any, any, any>,
  T extends PgTable,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
> = {
  db?: TDatabase
  scope?: ScopeFromFilters<TScopeFilters> // Context-based filters like { workspaceId: 'workspace-123' }
  actor?: TActor
  skipValidation?: boolean
}

export type PgTableWithId = PgTable & {
  id: PgColumn<any>
}

export function crudFactory<
  TDatabase extends PgDatabase<any, any, any>,
  T extends PgTableWithId,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
>(
  db: TDatabase,
  table: T,
  options: CrudOptions<TDatabase, T, TActor, TScopeFilters> = {},
) {
  const {
    searchFields = [],
    defaultLimit = 20,
    maxLimit = 100,
    allowedFilters = [],
    softDelete,
    scopeFilters = {} as TScopeFilters,
    hooks = {},
    validation,
  } = options

  const createSchema = validation?.create ?? createInsertSchema(table)
  const updateSchema = validation?.update ?? createUpdateSchema(table)

  const idSchema = z.custom<T['$inferSelect']['id']>((value) => {
    return typeof value === 'string' || typeof value === 'number'
  })

  const paginationSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z
      .number()
      .int()
      .positive()
      .max(maxLimit)
      .optional()
      .default(defaultLimit),
  })

  const filterSchema = options.allowedFilters
    ? z
        .object(
          Object.fromEntries(
            options.allowedFilters.map((field) => [
              field,
              z
                .union([
                  z.any(),
                  z.object({
                    op: z.enum([
                      'eq',
                      'ne',
                      'gt',
                      'gte',
                      'lt',
                      'lte',
                      'in',
                      'like',
                      'ilike',
                    ]),
                    value: z.any(),
                  }),
                ])
                .optional(),
            ]),
          ),
        )
        .optional()
    : z.object({}).optional()

  const listSchema = paginationSchema.extend({
    search: z.string().optional(),
    includeDeleted: z.boolean().optional(),
    orderBy: z
      .array(
        z.object({
          field: z.enum(Object.keys(table) as [string, ...string[]]),
          direction: z.enum(['asc', 'desc']).default('asc'),
        }),
      )
      .optional(),
    filters: filterSchema,
  })

  // Helper to get the correct database instance
  const getDb = (
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => context?.db || db

  const getColumn = (key: keyof T['$inferInsert']) => {
    return table[key as keyof T] as Column<any, any, any>
  }

  // Helper to build Drizzle-style columns object
  const buildColumnsSelection = (columns?: ColumnsSelection<T>) => {
    if (!columns) return undefined

    // Transform user columns to actual table columns
    const selection: Record<string, any> = {}
    Object.entries(columns).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value && table[key as keyof T]) {
        selection[key] = table[key as keyof T]
      } else if (value && table[key as keyof T]) {
        selection[key] = table[key as keyof T]
      }
    })

    return Object.keys(selection).length > 0 ? selection : undefined
  }

  const applyFilters = (conditions: SQL[], filters?: Filters<T>) => {
    if (!filters) return

    Object.entries(filters).forEach(([key, filterValue]) => {
      if (
        !allowedFilters.includes(key as keyof T['$inferSelect']) ||
        filterValue === undefined
      ) {
        return
      }

      const column = getColumn(key as keyof T['$inferInsert'])

      if (
        typeof filterValue === 'object' &&
        filterValue !== null &&
        'op' in filterValue &&
        'value' in filterValue
      ) {
        const { op, value } = filterValue as {
          op: string
          value: unknown
        }

        switch (op) {
          case 'eq':
            conditions.push(eq(column, value))
            break
          case 'ne':
            conditions.push(ne(column, value))
            break
          case 'gt':
            conditions.push(gt(column, value))
            break
          case 'gte':
            conditions.push(gte(column, value))
            break
          case 'lt':
            conditions.push(lt(column, value))
            break
          case 'lte':
            conditions.push(lte(column, value))
            break
          case 'in':
            conditions.push(
              inArray(column, Array.isArray(value) ? value : [value]),
            )
            break
          case 'like':
            conditions.push(like(column, value as string))
            break
          case 'ilike':
            conditions.push(ilike(column, value as string))
            break
        }
      } else {
        conditions.push(eq(column, filterValue))
      }
    })
  }

  const applySearch = (conditions: SQL[], search?: string) => {
    if (search?.trim() && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) =>
        ilike(getColumn(field), `%${search}%`),
      )
      conditions.push(or(...searchConditions)!)
    }
  }

  const applyScopeFilters = (
    conditions: SQL[],
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    Object.entries(scopeFilters).forEach(([key, filterFn]) => {
      const condition = filterFn(
        context?.scope?.[key],
        context?.actor as TActor,
      )

      if (condition) {
        conditions.push(condition)
      }
    })

    return conditions
  }

  const applySoftDeleteFilter = (conditions: SQL[], includeDeleted = false) => {
    if (!softDelete || includeDeleted) return conditions

    const column = getColumn(softDelete.field)
    const notDeletedValue = softDelete.notDeletedValue ?? null

    conditions.push(eq(column, notDeletedValue))
    return conditions
  }

  const getSoftDeleteValues = () => {
    if (!softDelete) return null

    const deletedValue = softDelete.deletedValue ?? new Date()
    const notDeletedValue = softDelete.notDeletedValue ?? null

    return { deletedValue, notDeletedValue }
  }

  const validateHook =
    hooks.validate ??
    (({ context }) => {
      return context?.skipValidation ?? true
    })

  const validate = <
    TSchema extends z.ZodSchema,
    TInput,
    TOutput = z.infer<TSchema>,
  >(
    operation: CrudOperation,
    data: TInput,
    schema: TSchema,
    context: OperationContext<TDatabase, T, TActor, TScopeFilters> = {},
  ) => {
    if (validateHook({ operation, data, context })) {
      return schema.parse(data) as TOutput
    }

    return data
  }

  const create = async (
    data: T['$inferInsert'],
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const validatedData = validate('create', data, createSchema, context)

    const transformed = hooks.beforeCreate?.(validatedData) ?? validatedData

    const dbInstance = getDb(context)

    const [result] = await dbInstance
      .insert(table)
      .values(transformed as any)
      .returning()

    return hooks.afterCreate?.(result) ?? result
  }

  create.inputSchema = createSchema

  const findById = async (
    id: T['$inferSelect']['id'],
    params?: FindByIdParams<T>,
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ) => {
    const dbInstance = getDb(context)
    const columnsSelection = buildColumnsSelection(params?.columns)

    const conditions: SQL[] = [eq(table.id, id)]
    applyScopeFilters(conditions, context)
    applySoftDeleteFilter(conditions, params?.includeDeleted)
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    const query = (dbInstance as any).query[table._.name].findFirst({
      columns: columnsSelection,
      with: params?.with,
      where: whereClause,
    })

    const result = await query

    if (!result) return null

    return params?.columns ? result : (hooks.afterRead?.(result) ?? result)
  }

  findById.inputSchema = idSchema

  const list = async (
    params: ListParams<T> = {},
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const dbInstance = getDb(context)
    const columnsSelection = buildColumnsSelection(params.columns)

    const validatedParams = validate('list', params, listSchema, context)

    // Build where conditions
    const conditions: SQL[] = []

    applyFilters(conditions, validatedParams.filters)
    applySearch(conditions, validatedParams.search)
    applyScopeFilters(conditions, context)
    applySoftDeleteFilter(conditions, validatedParams.includeDeleted)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const limit = Math.min(validatedParams.limit || defaultLimit, maxLimit)
    const page = validatedParams.page || 1
    const offset = (page - 1) * limit

    const orderBy = validatedParams.orderBy?.map(({ field, direction }) => {
      const column = getColumn(field as keyof T['$inferInsert'])
      return direction === 'desc' ? desc(column) : asc(column)
    })

    const data = await (dbInstance as any).query[table._.name].findMany({
      columns: columnsSelection,
      with: params.with,
      where: whereClause,
      orderBy,
      limit,
      offset,
    })

    let countQuery = (dbInstance as any).select({ count: count() }).from(table)

    const countConditions: SQL[] = []

    applyFilters(countConditions, validatedParams.filters)
    applySearch(countConditions, validatedParams.search)
    applyScopeFilters(countConditions, context)
    applySoftDeleteFilter(countConditions, params.includeDeleted)

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions))
    }

    const totalResult = await countQuery
    const total = totalResult[0].count

    return {
      results: params.columns
        ? data
        : data.map((item: any) => hooks.afterRead?.(item) ?? item),
      page,
      limit,
      total,
    }
  }

  list.paramsSchema = listSchema

  const update = async (
    id: T['$inferSelect']['id'],
    updates: Partial<T['$inferInsert']>,
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const validatedData = validate('update', updates, updateSchema, context)

    const transformed = hooks.beforeUpdate?.(validatedData) ?? validatedData
    const dbInstance = getDb(context)

    const conditions: SQL[] = [eq(table.id, id)]

    applyScopeFilters(conditions, context)
    applySoftDeleteFilter(conditions, false)

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    const [result] = await dbInstance
      .update(table)
      .set(transformed)
      .where(whereClause)
      .returning()

    return hooks.afterUpdate?.(result) ?? result
  }

  update.inputSchema = z.object({
    id: idSchema,
    updates: updateSchema,
  })

  const deleteOne = async (
    id: T['$inferSelect']['id'],
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ): Promise<{ success: boolean }> => {
    const dbInstance = getDb(context)

    const conditions: SQL[] = [eq(table.id, id)]
    applyScopeFilters(conditions, context)

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    if (softDelete) {
      const deleteValues = getSoftDeleteValues()
      if (!deleteValues) throw new Error('Soft delete configuration error')

      await dbInstance
        .update(table)
        .set({ [softDelete.field]: deleteValues.deletedValue } as any)
        .where(whereClause)
    } else {
      await dbInstance.delete(table).where(whereClause)
    }

    return { success: true }
  }

  deleteOne.inputSchema = z.custom<T['$inferSelect']['id']>()

  const restore = async (
    id: T['$inferSelect']['id'],
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ): Promise<{ success: boolean }> => {
    if (!softDelete) {
      throw new Error('Restore operation requires soft delete to be configured')
    }

    const dbInstance = getDb(context)
    const deleteValues = getSoftDeleteValues()
    if (!deleteValues) throw new Error('Soft delete configuration error')

    const conditions: SQL[] = [eq(table.id, id)]
    applyScopeFilters(conditions, context)
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    const [result] = await dbInstance
      .update(table)
      .set({ [softDelete.field]: deleteValues.notDeletedValue } as any)
      .where(whereClause)
      .returning()

    return { success: !!result }
  }

  restore.inputSchema = z.custom<T['$inferSelect']['id']>()

  const permanentDelete = async (
    id: T['$inferSelect']['id'],
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ): Promise<{ success: boolean }> => {
    const dbInstance = getDb(context)

    // Build where conditions
    const conditions: SQL[] = [eq(table.id, id)]
    applyScopeFilters(conditions, context)
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    await dbInstance.delete(table).where(whereClause)
    return { success: true }
  }

  permanentDelete.inputSchema = z.string()

  const bulkCreate = async (
    data: T['$inferInsert'][],
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const dbInstance = getDb(context)

    let validatedData = data
    if (
      createSchema &&
      !validateHook({ operation: 'bulkCreate', data, context: context ?? {} })
    ) {
      validatedData = data.map((item) => createSchema.parse(item))
    }

    const transformedData = validatedData.map(
      (item) => hooks.beforeCreate?.(item) ?? item,
    )

    const results = await dbInstance
      .insert(table)
      .values(transformedData)
      .returning()

    return results.map((result: any) => hooks.afterCreate?.(result) ?? result)
  }

  bulkCreate.inputSchema = z.array(createSchema)

  const bulkDelete = async (
    ids: T['$inferSelect']['id'][],
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ): Promise<{ success: boolean; count: number }> => {
    const dbInstance = getDb(context)

    const conditions: SQL[] = [inArray(table.id, ids)]
    applyScopeFilters(conditions, context)
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    if (softDelete) {
      const deleteValues = getSoftDeleteValues()
      if (!deleteValues) throw new Error('Soft delete configuration error')

      const result = await dbInstance
        .update(table)
        .set({ [softDelete.field]: deleteValues.deletedValue } as any)
        .where(whereClause)

      return { success: true, count: result.rowCount || ids.length }
    } else {
      const result = await dbInstance.delete(table).where(whereClause)
      return { success: true, count: result.rowCount || ids.length }
    }
  }

  bulkDelete.inputSchema = z.array(z.string())

  const bulkRestore = async (
    ids: T['$inferSelect']['id'][],
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ): Promise<{ success: boolean; count: number }> => {
    if (!softDelete) {
      throw new Error(
        'Bulk restore operation requires soft delete to be configured',
      )
    }

    const dbInstance = getDb(context)
    const deleteValues = getSoftDeleteValues()
    if (!deleteValues) throw new Error('Soft delete configuration error')

    const conditions: SQL[] = [inArray(table.id, ids)]

    applyScopeFilters(conditions, context)

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    const result = await dbInstance
      .update(table)
      .set({ [softDelete.field]: deleteValues.notDeletedValue } as any)
      .where(whereClause)

    return { success: true, count: result.rowCount || ids.length }
  }

  bulkRestore.inputSchema = z.array(z.string())

  return {
    create,
    findById,
    list,
    update,
    deleteOne,
    restore,
    permanentDelete,
    bulkCreate,
    bulkDelete,
    bulkRestore,
  }
}
