import { createSlingshotServer } from '@saas-js/slingshot'
import s3 from '@saas-js/slingshot-aws'
import { handle } from '@saas-js/slingshot/remix-node'

import { env } from '../env.mjs'

const slingshot = createSlingshotServer({
  profile: 'avatar',
  maxSize: 1024,
  allowedFileTypes: ['image/png', 'image/jpeg'],
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

export const action = handle(slingshot)
