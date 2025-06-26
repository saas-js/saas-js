import {
  type KnownKeysOnly,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from 'drizzle-orm/relations'

import { parseFilters } from './filters.ts'
import { type StandardSchemaV1, standardValidate } from './standard-schema.ts'
import type {
  Actor,
  CrudOperation,
  CrudOptions,
  DrizzleColumn,
  DrizzleDatabase,
  DrizzleTableWithId,
  FilterParams,
  FindByIdParams,
  ListParams,
  ListSchemaOptions,
  OperationContext,
  ScopeFilters,
  ValidationAdapter,
} from './types.ts'

function createSchemas<
  TDatabase extends DrizzleDatabase,
  T extends DrizzleTableWithId,
  TActor extends Actor = Actor,
  TScopeFilters extends ScopeFilters<T, TActor> = ScopeFilters<T, TActor>,
  TValidation extends ValidationAdapter<T> = ValidationAdapter<T>,
>(
  table: T,
  options: CrudOptions<TDatabase, T, TActor, TScopeFilters>,
  validation?: TValidation,
) {
  if (!validation) {
    return {
      insertSchema: undefined,
      updateSchema: undefined,
      listSchema: undefined,
      idSchema: undefined,
    }
  }

  const listOptions: ListSchemaOptions<T> = {
    searchFields: options.searchFields,
    allowedFilters: options.allowedFilters,
    defaultLimit: options.defaultLimit,
    maxLimit: options.maxLimit,
    allowIncludeDeleted: !!options.softDelete,
  }

  return {
    insertSchema: validation.createInsertSchema(table),
    updateSchema: validation.createUpdateSchema(table),
    listSchema: validation.createListSchema(table, listOptions),
    idSchema: validation.createIdSchema(table),
  }
}

export function crudFactory<
  TDatabase extends DrizzleDatabase,
  T extends DrizzleTableWithId,
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

  const tableName = table._.name as keyof TDatabase['_']['fullSchema']

  type TSchema = ExtractTablesWithRelations<TDatabase['_']['fullSchema']>
  type TFields = TSchema[typeof tableName]

  type QueryOneGeneric = DBQueryConfig<'one', true, TSchema, TFields>
  type QueryManyGeneric = DBQueryConfig<'many', true, TSchema, TFields>

  type QueryOneInput<TSelections extends QueryOneGeneric> = KnownKeysOnly<
    TSelections,
    QueryOneGeneric
  >
  type QueryManyInput<TSelections extends QueryManyGeneric> = KnownKeysOnly<
    TSelections,
    QueryManyGeneric
  >

  type QueryOneResult<TSelections extends QueryOneGeneric> = BuildQueryResult<
    TSchema,
    TFields,
    TSelections
  >

  type QueryManyResult<TSelections extends QueryManyGeneric> = BuildQueryResult<
    TSchema,
    TFields,
    TSelections
  >[]

  const schemas = createSchemas(table, options, validation)

  const getDb = (
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => context?.db || db

  const getQueryBuilder = (
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const dbInstance = getDb(context)
    return (dbInstance as any).query[
      tableName
    ] as unknown as RelationalQueryBuilder<TSchema, TFields>
  }

  const getColumn = (key: keyof T['$inferInsert']) => {
    return table[key as keyof T] as DrizzleColumn<any, any, any>
  }

  const applyFilters = (
    conditions: SQL[],
    filters?: FilterParams<T['$inferSelect']>,
  ) => {
    const parsedFilters = parseFilters(table, filters, allowedFilters)

    conditions.push(...parsedFilters)
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

  const validate = async <TInput, TOutput>(
    operation: CrudOperation,
    data: TInput,
    schema?: StandardSchemaV1<TInput, TOutput>,
    context: OperationContext<TDatabase, T, TActor, TScopeFilters> = {},
  ) => {
    if (schema && validateHook({ operation, data, context })) {
      return standardValidate(schema, data)
    }

    return data
  }

  const create = async (
    data: T['$inferInsert'],
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const validatedData = await validate(
      'create',
      data,
      schemas.insertSchema,
      context,
    )

    const transformed = hooks.beforeCreate?.(validatedData) ?? validatedData

    const dbInstance = getDb(context)

    const [result] = await dbInstance
      .insert(table)
      .values(transformed)
      .returning()

    return result
  }

  const findById = async <TSelections extends QueryOneGeneric>(
    id: T['$inferSelect']['id'],
    params?: QueryOneInput<TSelections> & FindByIdParams,
    context?: Omit<
      OperationContext<TDatabase, T, TActor, TScopeFilters>,
      'skipValidation'
    >,
  ) => {
    const builder = getQueryBuilder(context)

    const conditions: SQL[] = [eq(table.id, id)]

    applyScopeFilters(conditions, context)
    applySoftDeleteFilter(conditions, params?.includeDeleted)

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0]

    const result = await builder.findFirst({
      columns: params?.columns,
      with: params?.with,
      where: whereClause,
      extras: params?.extras,
    })

    return result as QueryOneResult<TSelections> | null
  }

  const list = async <TSelections extends QueryManyGeneric>(
    params: ListParams<T> &
      Omit<QueryManyInput<TSelections>, 'offset' | 'where'> & {
        where?: SQL
      },
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const dbInstance = getDb(context)
    const builder = getQueryBuilder(context)

    const validatedParams = await validate(
      'list',
      params,
      schemas.listSchema,
      context,
    )

    // Build where conditions
    const conditions: SQL[] = []

    if (params.where) {
      conditions.push(params.where)
    }

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

    const data = await builder.findMany({
      columns: params.columns,
      with: params.with,
      where: whereClause,
      orderBy,
      limit,
      offset,
      extras: params.extras,
    })

    let countQuery = (dbInstance as any).select({ count: count() }).from(table)

    const countConditions: SQL[] = [...conditions]

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions))
    }

    const totalResult = await countQuery

    const total = totalResult[0].count as number

    return {
      results: data,
      page,
      limit,
      total,
    } as {
      results: QueryManyResult<TSelections>
      page: number
      limit: number
      total: number
    }
  }

  const update = async (
    id: T['$inferSelect']['id'],
    updates: Partial<T['$inferInsert']>,
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const validatedData = await validate(
      'update',
      updates,
      schemas.updateSchema,
      context,
    )

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

    return result
  }

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

  const bulkCreate = async (
    data: T['$inferInsert'][],
    context?: OperationContext<TDatabase, T, TActor, TScopeFilters>,
  ) => {
    const dbInstance = getDb(context)

    const transformedData = await Promise.all(
      data.map(async (item) => {
        const validated = await validate(
          'bulkCreate',
          item,
          schemas.insertSchema,
          context,
        )

        return hooks.beforeCreate?.(validated) ?? validated
      }),
    )

    await dbInstance.insert(table).values(transformedData)

    return {
      success: true,
      count: transformedData.length,
    }
  }

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
