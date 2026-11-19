import * as crypto from './crypto'

export interface SecretsConfig {
  /**
   * Map of key IDs to base64-encoded 32-byte encryption keys.
   * Supports multiple keys for rotation — old keys can still decrypt,
   * but only the `currentKeyId` key is used for new encryptions.
   *
   * @example
   * ```ts
   * keys: {
   *   v1: process.env.ENCRYPTION_KEY_V1!,
   *   v2: process.env.ENCRYPTION_KEY_V2!,
   * }
   * ```
   */
  keys: Record<string, string>

  /**
   * The key ID to use for new encryptions.
   * Must be present in `keys`.
   */
  currentKeyId: string
}

export class Secrets {
  private keys: Map<string, Buffer>
  private currentKeyId: string

  constructor(config: SecretsConfig) {
    const { keys, currentKeyId } = config

    if (!keys[currentKeyId]) {
      throw new Error(
        `currentKeyId "${currentKeyId}" not found in provided keys`,
      )
    }

    this.keys = new Map()
    for (const [id, base64Key] of Object.entries(keys)) {
      this.keys.set(id, crypto.parseKey(base64Key))
    }

    this.currentKeyId = currentKeyId
  }

  /**
   * Encrypts a plaintext value using the current active key.
   */
  encrypt(plaintext: string): string {
    const key = this.keys.get(this.currentKeyId)!
    return crypto.encrypt(plaintext, key, this.currentKeyId)
  }

  /**
   * Decrypts a ciphertext value. Automatically selects the correct key
   * based on the key ID embedded in the ciphertext.
   */
  decrypt(ciphertext: string): string {
    const keyId = crypto.getKeyId(ciphertext)
    const key = this.keys.get(keyId)

    if (!key) {
      throw new Error(
        `Unknown key ID "${keyId}" in encrypted value. ` +
          `Available keys: ${[...this.keys.keys()].join(', ')}`,
      )
    }

    return crypto.decrypt(ciphertext, key).plaintext
  }

  /**
   * Returns true if the value is encrypted with a key other than the
   * current active key, meaning it should be re-encrypted.
   */
  needsRotation(ciphertext: string): boolean {
    return crypto.getKeyId(ciphertext) !== this.currentKeyId
  }

  /**
   * Re-encrypts a value with the current active key.
   * If the value is already encrypted with the current key, returns it unchanged.
   */
  rotate(ciphertext: string): string {
    if (!this.needsRotation(ciphertext)) {
      return ciphertext
    }

    const plaintext = this.decrypt(ciphertext)
    return this.encrypt(plaintext)
  }

  /**
   * Checks whether a string is an encrypted value from this module.
   */
  isEncrypted(value: string): boolean {
    return crypto.isEncrypted(value)
  }
}

/**
 * Creates a Secrets instance from a single encryption key.
 * Convenience for the common case where you don't need key rotation yet.
 *
 * @example
 * ```ts
 * const secrets = createSecrets(process.env.ENCRYPTION_KEY!)
 * const encrypted = secrets.encrypt('sk-abc123')
 * const decrypted = secrets.decrypt(encrypted)
 * ```
 */
export function createSecrets(encryptionKey: string): Secrets
/**
 * Creates a Secrets instance with multiple keys for rotation support.
 *
 * @example
 * ```ts
 * const secrets = createSecrets({
 *   keys: {
 *     v1: process.env.ENCRYPTION_KEY_V1!,
 *     v2: process.env.ENCRYPTION_KEY_V2!,
 *   },
 *   currentKeyId: 'v2',
 * })
 * ```
 */
export function createSecrets(config: SecretsConfig): Secrets
export function createSecrets(configOrKey: SecretsConfig | string): Secrets {
  if (typeof configOrKey === 'string') {
    return new Secrets({
      keys: { default: configOrKey },
      currentKeyId: 'default',
    })
  }

  return new Secrets(configOrKey)
}
