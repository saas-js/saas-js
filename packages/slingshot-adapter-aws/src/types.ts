export interface CreateSignedUrlArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  bucket: string
  region: string
  key: string
}

export interface S3AdapterArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  bucket: string
  region: string
}
