import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
})

const uploadSchema = z.object({
  file: fileSchema,
  meta: z.record(z.string(), z.string().or(z.number())).optional(),
})

export type UploadSchema = z.infer<typeof uploadSchema>
export type FileSchema = z.infer<typeof fileSchema>

export interface CreateSlingshotProps {
  profile: string
  maxSize?: number
  allowedFileTypes?: string[]
  key?: (ctx: { file: FileSchema; meta?: UploadSchema['meta'] }) => string
  adapter?: {
    createSignedUrl: (key: string) => Promise<string>
  }
}

export const createSlingshot = (props: CreateSlingshotProps) => {
  if (!props.adapter) {
    throw new Error('adapter is required')
  }

  const app = new Hono()

  const route = app
    .post('/validate', zValidator('json', uploadSchema), (c) => {
      return c.json({ success: true }, 200)
    })
    .post('/request', zValidator('json', uploadSchema), async (c) => {
      const json = await c.req.json()

      const key = props.key
        ? props.key(json)
        : `${props.profile}/${json.file.name}`

      const url = await props.adapter.createSignedUrl(key)

      return c.json(
        {
          url,
        },
        200,
      )
    })

  return route
}

export type SlingshotRoutes = ReturnType<typeof createSlingshot>
