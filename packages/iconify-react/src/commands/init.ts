import fs from 'fs/promises'
import path from 'path'
import readline from 'readline'

import type { IconifyConfig } from '../types.ts'

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    const displayDefault = defaultValue ? ` (default: ${defaultValue})` : ''
    rl.question(`${question}${displayDefault}: `, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

export async function initCommand() {
  const configPath = path.join(process.cwd(), 'icons.json')

  // Check if config already exists
  try {
    await fs.access(configPath)
    const overwrite = await prompt('icons.json already exists. Overwrite?', 'n')
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Initialization cancelled.')
      return
    }
  } catch {
    // File doesn't exist, continue
  }

  console.log('Creating icons.json configuration...\n')

  const config: IconifyConfig = {}

  // Output directory
  const outputDir = await prompt(
    'Output directory for generated icons',
    '/src/components/icons'
  )
  if (outputDir) {
    config.outputDir = outputDir
  }

  // Default icon set
  const defaultIconSet = await prompt(
    'Default icon set (e.g., lucide, tabler, heroicons)',
    'lucide'
  )
  if (defaultIconSet) {
    config.defaultIconSet = defaultIconSet
  }

  // Icon size
  const iconSize = await prompt(
    'Default icon size',
    '1em'
  )
  if (iconSize) {
    config.iconSize = iconSize
  }

  // Write config file
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    console.log('\n✅ icons.json created successfully!')
    console.log('Configuration:')
    console.log(JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Error creating icons.json:', error)
    process.exit(1)
  }
}