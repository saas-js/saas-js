'use client'

import type { ComponentProps } from 'react'

import { createStyleContext } from '@/lib/create-style-context'
import { tv } from 'tailwind-variants'

import { FileUpload } from '@saas-js/slingshot-react'

const fileUpload = tv({
  slots: {
    root: 'file-upload',
    dropzone: 'file-upload-dropzone',
    item: 'file-upload-item',
    itemDeleteTrigger: 'file-upload-item-delete-trigger',
    itemGroup: 'file-upload-item-group',
    itemName: 'file-upload-item-name',
    itemPreview: 'file-upload-item-preview',
    itemPreviewImage: 'file-upload-item-preview-image',
    itemSizeText: 'file-upload-item-size-text',
    label: 'file-upload-label',
    trigger: 'file-upload-trigger',
  },
})

const { withProvider, withContext } = createStyleContext(fileUpload)

export const Context = FileUpload.Context
export const HiddenInput = FileUpload.HiddenInput
export const Root = withProvider(FileUpload.Root, 'root')
export const Dropzone = withContext(FileUpload.Dropzone, 'dropzone')
export const Item = withContext(FileUpload.Item, 'item')
export const ItemDeleteTrigger = withContext(
  FileUpload.ItemDeleteTrigger,
  'itemDeleteTrigger',
)
export const ItemGroup = withContext(FileUpload.ItemGroup, 'itemGroup')
export const ItemName = withContext(FileUpload.ItemName, 'itemName')
export const ItemPreview = withContext(FileUpload.ItemPreview, 'itemPreview')
export const ItemPreviewImage = withContext(
  FileUpload.ItemPreviewImage,
  'itemPreviewImage',
)
export const ItemSizeText = withContext(FileUpload.ItemSizeText, 'itemSizeText')
export const Label = withContext(FileUpload.Label, 'label')
export const Trigger = withContext(FileUpload.Trigger, 'trigger')

export interface RootProps extends ComponentProps<typeof Root> {}
export interface DropzoneProps extends ComponentProps<typeof Dropzone> {}
export interface ItemProps extends ComponentProps<typeof Item> {}
export interface ItemDeleteTriggerProps
  extends ComponentProps<typeof ItemDeleteTrigger> {}
export interface ItemGroupProps extends ComponentProps<typeof ItemGroup> {}
export interface ItemNameProps extends ComponentProps<typeof ItemName> {}
export interface ItemPreviewProps extends ComponentProps<typeof ItemPreview> {}
export interface ItemPreviewImageProps
  extends ComponentProps<typeof ItemPreviewImage> {}
export interface ItemSizeTextProps
  extends ComponentProps<typeof ItemSizeText> {}
export interface LabelProps extends ComponentProps<typeof Label> {}
export interface TriggerProps extends ComponentProps<typeof Trigger> {}
