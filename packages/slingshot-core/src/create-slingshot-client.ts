import { hc } from 'hono/client'

import type { SlingshotRoutes, UploadSchema } from './slingshot.types'

interface CreateSlingshotClientProps {
  profile: string
  baseUrl?: string
}

export const createSlingshotClient = (props: CreateSlingshotClientProps) => {
  const { profile, baseUrl = '/api/slingshot' } = props

  const slingshot = hc<SlingshotRoutes>(`${baseUrl}/${profile}`)

  return {
    validate: async (file: File, meta?: UploadSchema['meta']) => {
      return slingshot.validate.$post({
        json: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
          },
          meta,
        },
      })
    },
    request: async (file: File, meta?: UploadSchema['meta']) => {
      const response = await slingshot.request.$post({
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
    upload: async (file: File, meta?: UploadSchema['meta']) => {
      const formData = new FormData()

      formData.append('file', file)

      const response = await slingshot.request.$post({
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

      const data = await response.json()

      // const uploader = machine(file, data.url)

      // console.log(uploader)

      // return uploader
    },
  }
}

export type SlingshotClient = ReturnType<typeof createSlingshotClient>
