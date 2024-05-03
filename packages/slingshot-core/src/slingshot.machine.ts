import { StateMachine as S, createMachine } from '@zag-js/core'
import { CommonProperties, LocaleProperties, RequiredBy } from '@zag-js/types'
import { compact } from '@zag-js/utils'

import { SlingshotClient } from './create-slingshot-client'

export interface SlingshotFile {
  key?: string
  url?: string
  name: string
  type: string
  size: number
  data: File
  progress?: number
  status: 'accepted' | 'uploading' | 'done' | 'failed' | 'aborted'
}

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
              const { key, url } = await ctx.client.request(file, ctx.meta)

              const fileMeta = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: file,
              }

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
            }),
          )

          for (const file of files) {
            if (!file.key) {
              continue
            }

            set.status(ctx, { key: file.key, status: 'uploading' })

            try {
              await uploadFile({
                file,
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

const invoke = {
  onError: (ctx, error) => {
    console.error(error)
  },
}

const uploadFile = async (args: {
  file: SlingshotFile
  onProgress: (args: { progress: number }) => void
}) => {
  const file = args.file

  const data = new FormData()

  data.append('file', file.data)

  const response = await new Promise<{ status: number; responseText: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener(
        'progress',
        function (event) {
          if (event.lengthComputable) {
            args.onProgress({
              progress: Math.round((event.loaded / event.total) * 100),
            })
          }
        },
        false,
      )

      xhr.addEventListener('load', function () {
        resolve({ status: xhr.status, responseText: xhr.responseText })
      })

      xhr.addEventListener('error', function (err) {
        reject(err)
      })

      xhr.addEventListener('abort', function () {
        reject(new Error('Aborted'))
      })

      xhr.open('PUT', args.file.url, true)
      xhr.send(data)
    },
  )

  if (response.status >= 400) {
    throw new Error(response.responseText)
  }
}
