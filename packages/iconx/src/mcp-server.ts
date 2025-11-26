#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'

import pkg from '../package.json' with { type: 'json' }

import { fetchAndWriteIcons, readIconsConfig } from './fetch-icons.ts'

/** Create server instance */
const server = new McpServer({
  name: 'iconify-mcp',
  version: pkg.version,
})

async function main() {
  console.log('Starting Saas UI MCP server...')

  const transport = new StdioServerTransport()

  await server.connect(transport)
}

async function searchIcons(
  iconSet: string,
  query: string,
): Promise<{
  icons: string[]
}> {
  const url = `https://api.iconify.design/search?query=${query}&prefix=${iconSet}`

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

server.registerTool(
  'search_icons',
  {
    title: 'Search icons',
    description: 'Search for icons in the Iconify library',
    /** @ts-ignore */
    inputSchema: z.object({
      iconSet: z.string().describe("The icon set to use. E.g. 'lucide'"),
      query: z.string().describe("The query to search for. E.g. 'home'"),
    }),
  },
  async (args) => {
    const { iconSet, query } = args

    const results = await searchIcons(iconSet, query)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results),
        },
      ],
    }
  },
)

server.registerTool(
  'add_icons',
  {
    title: 'Add icons',
    description: 'Add icons to the project',
    /** @ts-ignore */
    inputSchema: z.object({
      iconSet: z.string().optional().describe("The icon set to use. E.g. 'tabler' (optional if defaultIconSet is configured)"),
      iconNames: z.array(z.string()).min(1).describe("The icon names to add. E.g. 'home'"),
      outputDir: z.string().optional().describe("Output directory for generated icons (optional)"),
    }),
  },
  async (args) => {
    const { iconSet, iconNames, outputDir } = args as {
      iconSet?: string
      iconNames: string[]
      outputDir?: string
    }

    const config = await readIconsConfig()

    const addedIconNames = await fetchAndWriteIcons({
      iconSet,
      iconNames,
      outputDir: outputDir ?? config.outputDir ,
      aliases: config.aliases,
      iconSize: config.iconSize,
    })

    return {
      content: [
        {
          type: 'text',
          text: `Added ${addedIconNames.length} icons to the project`,
        },
      ],
    }
  },
)

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
