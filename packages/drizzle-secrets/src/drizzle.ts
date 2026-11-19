import { customType } from 'drizzle-orm/pg-core'

import { isEncrypted } from './crypto'
import { SecretValue, expose, mask } from './secret-value'
import type { Secrets, SecretsConfig } from './secrets'
import { createSecrets } from './secrets'

export type SecretMode = 'masked' | 'decrypt' | 'encrypted'

export interface SecretColumnOptions {
  mode?: SecretMode
}

function resolveFromDriver(
  secrets: Secrets,
  mode: SecretMode,
  value: string,
): string | SecretValue {
  switch (mode) {
    case 'encrypted':
      return value
    case 'decrypt': {
      const plain = isEncrypted(value) ? secrets.decrypt(value) : value
      return new SecretValue(plain)
    }
    case 'masked':
    default: {
      const plain = isEncrypted(value) ? secrets.decrypt(value) : value
      return mask(plain)
    }
  }
}

export type SecretColumn = {
  /**
   * Creates a Drizzle column that transparently encrypts on write.
   * The read behavior depends on `mode`:
   *
   * - `'masked'` (default) — returns `••••` + last 4 characters
   * - `'decrypt'` — returns a `SecretValue` wrapper (use `expose()` to get the raw value)
   * - `'encrypted'` — returns the raw ciphertext as stored in the DB
   *
   * @example
   * ```ts
   * export const integrations = pgTable('integrations', {
   *   accessToken: secret('access_token'),
   *   refreshToken: secret('refresh_token', { mode: 'decrypt' }),
   * })
   *
   * // Reading the decrypted value:
   * import { expose } from 'drizzle-secrets'
   * const token = expose(row.refreshToken)
   * ```
   */
  (
    name: string,
    options?: SecretColumnOptions,
  ): ReturnType<
    ReturnType<typeof customType<{ data: string; driverData: string }>>
  >

  /** The underlying Secrets instance for manual encrypt/decrypt. */
  secrets: Secrets
}

/**
 * Creates a Drizzle-compatible encrypted column factory.
 * No global state — the Secrets instance lives inside the returned function.
 *
 * @example
 * ```ts
 * import { createDrizzleSecret } from 'drizzle-secrets/drizzle'
 *
 * const secret = createDrizzleSecret(process.env.ENCRYPTION_KEY!)
 *
 * export const integrations = pgTable('integrations', {
 *   accessToken: secret('access_token'),
 *   refreshToken: secret('refresh_token', { mode: 'decrypt' }),
 * })
 * ```
 */
export function createDrizzleSecret(encryptionKey: string): SecretColumn
export function createDrizzleSecret(config: SecretsConfig): SecretColumn
export function createDrizzleSecret(secrets: Secrets): SecretColumn
export function createDrizzleSecret(
  input: string | SecretsConfig | Secrets,
): SecretColumn {
  const secrets =
    input instanceof Object && 'encrypt' in input
      ? (input as Secrets)
      : typeof input === 'string'
        ? createSecrets(input)
        : createSecrets(input as SecretsConfig)

  const secret: SecretColumn = Object.assign(
    (name: string, options?: SecretColumnOptions) => {
      const mode = options?.mode ?? 'masked'

      return customType<{ data: string; driverData: string }>({
        dataType() {
          return 'text'
        },
        toDriver(value: string): string {
          const raw =
            (value as unknown) instanceof SecretValue
              ? expose(value as unknown as SecretValue)
              : value
          if (isEncrypted(raw)) return raw
          return secrets.encrypt(raw)
        },
        fromDriver(value: string): string {
          return resolveFromDriver(secrets, mode, value) as string
        },
      })(name)
    },
    { secrets },
  )

  return secret
}

export { mask, SecretValue, expose }
