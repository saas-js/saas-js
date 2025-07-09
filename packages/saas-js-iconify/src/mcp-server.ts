#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import pkg from '../package.json' with { type: 'json' }

import { fetchAndWriteIcons } from './fetch-icons.ts'

/** Create server instance */
const server = new McpServer({
  name: 'iconify-mcp',
  version: pkg.version,
  capabilities: {
    tools: {},
  },
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

server.tool(
  'search_icons',
  'search for icons',
  {
    iconSet: z.string().describe("The icon set to use. E.g. 'lucide'"),
    query: z.string().describe("The query to search for. E.g. 'home'"),
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

server.tool(
  'add_icons',
  'add icons to the project',
  {
    iconSet: z
      .string()
      .optional()
      .describe("The icon set to use. E.g. 'tabler' (optional if defaultIconSet is configured)"),
    iconNames: z
      .array(z.string())
      .min(1)
      .describe("The icon names to add. E.g. 'home'"),
    outputDir: z
      .string()
      .optional()
      .describe("Output directory for generated icons (optional)"),
  },
  async (args) => {
    const { iconSet, iconNames, outputDir } = args as {
      iconSet?: string
      iconNames: string[]
      outputDir?: string
    }

    const addedIconNames = await fetchAndWriteIcons(
      iconSet,
      iconNames,
      outputDir,
    )

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
