import { z } from 'zod'

export const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
})

export const uploadSchema = z.object({
  file: fileSchema,
  meta: z.record(z.string(), z.string().or(z.number())).optional(),
})

export type UploadSchema = z.infer<typeof uploadSchema>
export type FileSchema = z.infer<typeof fileSchema>
