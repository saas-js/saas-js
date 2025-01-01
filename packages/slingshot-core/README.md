# Slingshot

Slingshot is a full-stack file upload component with support for drag-and-drop, progress bars, and more. Fully composable and compatible with any styling library.

Upload files fast and securely to any S3-compatible storage with a simple API that runs on any Javascript server runtime.

[Documentation](https://saas-js.dev/docs/file-upload)

## Example

```tsx
// page.tsx
import { FileUpload } from '@/components/file-upload'

export default function Page() {
  return (
    <FileUpload
      profile="avatar"
      maxFiles={1}
      baseUrl="/api/slingshot"
      uploadOnAccept
      meta={{ userId: '123' }}
    />
  )
}
```

```tsx
// components/file-upload.tsx
import { FileUpload } from '@saas-js/slingshot-react'

import { Button } from '@/components/button'
import { Progress } from '@/components/progress'

export const FileUpload = (props: Omit<FileUpload.RootProps, 'children'>) => {
  return (
    <FileUpload.Root {...props}>
      <FileUpload.Context>
        {(api) => {
          const files = api.slingshot.getFiles()

          return (
            <>
              <FileUpload.Dropzone>
                <FileUpload.Label>
                  Drag your file(s) here
                </FileUpload.Label>

                <FileUpload.Trigger asChild>
                  <Button>Choose file(s)</Button>
                </FileUpload.Trigger>
              </FileUpload.Dropzone>

              <FileUpload.ItemGroup>
                {files.map((file) => {
                  return (
                    <FileUpload.Item
                      key={file.name}
                      file={file.data}
                    >
                      <FileUpload.ItemPreview type="image/*">
                        <FileUpload.ItemPreviewImage />
                      </FileUpload.ItemPreview>
                      <FileUpload.ItemName />
                      <FileUpload.ItemSizeText />

                      <div>
                        {file.progress &&
                          file.status !== 'done' && (
                            <Progress
                              value={file.progress}
                              type="circular"
                              colorPalette="green"
                            />
                          )}
                        {file.status === 'done' ? 'Done' : null}
                      </div>

                      <FileUpload.ItemDeleteTrigger>
                        ✕
                      </FileUpload.ItemDeleteTrigger>
                    </FileUpload.Item>
                  )
                })}
              </FileUpload.ItemGroup>

              <FileUpload.HiddenInput />
            </>
          )
        }}
      </FileUpload.Context>
    </FileUpload.Root>

)
}

```

```tsx
// api/slingshot/avatar/[action]/route.ts
import { createSlingshotServer } from '@saas-js/slingshot'
import { s3 } from '@saas-js/slingshot-adapter-s3'
import { handle } from '@saas-js/slingshot/next'

const slingshot = createSlingshotServer({
  profile: 'avatar',
  maxSizeBytes: 1024 * 1024 * 5, // 5MB
  allowedFileTypes: 'image/*',
  authorize: ({ req, file, meta }) => {
    console.log('authorizing', req.headers.get('Authorization'), file, meta)
  },
  key: ({ file, meta }) => {
    return `users/${meta?.userId}/avatar`
  },
  adapter: s3({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET,
  }),
})

export const POST = handle(slingshot)
```

## Installation

```bash
npm install @saas-js/slingshot @saas-js/slingshot-react
```
