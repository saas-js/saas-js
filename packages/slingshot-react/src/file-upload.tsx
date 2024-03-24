import { useState } from 'react'

import { FileUpload as FileUploadBase } from '@ark-ui/react/file-upload'
import type {
  FileUploadRootProps as FileUploadBaseRootProps,
  FileUploadContext,
} from '@ark-ui/react/file-upload'

import { createSlingshotClient } from '@saas-js/slingshot/client'

export interface FileUploadRenderContext extends FileUploadContext {
  urls: string[]
  client: ReturnType<typeof createSlingshotClient>
}

export interface FileUploadRootProps extends FileUploadBaseRootProps {
  profile: string
  baseUrl: string
  meta: Record<string, string | number>
  children: (context: FileUploadRenderContext) => React.ReactNode
}

export const Root = (props: FileUploadRootProps) => {
  const { profile, baseUrl, meta, onFileAccept, ...rest } = props

  const [client] = useState(createSlingshotClient(props))

  const [urls, setUrl] = useState<string[]>([])

  return (
    <FileUploadBase.Root
      maxFiles={1}
      onFileAccept={(details) => {
        client.upload(details.files[0], props.meta).then((data) => {
          setUrl((urls) => urls.concat(data.url))
        })

        onFileAccept?.(details)
      }}
      {...rest}
    >
      {(api) => {
        return props.children({ ...api, urls, client })
      }}
    </FileUploadBase.Root>
  )
}

export const Label = FileUploadBase.Label
export const Dropzone = FileUploadBase.Dropzone
export const Trigger = FileUploadBase.Trigger
export const ItemGroup = FileUploadBase.ItemGroup
export const Item = FileUploadBase.Item
export const ItemPreview = FileUploadBase.ItemPreview
export const ItemPreviewImage = FileUploadBase.ItemPreviewImage
export const ItemName = FileUploadBase.ItemName
export const ItemSizeText = FileUploadBase.ItemSizeText
export const ItemDeleteTrigger = FileUploadBase.ItemDeleteTrigger
