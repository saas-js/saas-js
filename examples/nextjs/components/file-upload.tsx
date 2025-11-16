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

              <FileUploadBase.ItemGroup>
                {api.acceptedFiles.map((file) => {
                  const slingshotFile = api.slingshot
                    .getFiles()
                    ?.find((f) => f.name === file.name)

                  return (
                    <FileUploadBase.Item
                      key={file.name}
                      file={file}
                      className="relative items-center"
                    >
                      <FileUploadBase.ItemPreview type="image/*">
                        <FileUploadBase.ItemPreviewImage />
                      </FileUploadBase.ItemPreview>
                      <div className="flex flex-col flex-1">
                        <FileUploadBase.ItemName />
                        <FileUploadBase.ItemSizeText />
                      </div>

                      <div className="text-xs text-gray-500">
                        {slingshotFile?.progress &&
                          (slingshotFile?.status === 'done' ? (
                            <span>Done</span>
                          ) : (
                            <span>{slingshotFile?.progress}%</span>
                          ))}
                      </div>

                      {slingshotFile?.progress &&
                        slingshotFile?.status !== 'done' && (
                          <Progress
                            value={slingshotFile?.progress ?? 0}
                            className="absolute bottom-0 right-0 left-0 h-1"
                          />
                        )}

                      <FileUploadBase.ItemDeleteTrigger asChild>
                        <Button variant="ghost" size="icon">
                          ✕
                        </Button>
                      </FileUploadBase.ItemDeleteTrigger>
                    </FileUploadBase.Item>
                  )
                })}
              </FileUploadBase.ItemGroup>

              <FileUploadBase.HiddenInput />
            </>
          )
        }}
      </FileUploadBase.Context>
    </FileUploadBase.Root>
  )
}
