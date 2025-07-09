import s3 from '@saas-js/slingshot-aws'
import { handle } from '@saas-js/slingshot/aws-lambda'

import { createSlingshotServer } from './create-slingshot-server'

const app = createSlingshotServer({
  profile: 'avatar',
  maxSize: 1024,
  allowedFileTypes: ['image/png', 'image/jpeg'],
  key: ({ file }) => `avatar/${file.name}`,
  adapter: s3({
    region: 'us-west-2',
    bucket: 'slingshot',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
})

export const handler = handle(app)
