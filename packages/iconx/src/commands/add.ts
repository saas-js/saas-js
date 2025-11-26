import readline from 'readline'

import { fetchAndWriteIcons, readIconsConfig } from '../fetch-icons.ts'

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

    const allIconNames = await fetchAndWriteIcons({
      iconSet: iconSet ?? config.defaultIconSet,
      iconNames,
      iconSize: config.iconSize,
      outputDir: outputDir ?? config.outputDir,
      aliases: config.aliases,
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
