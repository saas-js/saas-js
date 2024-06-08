import { FileUploadRootProps } from '@saas-js/slingshot-react'

import * as FileUploadBase from '#components/ui/file-upload'
import { Button } from '#components/ui/button'
import { Box } from '#styled-system/jsx'

import { Progress } from './ui/progress'

export const FileUpload = (props: Omit<FileUploadRootProps, 'children'>) => {
  return (
    <FileUploadBase.Root {...props}>
      Test
      <FileUploadBase.Context>
        {(api) => {
          const status = api.slingshot.status

          const slingshotFiles = api.slingshot.getFiles()

          return (
            <>
              <FileUploadBase.Dropzone minH="auto">
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
                    <FileUploadBase.Item
                      key={id}
                      file={file}
                      gridTemplateAreas="
                    'preview name status delete'
                    'preview size status delete'"
                    >
                      <FileUploadBase.ItemPreview type="image/*">
                        <FileUploadBase.ItemPreviewImage
                          style={{ width: '100px' }}
                        />
                      </FileUploadBase.ItemPreview>
                      <FileUploadBase.ItemPreview type=".*"></FileUploadBase.ItemPreview>
                      <FileUploadBase.ItemName />
                      <FileUploadBase.ItemSizeText />

                      <Box gridArea="status">
                        {slingshotFile?.progress &&
                          slingshotFile?.status !== 'done' && (
                            <Progress
                              value={slingshotFile?.progress}
                              type="circular"
                              colorPalette="green"
                            />
                          )}
                        {slingshotFile?.status === 'done' ? 'Done' : null}
                      </Box>

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
