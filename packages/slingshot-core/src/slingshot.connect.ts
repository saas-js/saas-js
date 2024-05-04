import { FileAcceptDetails } from '@zag-js/file-upload'
import { NormalizeProps, PropTypes } from '@zag-js/types'

import { Send, State } from './slingshot.machine'
import { SlingshotFile } from './slingshot.types'

export interface MachineApi<T extends PropTypes> {
  upload(files: File[]): void
  getFiles(): SlingshotFile[]
  status: 'idle' | 'uploading' | 'done' | 'failed' | 'aborted'
  progress?: number
  rootProps: T['element'] & {
    onFileAccept?: (details: FileAcceptDetails) => void
  }
}

export function connect<T extends PropTypes>(
  state: State,
  send: Send,
  normalize: NormalizeProps<T>,
): MachineApi<T> {
  const status = state.context?.status
  const uploadOnAccept = state.context?.uploadOnAccept
  const progress = 0

  const upload = (files: File[]) => {
    send({ type: 'UPLOAD', files })
  }

  return {
    upload,
    getFiles() {
      return Object.values(state.context?.files ?? {})
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
