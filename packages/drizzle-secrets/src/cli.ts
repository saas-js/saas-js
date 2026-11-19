#!/usr/bin/env node
import { parseArgs } from 'node:util'

import { generateKey, isEncrypted } from './crypto'
import { createSecrets } from './secrets'

const HELP = `
Usage: drizzle-secrets <command> [options]

Commands:
  generate-key              Generate a new 256-bit encryption key
  encrypt <value>           Encrypt a plaintext value
  decrypt <value>           Decrypt an encrypted value

Options:
  --key, -k <key>           Encryption key (base64). Defaults to ENCRYPTION_KEY env var
  --help, -h                Show this help message

Examples:
  drizzle-secrets generate-key
  drizzle-secrets encrypt "sk-abc123" --key "base64key..."
  ENCRYPTION_KEY="base64key..." drizzle-secrets encrypt "sk-abc123"
  ENCRYPTION_KEY="base64key..." drizzle-secrets decrypt 'enc$default$...'
`.trim()

function getKey(key: string | undefined): string {
  const resolved = key || process.env.ENCRYPTION_KEY
  if (!resolved) {
    console.error(
      'Error: No encryption key provided. Use --key or set ENCRYPTION_KEY env var.',
    )
    process.exit(1)
  }
  return resolved
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      key: { type: 'string', short: 'k' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (values.help || positionals.length === 0) {
    console.log(HELP)
    process.exit(0)
  }

  const [command, ...args] = positionals

  switch (command) {
    case 'generate-key': {
      const newKey = generateKey()
      console.log(newKey)
      break
    }

    case 'encrypt': {
      const value = args[0]
      if (!value) {
        console.error('Error: Missing value to encrypt.')
        console.error('Usage: drizzle-secrets encrypt <value>')
        process.exit(1)
      }

      const secrets = createSecrets(getKey(values.key))
      console.log(secrets.encrypt(value))
      break
    }

    case 'decrypt': {
      const value = args[0]
      if (!value) {
        console.error('Error: Missing value to decrypt.')
        console.error('Usage: drizzle-secrets decrypt <value>')
        process.exit(1)
      }

      if (!isEncrypted(value)) {
        console.error('Error: Value does not appear to be encrypted.')
        process.exit(1)
      }

      const secrets = createSecrets(getKey(values.key))
      try {
        console.log(secrets.decrypt(value))
      } catch (err: unknown) {
        console.error(
          'Error: Decryption failed. Wrong key or corrupted value.',
          err,
        )
        process.exit(1)
      }
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      console.log(HELP)
      process.exit(1)
  }
}

main()
