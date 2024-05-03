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

export type { SlingshotRoutes } from './create-slingshot-server'

export type { FileSchema, UploadSchema } from './slingshot.schema'
