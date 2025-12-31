import type { MutationOptions, QueryOptions } from '@tanstack/react-query'
import { HasRequiredKeys } from 'type-fest'

type OMIT_BETTER_AUTH_CLIENT_KEYS =
  | '$ERROR_CODES'
  | '$Infer'
  | '$fetch'
  | '$store'
  | `use${string}`
  | 'fetchOptions'

// Match any method starting with 'get' or 'list'
export type QueryMethod = `get${string}` | `list${string}`

// Extract data type from better-auth's generic functions
// Constrain the options arg to throw: false to resolve the conditional return type
export type ExtractBetterAuthData<TFn> = TFn extends (
  data: any,
  options?: { throw?: false },
) => Promise<infer R>
  ? R extends { data: infer D }
    ? NonNullable<D>
    : R
  : never

export type AuthData<TFn extends (...args: any[]) => any> =
  ExtractBetterAuthData<TFn>

export interface InferQueryOptions<
  TFn extends (...args: any[]) => any,
  TPath extends readonly string[],
  TData = AuthData<TFn>,
> extends QueryOptions<TData, Error, TData, TPath> {
  queryKey: TPath
  queryFn: () => Promise<TData>
}

export interface InferMutationOptions<
  TFn extends (...args: any[]) => any,
  TData = AuthData<TFn>,
  TVariables = Parameters<TFn>[0],
> extends MutationOptions<TData, Error, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
}

export type TransformFunction<
  TFn extends (...args: any[]) => any,
  Path extends string[],
  TParams extends Parameters<TFn>[0] = Parameters<TFn>[0],
  TData = AuthData<TFn>,
> = Path extends [...any[], QueryMethod]
  ? {
      queryOptions: TParams extends undefined
        ? () => InferQueryOptions<TFn, Path>
        : TParams extends HasRequiredKeys<TParams>
          ? (
              input: TParams,
              options?: Omit<
                QueryOptions<TData, Error, TData, Path>,
                'queryKey' | 'queryFn'
              >,
            ) => InferQueryOptions<TFn, Path>
          : (
              input?: TParams,
              options?: Omit<
                QueryOptions<TData, Error, TData, Path>,
                'queryKey' | 'queryFn'
              >,
            ) => InferQueryOptions<TFn, Path>
      queryKey: TParams extends undefined
        ? () => Path
        : TParams extends HasRequiredKeys<TParams>
          ? (input: TParams) => [...Path, TParams]
          : (input?: TParams) => [...Path, TParams]
    }
  : {
      mutationOptions: (
        options?: Omit<
          MutationOptions<AuthData<TFn>, Error, TParams>,
          'mutationFn'
        >,
      ) => InferMutationOptions<TFn>
    }

export type AuthClientToQuery<T, Path extends string[] = []> = {
  [K in keyof T as K extends OMIT_BETTER_AUTH_CLIENT_KEYS
    ? never
    : K]: T[K] extends (...args: any[]) => any
    ? TransformFunction<T[K], [...Path, K & string]>
    : T[K] extends object
      ? AuthClientToQuery<T[K], [...Path, K & string]>
      : never
}

/**
 * Creates a TanStack Query client for a Better Auth client.
 *
 * ```ts
 * const client = createAuthQueryClient(betterAuthClient)
 *
 * useMutation(client.signIn.email.mutationOptions())
 * ```
 */
export function createAuthQueryClient<TClient extends Record<string, any>>(
  client: TClient,
  path: string[] = [],
): AuthClientToQuery<TClient> {
  return new Proxy(() => {}, {
    get(_, key: string) {
      const newPath = [...path, key]
      const getTarget = () => path.reduce((acc, k) => acc?.[k], client as any)

      if (key === 'queryKey') {
        return (input?: unknown) =>
          input !== undefined ? [...path, input] : path
      }

      if (key === 'queryOptions') {
        const target = getTarget()
        return (input?: unknown, options?: object) => ({
          ...options,
          queryKey: input !== undefined ? [...path, input] : path,
          queryFn: async () => {
            const result = await target(input)
            if (result.error) throw result.error
            return result.data
          },
        })
      }

      if (key === 'mutationOptions') {
        const target = getTarget()
        return (options?: object) => ({
          ...options,
          mutationKey: path,
          mutationFn: async (variables: unknown) => {
            const result = await target(variables)
            if (result.error) throw result.error
            return result.data
          },
        })
      }

      return createAuthQueryClient(client, newPath)
    },
  }) as unknown as AuthClientToQuery<TClient>
}
