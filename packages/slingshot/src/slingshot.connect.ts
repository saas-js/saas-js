import type { Service } from '@zag-js/core'
import { FileAcceptDetails } from '@zag-js/file-upload'
import { NormalizeProps, PropTypes } from '@zag-js/types'

import type { SlingshotSchema, UploadStatus } from './slingshot.machine'
import { SlingshotFile } from './slingshot.types'

export interface MachineApi<T extends PropTypes> {
  upload(files: File[]): void
  getFiles(): SlingshotFile[]
  status: UploadStatus
  progress?: number
  rootProps: T['element'] & {
    onFileAccept?: (details: FileAcceptDetails) => void
  }
}

export function connect<T extends PropTypes>(
  service: Service<SlingshotSchema>,
  normalize: NormalizeProps<T>,
): MachineApi<T> {
  const { prop, context, send } = service

  const status = context.get('status')

  const uploadOnAccept = prop('uploadOnAccept')

  const progress = 0

  const upload = (files: File[]) => {
    send({ type: 'UPLOAD', files })
  }

  return {
    upload,
    getFiles() {
      const files = context.get('files')
      return files ? Array.from(files.values()) : []
    },
    status,
    progress,
    rootProps: normalize.element({
      onFileAccept: (details) => {
        if (uploadOnAccept) {
          upload(details.files)
        }
      },
    }),
  }
}
