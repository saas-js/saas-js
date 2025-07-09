#!/usr/bin/env node
import { Command } from 'commander'
import pkg from '../package.json' with { type: 'json' }

const program = new Command()

program
  .name('iconify-react')
  .description('Install iconify icons into your project as React components')
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
  .argument('<icon-set>', 'The icon set to use, e.g. "lucide"')
  .argument('<icon-names...>', 'The icon names to add, e.g. "home user"')
  .option('-o, --outdir <path>', 'Output directory for generated icons')
  .action(async (iconSet: string, iconNames: string[], options: { outdir?: string }) => {
    const { addCommand } = await import('./commands/add.ts')

    await addCommand({ iconSet, iconNames, outputDir: options.outdir })
  })

program
  .command('mcp')
  .description('Start the MCP server. Uses STDIO transport.')
  .action(async () => {
    // Dynamically import the mcp-server entrypoint
    await import('./mcp-server.ts')
  })

program.parse(process.argv)
