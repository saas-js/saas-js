import { type ReactNode, createContext, useContext } from 'react'

import { UseSlingshotReturn } from './use-slingshot'

export interface SlingshotContextProps {
  children: (context: UseSlingshotContext) => ReactNode
}

export const SlingshotContext = (props: SlingshotContextProps) =>
  props.children(useSlingshotContext())

export interface UseSlingshotContext extends UseSlingshotReturn {}

export const Context = createContext<UseSlingshotContext | null>(null)

export const useSlingshotContext = () => {
  const context = useContext(Context)

  if (!context) {
    const error = new Error(
      'useSlingshotContext must be used within a SlingshotProvider',
    )
    error.name = 'SlingshotContextError'
    Error.captureStackTrace(error, useSlingshotContext)

    throw error
  }

  return context
}

export const SlingshotProvider = Context.Provider
