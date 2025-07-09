export interface IconifyIcon {
  body: string
  width?: number
  height?: number
  viewBox?: string
}

export interface IconifyIconSet {
  prefix: string
  name: string
  license: {
    title: string
    url: string
  }
  version: string
}

export interface IconifyConfig {
  outputDir?: string
  defaultIconSet?: string
  iconSize?: string | number
}
