import fs from 'fs/promises'
import path from 'path'

import { generateIconComponent } from './generate-icon-component.ts'
import type { IconifyConfig, IconifyIcon, IconifyIconSet } from './types.ts'

export async function fetchIconSet(prefix: string): Promise<IconifyIconSet> {
  const url = `https://api.iconify.design/collections?prefix=${prefix}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch icon set: ${response.statusText}`)
  }
  const data = await response.json()
  return {
    prefix,
    ...data[prefix],
  }
}

export interface IconifyResponse {
  icons: Record<string, IconifyIcon>
  width?: number
  height?: number
}

export async function fetchIconData(
  iconSet: string,
  iconNames: string[],
): Promise<IconifyResponse> {
  const url = `https://api.iconify.design/${iconSet}.json?icons=${iconNames.join(',')}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icons: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching icon data:', error)
    throw error
  }
}

export async function readIconsConfig(): Promise<IconifyConfig> {
  const configPath = path.join(process.cwd(), 'icons.json')

  try {
    const configContent = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(configContent)
  } catch (error) {
    // Config file doesn't exist or is invalid, return empty config
    return {}
  }
}

function resolveIconAliases(
  iconNames: string[],
  aliases: Record<string, string> = {},
): string[] {
  // No resolution needed - we search for the requested icon name directly
  return iconNames
}

export async function fetchAndWriteIcons(args: {
  iconSet: string | undefined
  iconNames: string[]
  outputDir?: string
  iconSize?: string | number
  aliases?: Record<string, string>
  shouldOverwrite?: (fileName: string) => Promise<boolean>
}): Promise<string[]> {
  const { iconSet, iconNames, iconSize, outputDir, aliases, shouldOverwrite } =
    args

  if (!iconSet) {
    throw new Error(
      'No icon set specified and no defaultIconSet configured in icons.json',
    )
  }

  console.log(`Fetching ${iconNames.length} icons from ${iconSet}...`)

  const finalOutputDir = outputDir || '/src/components/icons'
  const resolvedOutputDir = path.join(process.cwd(), finalOutputDir)

  // Resolve icon aliases
  const resolvedIconNames = resolveIconAliases(iconNames, aliases)

  console.log(`Output directory: ${resolvedOutputDir}`)

  // Ensure output directory exists
  await fs.mkdir(resolvedOutputDir, { recursive: true })

  const allIconNames: string[] = []

  const iconSetData = await fetchIconSet(iconSet)

  // Fetch and generate components for the icon set
  const iconData = await fetchIconData(iconSet, resolvedIconNames)

  for (const iconName of iconNames) {
    if (iconData.icons[iconName]) {
      // Use alias as output name if it exists, otherwise use the requested name
      const outputName = aliases?.[iconName] || iconName

      const componentCode = generateIconComponent(
        outputName,
        iconData.icons[iconName],
        iconSetData,
        iconData.width,
        iconData.height,
        iconSize,
      )

      const fileName = outputName
      const filePath = path.join(resolvedOutputDir, `${fileName}-icon.tsx`)

      // Check if file already exists
      try {
        await fs.access(filePath)

        if (!(await shouldOverwrite?.(fileName))) {
          console.log(`Skipped ${fileName}-icon.tsx`)
          continue
        }
      } catch {
        // File doesn't exist, continue with creation
      }

      await fs.writeFile(filePath, componentCode)

      allIconNames.push(outputName)
      console.log(
        `Generated ${fileName}-icon.tsx${outputName !== iconName ? ` (${iconName} -> ${outputName})` : ''}`,
      )
    } else {
      console.warn(`Icon ${iconName} not found in ${iconSet}`)
    }
  }

  return allIconNames
}
