import { env } from '@/env.mjs'
import { s3 } from 'bun'

import { createSlingshotServer } from '@saas-js/slingshot'
import { handle } from '@saas-js/slingshot/next'

const slingshot = createSlingshotServer({
  profile: 'cover',
  basePath: '/api/slingshot',
  maxSizeBytes: 1024 * 1024 * 5, // 5MB
  allowedFileTypes: 'image/*',
  authorize: ({ req, file, meta }) => {
    console.log('authorizing', req.headers.get('Authorization'), file, meta)
  },
  key: ({ file, meta }) => {
    return `posts/${meta?.postId}/${file.name}`
  },
  adapter: {
    createSignedUrl: async (key: string) => {
      const file = s3(key, {
        bucket: env.AWS_BUCKET,
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      })

      const url = file.presign()

      return {
        key,
        url,
      }
    },
  },
})

export const POST = handle(slingshot)
