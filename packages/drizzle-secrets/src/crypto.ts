import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const SEPARATOR = '$'
const PREFIX = 'enc'

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * Output format: `enc$<keyId>$<iv>$<authTag>$<ciphertext>`
 * All binary segments are base64url-encoded.
 */
export function encrypt(plaintext: string, key: Buffer, keyId: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return [
    PREFIX,
    keyId,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(SEPARATOR)
}

/**
 * Decrypts a ciphertext string produced by `encrypt`.
 * Returns the plaintext and the keyId that was used.
 */
export function decrypt(
  ciphertext: string,
  key: Buffer,
): { plaintext: string; keyId: string } {
  const parts = ciphertext.split(SEPARATOR)

  if (parts.length !== 5 || parts[0] !== PREFIX) {
    throw new Error('Invalid encrypted value format')
  }

  const keyId = parts[1]!
  const iv = Buffer.from(parts[2]!, 'base64url')
  const authTag = Buffer.from(parts[3]!, 'base64url')
  const encrypted = Buffer.from(parts[4]!, 'base64url')

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')

  return { plaintext, keyId }
}

/**
 * Checks whether a string looks like an encrypted value from this module.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(SEPARATOR)
  return parts.length === 5 && parts[0] === PREFIX
}

/**
 * Extracts the keyId from an encrypted value without decrypting.
 */
export function getKeyId(ciphertext: string): string {
  const parts = ciphertext.split(SEPARATOR)

  if (parts.length !== 5 || parts[0] !== PREFIX) {
    throw new Error('Invalid encrypted value format')
  }

  return parts[1]!
}

/**
 * Derives a 32-byte AES key from a base64-encoded string.
 * Throws if the decoded key is not exactly 32 bytes.
 */
export function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64')

  if (key.length !== 32) {
    throw new Error(
      `Encryption key must be 32 bytes (256 bits), got ${key.length} bytes`,
    )
  }

  return key
}

/**
 * Generates a random 32-byte encryption key, returned as base64.
 * Useful for initial setup / key generation scripts.
 */
export function generateKey(): string {
  return randomBytes(32).toString('base64')
}
