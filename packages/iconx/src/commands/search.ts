export interface SearchResult {
  icons: string[]
  total?: number
  limit?: number
  start?: number
  collections?: string[]
}

export async function searchIcons(
  query: string,
  iconSet?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams({ query })
  if (iconSet) {
    params.append('prefix', iconSet)
  }

  const url = `https://api.iconify.design/search?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to search icons: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error searching icons:', error)
    throw error
  }
}

export async function searchCommand({
  query,
  iconSet,
  limit = 20,
}: {
  query: string
  iconSet?: string
  limit?: number
}) {
  try {
    if (!query || query.trim().length === 0) {
      console.error('Error: Search query is required')
      console.log('Usage: icons search <query> [--set <icon-set>]')
      process.exit(1)
    }

    const searchQuery = query.trim()
    const scope = iconSet ? ` in "${iconSet}"` : ' across all icon sets'

    console.log(`Searching for "${searchQuery}"${scope}...\n`)

    const results = await searchIcons(searchQuery, iconSet)

    if (!results.icons || results.icons.length === 0) {
      console.log(`No icons found matching "${searchQuery}"${scope}`)
      if (!iconSet) {
        console.log('\n💡 Try specifying an icon set: icons search <query> --set <icon-set>')
      }
      return
    }

    const icons = results.icons.slice(0, limit)
    const total = results.total || icons.length
    const showing = icons.length

    if (iconSet) {
      // When searching within a specific icon set, results are just icon names
      console.log(`Found ${total} icon${total !== 1 ? 's' : ''} in ${iconSet}:\n`)
      for (const iconName of icons) {
        console.log(`  ${iconName}`)
      }
      if (showing < total) {
        console.log(`\n  ... and ${total - showing} more (showing first ${showing})`)
      }
    } else {
      // When searching across all sets, results are in format "prefix:icon-name"
      const iconMap = new Map<string, string[]>()
      for (const iconName of icons) {
        // Icon names in search results are in format "prefix:icon-name"
        if (iconName.includes(':')) {
          const [prefix, name] = iconName.split(':', 2)
          if (!iconMap.has(prefix)) {
            iconMap.set(prefix, [])
          }
          iconMap.get(prefix)!.push(name)
        } else {
          // Fallback: if no prefix, treat as icon name only
          if (!iconMap.has('unknown')) {
            iconMap.set('unknown', [])
          }
          iconMap.get('unknown')!.push(iconName)
        }
      }

      console.log(`Found ${total} icon${total !== 1 ? 's' : ''} across ${iconMap.size} icon set${iconMap.size !== 1 ? 's' : ''}:\n`)

      for (const [prefix, iconNames] of Array.from(iconMap.entries()).sort()) {
        console.log(`${prefix}:`)
        const displayCount = Math.min(iconNames.length, 10)
        for (const iconName of iconNames.slice(0, displayCount)) {
          console.log(`  ${iconName}`)
        }
        if (iconNames.length > displayCount) {
          console.log(`  ... and ${iconNames.length - displayCount} more`)
        }
        console.log()
      }

      if (showing < total) {
        console.log(`Showing first ${showing} of ${total} results`)
      }
    }

    console.log(
      `\n💡 Use 'icons add --set <icon-set> <icon-name>' to add icons to your project`,
    )
    if (!iconSet) {
      console.log(
        `💡 Use 'icons search <query> --set <icon-set>' to search within a specific icon set`,
      )
    }
  } catch (error) {
    console.error('Error searching icons:', error)
    process.exit(1)
  }
}

