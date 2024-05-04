import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { AdapterInstance } from './slingshot.types'
import { checkFileSize, checkFileType } from './validators'

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
})

const uploadSchema = z.object({
  file: fileSchema,
  meta: z
    .record(z.string(), z.string().or(z.number()), {
      message: 'Meta must be an object with string or number values',
    })
    .optional(),
})

export type UploadSchema = z.infer<typeof uploadSchema>
export type FileSchema = z.infer<typeof fileSchema>

export interface CreateSlingshotOptions {
  profile: string
  maxSize?: number
  allowedFileTypes?: string[] | RegExp
  authorize?: (ctx: {
    req: Request
    file: FileSchema
    meta?: UploadSchema['meta']
  }) => void | Promise<void>
  key?: (ctx: { file: FileSchema; meta?: UploadSchema['meta'] }) => string
  adapter?: AdapterInstance
}

export const createSlingshotServer = (options: CreateSlingshotOptions) => {
  if (!options.adapter) {
    throw new Error('Slingshot adapter is required')
  }

  const app = new Hono()

  const route = app.post(
    '/request',
    zValidator('json', uploadSchema),
    async (c) => {
      try {
        const { file, meta } = await c.req.valid('json')

        await options.authorize?.({
          req: c.req.raw,
          file,
          meta,
        })

        if (!checkFileType(file.type, options.allowedFileTypes)) {
          throw new HTTPException(400, { message: 'File type not allowed' })
        }

        if (!checkFileSize(file.size, options.maxSize)) {
          throw new HTTPException(400, { message: 'File size too large' })
        }

        const key = options.key
          ? options.key({ file, meta })
          : `${options.profile}/${file.name}`

        const signedResult = await options.adapter.createSignedUrl(key)

        return c.json(signedResult, 200)
      } catch (err) {
        throw new HTTPException(400, { message: err.message })
      }
    },
  )

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        {
          error: err.message,
        },
        err.status,
      )
    }

    return c.json({ error: 'Internal server error' }, 500)
  })

  return route
}

export type SlingshotRoutes = ReturnType<typeof createSlingshotServer>
