export interface CreateSignedUrlArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  bucket: string
  region: string
  key: string
  method?: 'PUT' | 'GET'
  expiresIn?: number
}

export interface BunS3AdapterArgs {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  bucket: string
  region: string
}
