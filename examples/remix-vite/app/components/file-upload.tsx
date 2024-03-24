import { FileUploadRootProps } from '@saas-js/slingshot-react'

import * as FileUploadBase from '#components/ui/file-upload'
import { Button } from '#components/ui/button'

export const FileUpload = (props: Omit<FileUploadRootProps, 'children'>) => {
  return (
    <FileUploadBase.Root {...props}>
      {(api) => {
        /**
         * api.client.upload(api.files[0], props.meta)
         */
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
              {(files) =>
                files.map((file, id) => (
                  <FileUploadBase.Item key={id} file={file}>
                    <FileUploadBase.ItemPreview type="image/*">
                      <FileUploadBase.ItemPreviewImage
                        style={{ width: '100px' }}
                      />
                    </FileUploadBase.ItemPreview>
                    <FileUploadBase.ItemPreview type=".*"></FileUploadBase.ItemPreview>
                    <FileUploadBase.ItemName />
                    <FileUploadBase.ItemSizeText />
                    <span>{api.urls[id]}</span>
                    <FileUploadBase.ItemDeleteTrigger>
                      X
                    </FileUploadBase.ItemDeleteTrigger>
                  </FileUploadBase.Item>
                ))
              }
            </FileUploadBase.ItemGroup>
            {api.urls.map((url) => (
              <input key={url} type="hidden" name={props.profile} value={url} />
            ))}
          </>
        )
      }}
    </FileUploadBase.Root>
  )
}
