import { defineCollection, defineConfig, z } from '@content-collections/core'
import { transformMDX } from '@fumadocs/content-collections/configuration'

const docs = defineCollection({
  name: 'docs',
  directory: 'content/docs',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    full: z.boolean(),
    _openapi: z.record(z.string(), z.any()),
  }),
  transform: transformMDX,
})

const metas = defineCollection({
  name: 'meta',
  directory: 'content/docs',
  include: '**/meta.json',
  parser: 'json',
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    pages: z.array(z.string()),
    icon: z.string(),
    root: z.boolean(),
    defaultOpen: z.boolean(),
  }),
})

export default defineConfig({
  collections: [docs, metas],
})
