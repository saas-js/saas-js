'use client'

import * as FileUploadBase from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'

import { FileUploadRootProps } from '@saas-js/slingshot-react'

import { Progress } from './ui/progress'

export const FileUpload = (props: Omit<FileUploadRootProps, 'children'>) => {
  return (
    <FileUploadBase.Root {...props}>
      <FileUploadBase.Context>
        {(api) => {
          const status = api.slingshot.status

          const slingshotFiles = api.slingshot.getFiles()

          return (
            <>
              <FileUploadBase.Dropzone>
                <FileUploadBase.Label>
                  Drag your file(s) here
                </FileUploadBase.Label>

                <FileUploadBase.Trigger asChild>
                  <Button>Choose file(s)</Button>
                </FileUploadBase.Trigger>
              </FileUploadBase.Dropzone>

              <div>Status: {status}</div>

              <FileUploadBase.ItemGroup>
                {api.acceptedFiles.map((file, id) => {
                  const slingshotFile = api.slingshot
                    .getFiles()
                    ?.find((f) => f.name === file.name)

                  return (
                    <FileUploadBase.Item key={id} file={file}>
                      <FileUploadBase.ItemPreview type="image/*">
                        <FileUploadBase.ItemPreviewImage
                          style={{ width: '100px' }}
                        />
                      </FileUploadBase.ItemPreview>
                      <FileUploadBase.ItemPreview type=".*"></FileUploadBase.ItemPreview>
                      <FileUploadBase.ItemName />
                      <FileUploadBase.ItemSizeText />

                      <div>
                        {slingshotFile?.progress &&
                          slingshotFile?.status !== 'done' && (
                            <Progress value={slingshotFile?.progress} />
                          )}
                        {slingshotFile?.status === 'done' ? 'Done' : null}
                      </div>

                      <FileUploadBase.ItemDeleteTrigger>
                        ✕
                      </FileUploadBase.ItemDeleteTrigger>
                    </FileUploadBase.Item>
                  )
                })}
              </FileUploadBase.ItemGroup>

              <FileUploadBase.HiddenInput />

              {slingshotFiles.map(({ url }) => (
                <input
                  key={url}
                  type="hidden"
                  name={props.profile}
                  value={url?.split('?')[0]}
                />
              ))}
            </>
          )
        }}
      </FileUploadBase.Context>
    </FileUploadBase.Root>
  )
}
