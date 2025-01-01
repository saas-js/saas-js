export interface SlingshotAdapterArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  bucket: string
  region: string
}

export type SlingshotAdapter<
  Args extends SlingshotAdapterArgs = SlingshotAdapterArgs,
> = (args: Args) => {
  createSignedUrl: (options: {
    /**
     * The key to use for the signed URL.
     */
    key: string
    /**
     * The method to use for the signed URL.
     */
    method: 'PUT' | 'GET'
    /**
     * The number of seconds the signed URL should be valid for.
     */
    expiresIn?: number
  }) => Promise<{
    key: string
    url: string
  }>
}

export type AdapterInstance = ReturnType<SlingshotAdapter>

export type { SlingshotApp } from './create-slingshot-server'

export type { FileSchema, UploadSchema } from './slingshot.schema'

export interface SlingshotFile {
  key?: string
  url?: string
  name: string
  type: string
  size: number
  data: File
  progress?: number
  error?: string
  status:
    | 'authorizing'
    | 'accepted'
    | 'rejected'
    | 'uploading'
    | 'done'
    | 'failed'
    | 'aborted'
}
