import { type S3Options, s3 } from 'bun'

import type { SlingshotAdapter, SlingshotAdapterArgs } from '@saas-js/slingshot'

import type { CreateSignedUrlArgs } from './types.ts'

type BunS3Options = Omit<
  S3Options,
  'bucket' | 'region' | 'accessKeyId' | 'secretAccessKey'
>

export interface BunS3AdapterArgs extends SlingshotAdapterArgs, BunS3Options {}

export const createSignedUrl = ({
  credentials,
  bucket,
  region,
  key,
  method = 'PUT',
  contentType,
  expiresIn = 3600,
  ...options
}: CreateSignedUrlArgs & BunS3Options) => {
  const file = s3.file(key, {
    bucket,
    region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    ...options,
  })

  return file.presign({
    method,
    expiresIn,
    type: contentType,
  })
}

export const adapter: SlingshotAdapter<BunS3AdapterArgs> = (options) => {
  return {
    createSignedUrl: async ({
      key,
      method = 'PUT',
      contentType,
      contentDisposition,
      expiresIn = 3600,
    }) => ({
      key,
      url: createSignedUrl({
        ...options,
        key,
        method,
        contentType,
        contentDisposition,
        expiresIn,
      }),
    }),
  }
}
