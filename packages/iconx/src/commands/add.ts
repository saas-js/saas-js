import readline from 'readline'

import { fetchAndWriteIcons, readIconsConfig } from '../fetch-icons.ts'

/**
 * Parses icon names that may contain inline aliases using colon syntax.
 * Examples:
 * - "home:house" -> iconName: "home", alias: "house"
 * - "user" -> iconName: "user", alias: undefined
 *
 * @returns Object with actual icon names and inline aliases map
 */
export function parseIconNamesWithAliases(
  iconNames: string[],
): {
  iconNames: string[]
  inlineAliases: Record<string, string>
} {
  const actualIconNames: string[] = []
  const inlineAliases: Record<string, string> = {}

  for (const iconArg of iconNames) {
    if (iconArg.includes(':')) {
      const [iconName, alias] = iconArg.split(':', 2)
      if (!iconName || !alias) {
        throw new Error(
          `Invalid alias syntax: "${iconArg}". Expected format: "icon-name:alias-name"`,
        )
      }
      actualIconNames.push(iconName)
      inlineAliases[iconName] = alias
    } else {
      actualIconNames.push(iconArg)
    }
  }

  return { iconNames: actualIconNames, inlineAliases }
}

async function promptOverwrite(fileName: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(
      `File ${fileName} already exists. Overwrite? (y/n): `,
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      },
    )
  })
}

export async function addCommand({
  iconSet,
  iconNames,
  outputDir,
}: {
  iconSet?: string
  iconNames: string[]
  outputDir?: string
}) {
  try {
    const config = await readIconsConfig()

    // Parse inline aliases from icon names (colon syntax: "home:house")
    const { iconNames: actualIconNames, inlineAliases } =
      parseIconNamesWithAliases(iconNames)

    // Merge config aliases with inline aliases (inline aliases take precedence)
    const mergedAliases = {
      ...config.aliases,
      ...inlineAliases,
    }

    const allIconNames = await fetchAndWriteIcons({
      iconSet: iconSet ?? config.defaultIconSet,
      iconNames: actualIconNames,
      iconSize: config.iconSize,
      outputDir: outputDir ?? config.outputDir,
      aliases: mergedAliases,
      generateIndex: config.generateIndex,
      shouldOverwrite: async (fileName: string) => {
        return promptOverwrite(fileName)
      },
    })

    console.log(
      `\nSuccessfully generated ${allIconNames.length} icon components!`,
    )
  } catch (error) {
    console.error('Error generating icons:', error)
  }
}
