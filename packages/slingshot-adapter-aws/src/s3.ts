import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { formatUrl } from '@aws-sdk/util-format-url'
import { Hash } from '@smithy/hash-node'
import { HttpRequest } from '@smithy/protocol-http'
import { parseUrl } from '@smithy/url-parser'

import type { SlingshotAdapter } from '@saas-js/slingshot'

import type { CreateSignedUrlArgs } from './types.ts'

export const createSignedUrl = async ({
  credentials,
  bucket,
  region,
  key,
}: CreateSignedUrlArgs) => {
  const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`)
  const presigner = new S3RequestPresigner({
    credentials,
    region,
    sha256: Hash.bind(null, 'sha256'),
  })

  const signedUrlObject = await presigner.presign(
    new HttpRequest({ ...url, method: 'PUT' }),
  )

  return formatUrl(signedUrlObject)
}

export const s3: SlingshotAdapter = ({ credentials, bucket, region }) => {
  return {
    createSignedUrl: async (key: string) => ({
      key,
      url: await createSignedUrl({ credentials, bucket, region, key }),
    }),
  }
}
