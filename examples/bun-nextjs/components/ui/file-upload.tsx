'use client'

import { type ComponentProps, forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { FileUpload } from '@saas-js/slingshot-react'

export const Context = FileUpload.Context
export const HiddenInput = FileUpload.HiddenInput

export const Root = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof FileUpload.Root>
>((props, ref) => {
  const { className, ...rest } = props
  return <FileUpload.Root {...rest} className={cn('', className)} ref={ref} />
})

Root.displayName = 'FileUploadRoot'

export const Dropzone = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof FileUpload.Dropzone>
>((props, ref) => {
  const { className, ...rest } = props
  return (
    <FileUpload.Dropzone
      {...rest}
      className={cn(
        'flex flex-col items-center justify-center rounded-md border-dashed border-2 border-gray-300 p-4 gap-4',
        className,
      )}
      ref={ref}
    />
  )
})

Dropzone.displayName = 'FileUploadDropzone'

export const Item = forwardRef<
  HTMLLIElement,
  ComponentProps<typeof FileUpload.Item>
>((props, ref) => {
  const { className, ...rest } = props
  return <FileUpload.Item {...rest} className={cn('', className)} ref={ref} />
})

Item.displayName = 'FileUploadItem'

export const ItemDeleteTrigger = FileUpload.ItemDeleteTrigger

export const ItemGroup = forwardRef<
  HTMLUListElement,
  ComponentProps<typeof FileUpload.ItemGroup>
>((props, ref) => {
  const { className, ...rest } = props
  return (
    <FileUpload.ItemGroup {...rest} className={cn('', className)} ref={ref} />
  )
})

ItemGroup.displayName = 'FileUploadItemGroup'

export const ItemName = forwardRef<
  HTMLSpanElement,
  ComponentProps<typeof FileUpload.ItemName>
>((props, ref) => {
  const { className, ...rest } = props
  return (
    <FileUpload.ItemName {...rest} className={cn('', className)} ref={ref} />
  )
})

ItemName.displayName = 'FileUploadItemName'

export const ItemPreview = FileUpload.ItemPreview
export const ItemPreviewImage = FileUpload.ItemPreviewImage

export const ItemSizeText = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof FileUpload.ItemSizeText>
>((props, ref) => {
  const { className, ...rest } = props
  return (
    <FileUpload.ItemSizeText
      {...rest}
      className={cn('', className)}
      ref={ref}
    />
  )
})

ItemSizeText.displayName = 'FileUploadItemSizeText'

export const Label = forwardRef<
  HTMLLabelElement,
  ComponentProps<typeof FileUpload.Label>
>((props, ref) => {
  const { className, ...rest } = props
  return <FileUpload.Label {...rest} className={cn('', className)} ref={ref} />
})

Label.displayName = 'FileUploadLabel'

export const Trigger = FileUpload.Trigger
