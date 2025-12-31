import { useMutation, useQuery } from '@tanstack/react-query'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { describe, expectTypeOf, it } from 'vitest'

import {
  type AuthClientToQuery,
  type QueryMethod,
  createAuthQueryClient,
} from './index.ts'

// Create real Better Auth client with admin plugin for more methods to test
const authClient = createAuthClient({
  plugins: [adminClient()],
})

type AuthClient = typeof authClient

// Create the query client from the real auth client
const auth = createAuthQueryClient(authClient)

describe('QueryMethod type', () => {
  it('should match methods starting with get', () => {
    expectTypeOf<'getSession'>().toExtend<QueryMethod>()
    expectTypeOf<'getUser'>().toExtend<QueryMethod>()
  })

  it('should match methods starting with list', () => {
    expectTypeOf<'listUsers'>().toExtend<QueryMethod>()
    expectTypeOf<'listSessions'>().toExtend<QueryMethod>()
  })

  it('should not match non-query methods', () => {
    expectTypeOf<'signIn'>().not.toExtend<QueryMethod>()
    expectTypeOf<'signOut'>().not.toExtend<QueryMethod>()
    expectTypeOf<'signUp'>().not.toExtend<QueryMethod>()
  })
})

describe('AuthClientToQuery type', () => {
  type QueryClient = AuthClientToQuery<AuthClient>

  it('should omit Better Auth internal properties', () => {
    expectTypeOf<QueryClient>().not.toHaveProperty('$fetch')
    expectTypeOf<QueryClient>().not.toHaveProperty('$store')
    expectTypeOf<QueryClient>().not.toHaveProperty('$ERROR_CODES')
    expectTypeOf<QueryClient>().not.toHaveProperty('$Infer')
    expectTypeOf<QueryClient>().not.toHaveProperty('useSession')
    expectTypeOf<QueryClient>().not.toHaveProperty('fetchOptions')
  })

  it('should transform getSession to query', () => {
    expectTypeOf<QueryClient['getSession']>().toHaveProperty('queryOptions')
    expectTypeOf<QueryClient['getSession']>().toHaveProperty('queryKey')
  })

  it('should transform nested signIn.email to mutation', () => {
    expectTypeOf<QueryClient['signIn']['email']>().toHaveProperty(
      'mutationOptions',
    )
  })

  it('should transform signOut to mutation', () => {
    expectTypeOf<QueryClient['signOut']>().toHaveProperty('mutationOptions')
  })

  it('should transform admin.listUsers to query', () => {
    expectTypeOf<QueryClient['admin']['listUsers']>().toHaveProperty(
      'queryOptions',
    )
    expectTypeOf<QueryClient['admin']['listUsers']>().toHaveProperty('queryKey')
  })
})

