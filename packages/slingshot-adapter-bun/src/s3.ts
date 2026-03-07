import { type S3FileOptions, s3 } from 'bun'

import type { SlingshotAdapter } from '@saas-js/slingshot'

import type { CreateSignedUrlArgs } from './types.ts'

export interface BunS3AdapterArgs
  extends CreateSignedUrlArgs,
    Omit<
      S3FileOptions,
      'bucket' | 'region' | 'accessKeyId' | 'secretAccessKey'
    > {}

export const createSignedUrl = ({
  credentials,
  bucket,
  region,
  key,
  method = 'PUT',
  expiresIn = 3600,
  ...options
}: BunS3AdapterArgs) => {
  const file = s3(key, {
    bucket,
    region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    ...options,
  })

  return file.presign({
    method,
    expiresIn,
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
