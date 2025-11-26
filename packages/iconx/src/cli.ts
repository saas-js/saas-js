#!/usr/bin/env node
import { Command } from 'commander'
import pkg from '../package.json' with { type: 'json' }

const program = new Command()

program
  .name('iconx')
  .description('Install iconify icons into your project as React components')
  .addHelpText('afterAll', '\nDocumentation: https://www.saas-js.com/docs/\nSupport Iconify: https://iconify.design/sponsors/')
  .version(pkg.version)

program
  .command('init')
  .description('Initialize icons.json configuration file')
  .action(async () => {
    const { initCommand } = await import('./commands/init.ts')
    await initCommand()
  })

program
  .command('add')
  .description('Add icons to the project')
  .argument('<icon-names...>', 'The icon names to add, e.g. "home user"')
  .option('-s, --set <icon-set>', 'The icon set to use, e.g. "lucide" (optional if defaultIconSet is configured)')
  .option('-o, --outdir <path>', 'Output directory for generated icons')
  .action(async (iconNames: string[], options: { set?: string; outdir?: string }) => {
    const { addCommand } = await import('./commands/add.ts')

    await addCommand({ iconSet: options.set, iconNames, outputDir: options.outdir })
  })

program
  .command('list')
  .description('List all available icon sets')
  .action(async () => {
    const { listCommand } = await import('./commands/list.ts')
    await listCommand()
  })

program
  .command('search')
  .description('Search for icons by name')
  .argument('<query>', 'The search query, e.g. "home"')
  .option('-s, --set <icon-set>', 'Search within a specific icon set (optional)')
  .option('-l, --limit <number>', 'Maximum number of results to show', '20')
  .action(async (query: string, options: { set?: string; limit?: string }) => {
    const { searchCommand } = await import('./commands/search.ts')
    await searchCommand({
      query,
      iconSet: options.set,
      limit: options.limit ? parseInt(options.limit, 10) : 20,
    })
  })

program
  .command('mcp')
  .description('Start the MCP server. Uses STDIO transport.')
  .action(async () => {
    // Dynamically import the mcp-server entrypoint
    await import('./mcp-server.ts')
  })

program.parse(process.argv)
