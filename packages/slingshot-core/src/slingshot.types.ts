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
  createSignedUrl: (key: string) => Promise<{
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
