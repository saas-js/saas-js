import { customType } from 'drizzle-orm/pg-core'

import { isEncrypted } from './crypto'
import { SecretValue, expose, mask } from './secret-value'
import type { Mask, MaskOptions } from './secret-value'
import type { Secrets, SecretsConfig } from './secrets'
import { createSecrets } from './secrets'

export type SecretMode = 'masked' | 'decrypt' | 'encrypted'

export interface SecretColumnOptions {
  mode?: SecretMode
  /**
   * How `'masked'` reads and `SecretValue`s display this column.
   * Overrides the `mask` passed to `createDrizzleSecret`.
   */
  mask?: Mask
}

export interface DrizzleSecretOptions {
  /** Default masking for every column created by this factory. */
  mask?: Mask
}

function resolveFromDriver(
  secrets: Secrets,
  mode: SecretMode,
  value: string,
  maskOption: Mask | undefined,
): string | SecretValue {
  switch (mode) {
    case 'encrypted':
      return value
    case 'decrypt': {
      const plain = isEncrypted(value) ? secrets.decrypt(value) : value
      return new SecretValue(plain, maskOption)
    }
    case 'masked':
    default: {
      const plain = isEncrypted(value) ? secrets.decrypt(value) : value
      return mask(plain, maskOption)
    }
  }
}

export type SecretColumn = {
  /**
   * Creates a Drizzle column that transparently encrypts on write.
   * The read behavior depends on `mode`:
   *
   * - `'masked'` (default) — returns `••••` + last 4 characters (values of
   *   12+ characters; shorter ones are fully masked). See `mask`.
   * - `'decrypt'` — returns a `SecretValue` wrapper (use `expose()` to get the raw value)
   * - `'encrypted'` — returns the raw ciphertext as stored in the DB
   *
   * @example
   * ```ts
   * export const integrations = pgTable('integrations', {
   *   accessToken: secret('access_token'),
   *   refreshToken: secret('refresh_token', { mode: 'decrypt' }),
   *   pin: secret('pin', { mask: { visible: 0 } }),
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
 * const secret = createDrizzleSecret(process.env.ENCRYPTION_KEY!, {
 *   // optional, these are the defaults
 *   mask: { visible: 4, minLength: 12, placeholder: '••••' },
 * })
 *
 * export const integrations = pgTable('integrations', {
 *   accessToken: secret('access_token'),
 *   refreshToken: secret('refresh_token', { mode: 'decrypt' }),
 * })
 * ```
 */
export function createDrizzleSecret(
  encryptionKey: string,
  options?: DrizzleSecretOptions,
): SecretColumn
export function createDrizzleSecret(
  config: SecretsConfig,
  options?: DrizzleSecretOptions,
): SecretColumn
export function createDrizzleSecret(
  secrets: Secrets,
  options?: DrizzleSecretOptions,
): SecretColumn
export function createDrizzleSecret(
  input: string | SecretsConfig | Secrets,
  factoryOptions?: DrizzleSecretOptions,
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
      const maskOption = options?.mask ?? factoryOptions?.mask

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
          return resolveFromDriver(secrets, mode, value, maskOption) as string
        },
      })(name)
    },
    { secrets },
  )

  return secret
}

export { mask, SecretValue, expose }
export type { Mask, MaskOptions }
