import { useId } from 'react'

import { normalizeProps, useMachine } from '@zag-js/react'

import * as slingshot from '@saas-js/slingshot/client'

export interface UseSlingshotProps
  extends Omit<slingshot.Context, 'id' | 'dir' | 'getRootNode'> {
  id?: string
  client: slingshot.SlingshotClient
  meta: Record<string, string | number>
}

export const useSlingshot = (props: UseSlingshotProps) => {
  const initialContext: slingshot.Context = {
    id: useId(),
    ...props,
  }

  const context: slingshot.Context = {
    ...initialContext,
  }

  const [state, send] = useMachine(slingshot.machine(initialContext), {
    context,
  })

  return slingshot.connect(state, send, normalizeProps)
}

export type UseSlingshotReturn = ReturnType<typeof useSlingshot>
