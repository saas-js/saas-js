import { s3 } from 'bun'

import type { SlingshotAdapter } from '@saas-js/slingshot'

import type { CreateSignedUrlArgs } from './types.ts'

export const createSignedUrl = ({
  credentials,
  bucket,
  region,
  key,
  method = 'PUT',
  expiresIn = 3600,
}: CreateSignedUrlArgs) => {
  const file = s3(key, {
    bucket,
    region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  })

  return file.presign({
    method,
    endpoint: `https://${bucket}.s3.${region}.amazonaws.com`,
    expiresIn: expiresIn,
  })
}

export const adapter: SlingshotAdapter = ({ credentials, bucket, region }) => {
  return {
    createSignedUrl: async ({ key, method = 'PUT', expiresIn = 3600 }) => ({
      key,
      url: createSignedUrl({
        credentials,
        bucket,
        region,
        key,
        method,
        expiresIn,
      }),
    }),
  }
}
