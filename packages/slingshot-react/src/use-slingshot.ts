import { useId } from 'react'

import { normalizeProps, useMachine } from '@zag-js/react'

import {
  type Context,
  type SlingshotClient,
  connect,
  machine,
} from '@saas-js/slingshot/client'

export interface UseSlingshotProps
  extends Omit<Context, 'id' | 'dir' | 'getRootNode'> {
  id?: string
  client: SlingshotClient
  meta: Record<string, string | number>
}

export const useSlingshot = (props: UseSlingshotProps) => {
  const initialContext: Context = {
    id: useId(),
    ...props,
  }

  const context: Context = {
    ...initialContext,
  }

  const service = useMachine(machine, context)

  return connect(service, normalizeProps)
}

export type UseSlingshotReturn = ReturnType<typeof useSlingshot>
