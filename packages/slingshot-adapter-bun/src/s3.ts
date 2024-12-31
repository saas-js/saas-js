import { s3 } from 'bun'

import type { SlingshotAdapter } from '@saas-js/slingshot'

import type { CreateSignedUrlArgs } from './types.ts'

export const createSignedUrl = ({
  credentials,
  bucket,
  region,
  key,
}: CreateSignedUrlArgs) => {
  const file = s3(key, {
    bucket,
    region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  })

  return file.presign()
}

export const adapter: SlingshotAdapter = ({ credentials, bucket, region }) => {
  return {
    createSignedUrl: async (key: string) => ({
      key,
      url: createSignedUrl({ credentials, bucket, region, key }),
    }),
  }
}
