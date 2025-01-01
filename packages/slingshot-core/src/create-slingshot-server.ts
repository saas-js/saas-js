import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { BlankEnv } from 'hono/types'
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

export interface CreateSlingshotOptions<Env extends BlankEnv = BlankEnv> {
  profile: string
  basePath?: string
  maxSizeBytes?: number
  allowedFileTypes?: string | string[] | RegExp
  authorize?: (ctx: {
    req: Request
    key?: string
    file?: FileSchema
    meta?: UploadSchema['meta']
  }) => void | Promise<void>
  key?: (ctx: { file: FileSchema; meta?: UploadSchema['meta'] }) => string
  adapter?: AdapterInstance
}

export const createSlingshotServer = <Env extends BlankEnv = BlankEnv>(
  options: CreateSlingshotOptions,
) => {
  if (!options.adapter) {
    throw new Error('Slingshot adapter is required')
  }

  const app = new Hono<Env>({
    // we use getPath here, since using basePath will break our types.
    getPath: (req) => {
      const url = new URL(req.url)
      return url.pathname.replace(`${options.basePath}/${options.profile}`, '')
    },
  })
    .post('/request', zValidator('json', uploadSchema), async (c) => {
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

        if (!checkFileSize(file.size, options.maxSizeBytes)) {
          throw new HTTPException(400, { message: 'File size too large' })
        }

        const key = options.key
          ? options.key({ file, meta })
          : `${options.profile}/${file.name}`

        const signedResult = await options.adapter.createSignedUrl({
          key,
          method: 'PUT',
        })

        return c.json(signedResult, 200)
      } catch (err) {
        throw new HTTPException(400, { message: err.message })
      }
    })
    .get(
      '/:key',
      zValidator('param', z.object({ key: z.string() })),
      async (c) => {
        const { key } = await c.req.valid('param')

        await options.authorize?.({
          req: c.req.raw,
          key,
        })

        const signedResult = await options.adapter.createSignedUrl({
          key,
          method: 'GET',
        })

        if (!signedResult.url) {
          throw new HTTPException(404, { message: 'File not found' })
        }

        return c.redirect(signedResult.url, 302)
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

  return app
}

export type SlingshotApp = ReturnType<typeof createSlingshotServer>
