import {
  type SQL,
  and,
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
  DrizzleColumn,
  DrizzleTableWithId,
  FilterParams,
} from './types.ts'

export function parseFilters<T extends DrizzleTableWithId>(
  table: T,
  filters?: FilterParams<T['$inferSelect']>,
  allowedFilters: (keyof T['$inferSelect'])[] = [],
): SQL[] {
  if (!filters) return []

  if ('AND' in filters || 'OR' in filters) {
    const conditions: SQL[] = []

    if (filters.AND && Array.isArray(filters.AND)) {
      const andConditions = filters.AND.map((filterGroup) => {
        const groupConditions = parseFilterGroup(
          table,
          filterGroup,
          allowedFilters,
        )
        return groupConditions.length > 1
          ? and(...groupConditions)
          : groupConditions[0]
      }).filter(Boolean)

      if (andConditions.length > 0) {
        conditions.push(and(...andConditions)!)
      }
    }

    if (filters.OR && Array.isArray(filters.OR)) {
      const orConditions = filters.OR.map((filterGroup) => {
        const groupConditions = parseFilterGroup(
          table,
          filterGroup,
          allowedFilters,
        )
        return groupConditions.length > 1
          ? and(...groupConditions)
          : groupConditions[0]
      }).filter(Boolean)

      if (orConditions.length > 0) {
        conditions.push(or(...orConditions)!)
      }
    }

    return conditions
  }

  return parseFilterGroup(table, filters, allowedFilters)
}

export function parseFilterGroup<T extends DrizzleTableWithId>(
  table: T,
  filters: Record<string, any>,
  allowedFilters: (keyof T['$inferSelect'])[] = [],
): SQL[] {
  const conditions: SQL[] = []

  Object.entries(filters).forEach(([key, filterValue]) => {
    if (
      !allowedFilters.includes(key as keyof T['$inferSelect']) ||
      filterValue === undefined
    ) {
      return
    }

    const column = table[key as keyof T] as DrizzleColumn<any, any, any>

    if (
      typeof filterValue === 'object' &&
      filterValue !== null &&
      !Array.isArray(filterValue) &&
      !(filterValue instanceof Date)
    ) {
      Object.entries(filterValue).forEach(([operator, value]) => {
        switch (operator) {
          case 'equals':
            conditions.push(eq(column, value))
            break
          case 'not':
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
      })
    } else {
      conditions.push(eq(column, filterValue))
    }
  })

  return conditions
}
