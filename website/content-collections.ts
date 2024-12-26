import { defineCollection, defineConfig, z } from '@content-collections/core'
import { transformMDX } from '@fumadocs/content-collections/configuration'

const docs = defineCollection({
  name: 'docs',
  directory: 'content/docs',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
    full: z.boolean().optional(),
    _openapi: z.record(z.string(), z.any()).optional(),
  }),
  transform: transformMDX,
})

const metas = defineCollection({
  name: 'meta',
  directory: 'content/docs',
  include: '**/meta.json',
  parser: 'json',
  schema: (z) => ({
    title: z.string().optional(),
    description: z.string().optional(),
    pages: z.array(z.string()).optional(),
    icon: z.string().optional(),
    root: z.boolean().optional(),
    defaultOpen: z.boolean().optional(),
  }),
})

export default defineConfig({
  collections: [docs, metas],
})
