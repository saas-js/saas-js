const matchWildcard = (pattern: string, value: string) => {
  const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
  return regex.test(value)
}

export const checkFileType = (
  type: string,
  allowedFileTypes: string[] | RegExp | string,
) => {
  if (allowedFileTypes instanceof RegExp) {
    return allowedFileTypes.test(type)
  }

  if (typeof allowedFileTypes === 'string') {
    return matchWildcard(allowedFileTypes, type)
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
