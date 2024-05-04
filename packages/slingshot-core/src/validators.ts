export const checkFileType = (
  type: string,
  allowedFileTypes: string[] | RegExp | string,
) => {
  if (allowedFileTypes instanceof RegExp) {
    return allowedFileTypes.test(type)
  }

  if (Array.isArray(allowedFileTypes)) {
    return allowedFileTypes.includes(type)
  }

  if (allowedFileTypes && allowedFileTypes !== type) {
    return false
  }

  return true
}

export const checkFileSize = (size: number, maxSize?: number) => {
  if (!maxSize) {
    return true
  }
  return size <= maxSize
}
