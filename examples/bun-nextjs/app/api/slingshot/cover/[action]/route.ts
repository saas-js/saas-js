import { env } from '@/env.mjs'
import { s3 } from 'bun'

import { createSlingshotServer } from '@saas-js/slingshot'
import { handle } from '@saas-js/slingshot/next'

const slingshot = createSlingshotServer({
  profile: 'cover',
  basePath: '/api/slingshot',
  maxSizeBytes: 1024 * 1024 * 5, // 5MB
  allowedFileTypes: 'image/*',
  authorize: ({ req, key, file, meta }) => {
    const token = req.headers.get('Authorization')
    if (req.method === 'POST') {
      console.log('authorizing upload', token, file, meta)
    } else {
      console.log('authorizing fetch', token, key)
    }
  },
  key: ({ file, meta }) => {
    return `posts/${meta?.postId}/${file.name}`
  },
  adapter: {
    createSignedUrl: async ({ key, method, expiresIn }) => {
      const file = s3(key, {
        bucket: env.AWS_BUCKET,
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      })

      const url = file.presign({
        method,
        expiresIn,
      })

      return {
        key,
        url,
      }
    },
  },
})

export const POST = handle(slingshot)
export const GET = handle(slingshot)
