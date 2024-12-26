import { type ClientRequestOptions, hc } from 'hono/client'

import type { SlingshotApp, UploadSchema } from './slingshot.types'

interface CreateSlingshotClientProps extends ClientRequestOptions {
  profile: string
  baseUrl?: string
}

export const createSlingshotClient = (props: CreateSlingshotClientProps) => {
  const { profile, baseUrl = '/api/slingshot', ...options } = props

  const slingshot = hc<SlingshotApp>(`${baseUrl}/${profile}`, options)

  return {
    request: async (file: File, meta?: UploadSchema['meta']) => {
      const response = await slingshot.api.request.$post({
        json: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
          },
          meta,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get upload url')
      }

      return await response.json()
    },
    upload: async (
      file: File,
      url: string,
      options?: {
        onProgress?: (args: { progress: number }) => void
      },
    ) => {
      const data = new FormData()

      data.append('file', file)

      const response = await new Promise<{
        status: number
        responseText: string
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener(
          'progress',
          function (event) {
            if (event.lengthComputable) {
              options?.onProgress({
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

        xhr.open('PUT', url, true)
        xhr.send(data)
      })

      if (response.status >= 400) {
        throw new Error(response.responseText)
      }
    },
  }
}

export type SlingshotClient = ReturnType<typeof createSlingshotClient>
