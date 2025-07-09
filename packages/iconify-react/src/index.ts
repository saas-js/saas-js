#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { fetchAndWriteIcons } from './icons.ts'

/** Create server instance */
const server = new McpServer({
  name: 'saas-ui-mcp',
  version: '1.0.0',
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
      .default('tabler')
      .describe("The icon set to use. E.g. 'tabler'"),
    iconNames: z
      .array(z.string())
      .min(1)
      .describe("The icon names to add. E.g. 'home'"),
  },
  async (args) => {
    const { iconSet, iconNames } = args

    const addedIconNames = await fetchAndWriteIcons(iconSet, iconNames)

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
