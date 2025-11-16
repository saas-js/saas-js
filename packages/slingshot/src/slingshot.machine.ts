import { createMachine } from '@zag-js/core'
import { CommonProperties, LocaleProperties, RequiredBy } from '@zag-js/types'

import { SlingshotClient } from './create-slingshot-client'
import { SlingshotFile } from './slingshot.types'

interface PublicContext extends LocaleProperties, CommonProperties {
  client: SlingshotClient
  meta: Record<string, string | number>
  uploadOnAccept?: boolean
  direction?: 'ltr' | 'rtl'
}

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'failed' | 'aborted'
type UploadFiles = Map<string, SlingshotFile>

interface PrivateContext {
  files: UploadFiles | null
  status: UploadStatus
}

export type UserDefinedContext = RequiredBy<PublicContext, 'id'>

export interface MachineContext extends PublicContext, PrivateContext {}

type SlingshotEvent =
  | { type: 'UPLOAD'; files: File[] }
  | { type: 'SUCCESS' }
  | { type: 'FAILED' }
  | { type: 'ABORTED' }

export interface SlingshotSchema {
  state: 'idle' | 'uploading' | 'success' | 'failed'
  props: PublicContext
  context: PrivateContext
  event: SlingshotEvent
  action: string
  guard: string
  effect: string
}

export const machine = createMachine<SlingshotSchema>({
  initialState() {
    return 'idle'
  },

  context({ bindable }) {
    return {
      files: bindable<UploadFiles>(() => ({
        defaultValue: null,
      })),
      status: bindable<UploadStatus>(() => ({
        defaultValue: 'idle',
      })),
    }
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
        SUCCESS: {
          target: 'success',
        },
        FAILED: {
          target: 'failed',
        },
      },
    },
    success: {},
    failed: {},
  },
  implementations: {
    guards: {
      isValidated: () => {
        return true
      },
    },
    actions: {
      upload: async ({ context, prop, event }) => {
        const client = prop('client')
        const meta = prop('meta')

        context.set('status', 'uploading')

        function setFile(file: SlingshotFile) {
          context.set('files', (prev) => {
            const newFiles = new Map(prev)
            newFiles.set(file.name, file)
            return newFiles
          })

          return file
        }

        const files = await Promise.all<SlingshotFile>(
          event.files.map(async (file) => {
            const fileMeta = {
              name: file.name,
              type: file.type,
              size: file.size,
              data: file,
            }

            setFile({ ...fileMeta, status: 'authorizing' })

            try {
              const { key, url } = await client.request(file, meta)

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

              setFile(acceptedFile)

              return acceptedFile
            } catch (err) {
              setFile({ ...fileMeta, status: 'rejected', error: err.message })

              return {
                key: file.key,
                ...fileMeta,
                status: 'rejected',
                error: err.message as string,
              }
            }
          }),
        )

        for (const file of files) {
          if (!file.key) {
            continue
          }

          setFile({ ...file, status: 'uploading' })

          try {
            await client.upload(file.data, file.url, {
              onProgress: ({ progress }) => {
                setFile({ ...file, progress })
              },
            })

            setFile({ ...file, status: 'done' })
          } catch (e) {
            setFile({ ...file, status: 'failed', error: e.message as string })
          }
        }

        context.set('status', 'done')
      },
    },
  },
})