describe('createAuthQueryClient', () => {
  it('should return queryOptions for getSession', () => {
    const options = auth.getSession.queryOptions({})

    expectTypeOf(options).toHaveProperty('queryKey')
    expectTypeOf(options).toHaveProperty('queryFn')
    expectTypeOf(options.queryKey).toEqualTypeOf<['getSession']>()
  })

  it('should return queryKey for getSession', () => {
    const key = auth.getSession.queryKey()

    expectTypeOf(key[0]).toEqualTypeOf<'getSession'>()
  })

  it('should return mutationOptions for signIn.email', () => {
    const options = auth.signIn.email.mutationOptions()

    expectTypeOf(options).toHaveProperty('mutationFn')
    expectTypeOf(options).toHaveProperty('mutationKey')
  })

  it('should return mutationOptions for signUp.email', () => {
    const options = auth.signUp.email.mutationOptions()

    expectTypeOf(options).toHaveProperty('mutationFn')
  })

  it('should return mutationOptions for signOut', () => {
    const options = auth.signOut.mutationOptions()

    expectTypeOf(options).toHaveProperty('mutationFn')
  })

  it('should return queryOptions for admin.listUsers', () => {
    const options = auth.admin.listUsers.queryOptions({ query: {} })

    expectTypeOf(options).toHaveProperty('queryKey')
    expectTypeOf(options).toHaveProperty('queryFn')
  })

  it('should infer correct session data type from queryFn', async () => {
    const options = auth.getSession.queryOptions()

    // The queryFn should return the session data type
    type SessionData = Awaited<ReturnType<typeof options.queryFn>>

    expectTypeOf<SessionData>().toHaveProperty('user')
    expectTypeOf<SessionData>().toHaveProperty('session')
  })

  it('should infer correct input types for mutations', () => {
    const options = auth.signIn.email.mutationOptions()

    type MutationInput = Parameters<typeof options.mutationFn>[0]

    expectTypeOf<MutationInput>().toHaveProperty('email')
    expectTypeOf<MutationInput>().toHaveProperty('password')
  })

  it('should infer correct input types for signUp', () => {
    const options = auth.signUp.email.mutationOptions()

    type SignUpInput = Parameters<typeof options.mutationFn>[0]

    expectTypeOf<SignUpInput>().toHaveProperty('email')
    expectTypeOf<SignUpInput>().toHaveProperty('password')
    expectTypeOf<SignUpInput>().toHaveProperty('name')
  })

  it('should handle social sign in', () => {
    const options = auth.signIn.social.mutationOptions()

    type SocialInput = Parameters<typeof options.mutationFn>[0]

    expectTypeOf<SocialInput>().toHaveProperty('provider')
  })

  it('should handle nested admin methods', () => {
    // listUsers is a query (starts with list)
    expectTypeOf(auth.admin.listUsers).toHaveProperty('queryOptions')
    expectTypeOf(auth.admin.listUsers).toHaveProperty('queryKey')

    // Other admin methods should be mutations
    expectTypeOf(auth.admin.removeUser).toHaveProperty('mutationOptions')
    expectTypeOf(auth.admin.banUser).toHaveProperty('mutationOptions')
  })
})

describe('useQuery integration', () => {
  it('should infer session data type from useQuery', () => {
    const query = useQuery(auth.getSession.queryOptions({}))

    if (query.data) {
      expectTypeOf(query.data).toHaveProperty('user')
      expectTypeOf(query.data).toHaveProperty('session')
    }
  })

  it('should infer user type from session', () => {
    const query = useQuery(auth.getSession.queryOptions({}))

    type User = NonNullable<typeof query.data>['user']

    expectTypeOf<User>().toHaveProperty('id')
    expectTypeOf<User>().toHaveProperty('email')
    expectTypeOf<User>().toHaveProperty('name')
  })

  it('should infer list data type from useQuery', () => {
    const query = useQuery(auth.admin.listUsers.queryOptions({ query: {} }))

    if (query.data) {
      // admin.listUsers returns { users, total, limit, offset }
      expectTypeOf(query.data).toHaveProperty('users')
      expectTypeOf(query.data).toHaveProperty('total')
    }
  })
})

describe('useMutation integration', () => {
  it('should infer mutate variables for signIn.email', () => {
    const mutation = useMutation(auth.signIn.email.mutationOptions())

    // mutate should accept email and password
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('email')
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('password')
  })

  it('should infer mutate variables for signUp.email', () => {
    const mutation = useMutation(auth.signUp.email.mutationOptions())

    // mutate should accept email, password, and name
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('email')
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('password')
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('name')
  })

  it('should infer data type for signIn mutation', () => {
    const mutation = useMutation(auth.signIn.email.mutationOptions())

    // signIn.email returns { redirect, token, url, user }
    if (mutation.data) {
      expectTypeOf(mutation.data).toHaveProperty('user')
      expectTypeOf(mutation.data).toHaveProperty('token')
      expectTypeOf(mutation.data).toHaveProperty('redirect')
    }
  })

  it('should infer mutate variables for social signIn', () => {
    const mutation = useMutation(auth.signIn.social.mutationOptions())

    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('provider')
  })

  it('should infer mutate variables for admin.banUser', () => {
    const mutation = useMutation(auth.admin.banUser.mutationOptions())

    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('userId')
  })

  it('should infer mutate variables for admin.removeUser', () => {
    const mutation = useMutation(auth.admin.removeUser.mutationOptions())

    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('userId')
  })
})
