export interface CreateSignedUrlArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  bucket: string
  region: string
  key: string
  method?: 'PUT' | 'GET'
  expiresIn?: number
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
