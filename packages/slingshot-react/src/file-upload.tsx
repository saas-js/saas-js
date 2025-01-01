import React, { forwardRef, useMemo } from 'react'

import { FileUpload as FileUploadBase } from '@ark-ui/react/file-upload'
import type {
  FileUploadRootProps as FileUploadBaseRootProps,
  UseFileUploadContext,
} from '@ark-ui/react/file-upload'
import { mergeProps } from '@zag-js/react'

import { createSlingshotClient } from '@saas-js/slingshot/client'

import {
  SlingshotProvider,
  UseSlingshotContext,
  useSlingshotContext,
} from './slingshot-context'
import { useSlingshot } from './use-slingshot'

export interface FileUploadContextProps {
  children: (
    context: UseFileUploadContext & { slingshot: UseSlingshotContext },
  ) => React.ReactNode
}

export interface FileUploadRootProps extends FileUploadBaseRootProps {
  /**
   * The profile to use for the slingshot client
   */
  profile: string
  /**
   * The base URL for the slingshot client
   * @default '/slingshot'
   */
  baseUrl?: string
  /**
   * Additional metadata to send with the upload
   */
  meta?: Record<string, string | number>
  /**
   * Whether to start uploading files when they are accepted
   */
  uploadOnAccept?: boolean
}

export const Root = forwardRef<HTMLDivElement, FileUploadRootProps>(
  (props, ref) => {
    const { profile, baseUrl, meta, uploadOnAccept, ...rest } = props

    const client = useMemo(
      () =>
        createSlingshotClient({
          baseUrl,
          profile,
        }),
      [baseUrl, profile],
    )

    const context = useSlingshot({
      client,
      meta,
      uploadOnAccept,
    })

    const rootProps = mergeProps(context.rootProps, rest)

    return (
      <SlingshotProvider value={context}>
        <FileUploadBase.Root ref={ref} {...rootProps} />
      </SlingshotProvider>
    )
  },
)

export const Context = (props: FileUploadContextProps) => {
  const context = useSlingshotContext()

  return (
    <FileUploadBase.Context>
      {(api) => {
        return props.children({ ...api, slingshot: context })
      }}
    </FileUploadBase.Context>
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
export const HiddenInput = FileUploadBase.HiddenInput

export type {
  FileUploadRootProps as RootProps,
  FileUploadContextProps as ContextProps,
  FileUploadLabelProps as LabelProps,
  FileUploadDropzoneProps as DropzoneProps,
  FileUploadTriggerProps as TriggerProps,
  FileUploadItemGroupProps as ItemGroupProps,
  FileUploadItemProps as ItemProps,
  FileUploadItemPreviewProps as ItemPreviewProps,
  FileUploadItemPreviewImageProps as ItemPreviewImageProps,
  FileUploadItemNameProps as ItemNameProps,
  FileUploadItemSizeTextProps as ItemSizeTextProps,
  FileUploadItemDeleteTriggerProps as ItemDeleteTriggerProps,
  FileUploadHiddenInputProps as HiddenInputProps,
  FileUploadFileAcceptDetails as FileAcceptDetails,
  FileUploadFileRejectDetails as FileRejectDetails,
  FileUploadFileChangeDetails as FileChangeDetails,
} from '@ark-ui/react'
