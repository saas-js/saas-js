import { forwardRef, useState } from 'react'

import { FileUpload as FileUploadBase } from '@ark-ui/react/file-upload'
import type {
  FileUploadRootProps as FileUploadBaseRootProps,
  FileUploadContext,
} from '@ark-ui/react/file-upload'
import { PropTypes, mergeProps } from '@zag-js/react'

import { Api, createSlingshotClient } from '@saas-js/slingshot/client'

import { useSlingshot } from './use-slingshot'

export interface FileUploadRenderContext extends FileUploadContext {
  slingshot: Api<PropTypes>
}

export interface FileUploadRootProps extends FileUploadBaseRootProps {
  profile: string
  baseUrl?: string
  meta: Record<string, string | number>
  uploadOnAccept?: boolean
  children: (context: FileUploadRenderContext) => React.ReactNode
}

export const Root = forwardRef<HTMLDivElement, FileUploadRootProps>(
  (props, forwardedRef) => {
    const { profile, baseUrl, meta, uploadOnAccept, children, ...rest } = props

    const [client] = useState(
      createSlingshotClient({
        baseUrl,
        profile,
      }),
    )

    const context = useSlingshot({
      client,
      meta,
      uploadOnAccept,
    })

    // TODO fix dir type
    const { dir, ...rootProps } = mergeProps(context.rootProps, rest)
    return (
      <FileUploadBase.Root ref={forwardedRef} {...rootProps}>
        {(api) => {
          return children({ ...api, slingshot: context })
        }}
      </FileUploadBase.Root>
    )
  },
)

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
