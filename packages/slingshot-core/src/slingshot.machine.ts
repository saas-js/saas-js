import { StateMachine as S, createMachine } from '@zag-js/core'
import { CommonProperties, LocaleProperties, RequiredBy } from '@zag-js/types'
import { compact } from '@zag-js/utils'

import { SlingshotClient } from './create-slingshot-client'
import { SlingshotFile } from './slingshot.types'

interface PublicContext extends LocaleProperties, CommonProperties {
  client: SlingshotClient
  meta: Record<string, string | number>
  uploadOnAccept?: boolean
  direction?: 'ltr' | 'rtl'
}

interface PrivateContext {
  files: Record<string, SlingshotFile>
  status: 'idle' | 'uploading' | 'done' | 'failed' | 'aborted'
}

export type UserDefinedContext = RequiredBy<PublicContext, 'id'>

export interface MachineContext extends PublicContext, PrivateContext {}

export interface MachineState {
  value: 'idle' | 'uploading' | 'success' | 'failed'
}

export type State = S.State<MachineContext, MachineState>

export type Send = S.Send<S.AnyEventObject>

export const machine = (userContext: UserDefinedContext) => {
  const ctx = compact(userContext)

  return createMachine<MachineContext, MachineState>(
    {
      id: 'slingshot-upload',
      initial: 'idle',
      context: {
        status: 'idle',
        client: null,
        meta: {},
        ...ctx,
        files: {},
      },
      on: {
        UPLOAD: {
          actions: ['upload'],
        },
      },
      states: {
        idle: {
          on: {
            UPLOAD: {
              actions: ['upload'],
            },
          },
        },
        uploading: {
          on: {
            SUCCESS: 'success',
            FAILED: 'failed',
          },
        },
        success: {
          type: 'final',
        },
        failed: {
          type: 'final',
        },
      },
    },
    {
      guards: {
        isValidated: (context, event) => {
          return true
        },
      },
      actions: {
        setProgress(ctx, { key, progress }) {
          set.progress(ctx, { key, progress })
        },
        setStatus(ctx, { status }) {
          ctx.status = status
        },
        upload: async (ctx, event) => {
          ctx.status = 'uploading'

          const files = await Promise.all<SlingshotFile>(
            event.files.map(async (file) => {
              set.status(ctx, { key: file.key, status: 'authorizing' })

              const fileMeta = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: file,
              }

              try {
                const { key, url } = await ctx.client.request(file, ctx.meta)

                if (!key) {
                  return {
                    ...fileMeta,
                    status: 'rejected',
                  }
                }

                const acceptedFile: SlingshotFile = {
                  key,
                  url,
                  ...fileMeta,
                  status: 'accepted',
                }

                ctx.files[key] = acceptedFile

                return acceptedFile
              } catch (err) {
                return {
                  ...fileMeta,
                  status: 'rejected',
                  error: err.message,
                }
              }
            }),
          )

          for (const file of files) {
            if (!file.key) {
              continue
            }

            set.status(ctx, { key: file.key, status: 'uploading' })

            try {
              await ctx.client.upload(file.data, file.url, {
                onProgress: ({ progress }) => {
                  set.progress(ctx, {
                    key: file.key,
                    progress,
                  })
                },
              })

              set.status(ctx, {
                key: file.key,
                status: 'done',
              })
            } catch (e) {
              set.status(ctx, {
                key: file.key,
                status: 'failed',
                error: e,
              })
            }
          }

          ctx.status = 'done'
        },
      },
    },
  )
}

const set = {
  progress(ctx, { key, progress }) {
    ctx.files[key].progress = progress
  },
  status(ctx, { key, status, error = null }) {
    ctx.files[key].status = status
    ctx.files[key].error = error
  },
}
