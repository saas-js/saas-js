import { env } from '@/env.mjs'

import { createSlingshotServer } from '@saas-js/slingshot'
import { s3 } from '@saas-js/slingshot-adapter-s3'
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
  adapter: s3({
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    region: env.AWS_REGION,
    bucket: env.AWS_BUCKET,
  }),
})

export const POST = handle(slingshot)