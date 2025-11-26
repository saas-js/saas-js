export interface IconSetInfo {
  name: string
  prefix: string
  total?: number
  version?: string
  author?: string
  license?: {
    title: string
    url?: string
  }
  category?: string
  samples?: string[]
}

export async function listIconSets(): Promise<Record<string, IconSetInfo>> {
  const url = 'https://api.iconify.design/collections'

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icon sets: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching icon sets:', error)
    throw error
  }
}

export async function listCommand() {
  try {
    console.log('Fetching available icon sets...\n')
    const iconSets = await listIconSets()

    const iconSetEntries = Object.entries(iconSets).sort(([a], [b]) =>
      a.localeCompare(b),
    )

    console.log(`Found ${iconSetEntries.length} icon sets:\n`)

    // Group by category if available
    const categorized: Record<string, Array<[string, IconSetInfo]>> = {}
    const uncategorized: Array<[string, IconSetInfo]> = []

    for (const [prefix, info] of iconSetEntries) {
      const category = (info as any).category || null
      if (category) {
        if (!categorized[category]) {
          categorized[category] = []
        }
        categorized[category].push([prefix, info])
      } else {
        uncategorized.push([prefix, info])
      }
    }

    // Display categorized icon sets
    for (const [category, sets] of Object.entries(categorized).sort()) {
      console.log(`${category}:`)
      for (const [prefix, info] of sets) {
        const total = (info as any).total ? ` (${(info as any).total} icons)` : ''
        const version = (info as any).version ? ` v${(info as any).version}` : ''
        const name = (info as any).name
        console.log(`  ${prefix}${version}${total}`)
        if (name && name !== prefix) {
          console.log(`    ${name}`)
        }
      }
      console.log()
    }

    // Display uncategorized
    if (uncategorized.length > 0) {
      console.log('Other:')
      for (const [prefix, info] of uncategorized) {
        const total = (info as any).total ? ` (${(info as any).total} icons)` : ''
        const version = (info as any).version ? ` v${(info as any).version}` : ''
        const name = (info as any).name
        console.log(`  ${prefix}${version}${total}`)
        if (name && name !== prefix) {
          console.log(`    ${name}`)
        }
      }
      console.log()
    }

    console.log(
      `💡 Use 'icons search <query>' to search for specific icons`,
    )
    console.log(
      `💡 Use 'icons add --set <prefix> <icon-name>' to add icons to your project`,
    )
  } catch (error) {
    console.error('Error listing icon sets:', error)
    process.exit(1)
  }
}

