import { describe, expect, it } from 'vitest'

import {
  decrypt,
  encrypt,
  generateKey,
  getKeyId,
  isEncrypted,
  parseKey,
} from './crypto'

describe('generateKey', () => {
  it('returns a base64 string that decodes to 32 bytes', () => {
    const key = generateKey()
    const buf = Buffer.from(key, 'base64')
    expect(buf.length).toBe(32)
  })

  it('generates unique keys each time', () => {
    const a = generateKey()
    const b = generateKey()
    expect(a).not.toBe(b)
  })
})

describe('parseKey', () => {
  it('parses a valid 32-byte base64 key', () => {
    const key = generateKey()
    const buf = parseKey(key)
    expect(buf.length).toBe(32)
  })

  it('throws for a key that is not 32 bytes', () => {
    const short = Buffer.alloc(16).toString('base64')
    expect(() => parseKey(short)).toThrow('must be 32 bytes')
  })
})

describe('encrypt / decrypt', () => {
  const key = parseKey(generateKey())

  it('round-trips a simple string', () => {
    const encrypted = encrypt('hello world', key, 'v1')
    const { plaintext, keyId } = decrypt(encrypted, key)
    expect(plaintext).toBe('hello world')
    expect(keyId).toBe('v1')
  })

  it('round-trips an empty string', () => {
    const encrypted = encrypt('', key, 'v1')
    const { plaintext } = decrypt(encrypted, key)
    expect(plaintext).toBe('')
  })

  it('round-trips unicode content', () => {
    const value = '🔑 API key: こんにちは'
    const encrypted = encrypt(value, key, 'v1')
    const { plaintext } = decrypt(encrypted, key)
    expect(plaintext).toBe(value)
  })

  it('round-trips a long string', () => {
    const value = 'x'.repeat(10_000)
    const encrypted = encrypt(value, key, 'v1')
    const { plaintext } = decrypt(encrypted, key)
    expect(plaintext).toBe(value)
  })

  it('produces different ciphertexts for the same input (random IV)', () => {
    const a = encrypt('same', key, 'v1')
    const b = encrypt('same', key, 'v1')
    expect(a).not.toBe(b)
  })

  it('embeds the key ID in the output', () => {
    const encrypted = encrypt('test', key, 'my-key')
    expect(encrypted).toMatch(/^enc\$my-key\$/)
  })

  it('fails to decrypt with a wrong key', () => {
    const otherKey = parseKey(generateKey())
    const encrypted = encrypt('secret', key, 'v1')
    expect(() => decrypt(encrypted, otherKey)).toThrow()
  })

  it('fails to decrypt a tampered ciphertext', () => {
    const encrypted = encrypt('secret', key, 'v1')
    const tampered = encrypted.slice(0, -2) + 'xx'
    expect(() => decrypt(tampered, key)).toThrow()
  })

  it('throws on invalid format', () => {
    expect(() => decrypt('not-valid', key)).toThrow(
      'Invalid encrypted value format',
    )
    expect(() => decrypt('a$b$c', key)).toThrow(
      'Invalid encrypted value format',
    )
  })
})

describe('isEncrypted', () => {
  const key = parseKey(generateKey())

  it('returns true for encrypted values', () => {
    const encrypted = encrypt('test', key, 'v1')
    expect(isEncrypted(encrypted)).toBe(true)
  })

  it('returns false for plain text', () => {
    expect(isEncrypted('not-encrypted')).toBe(false)
    expect(isEncrypted('')).toBe(false)
    expect(isEncrypted('enc$only-three$parts')).toBe(false)
  })
})

describe('getKeyId', () => {
  const key = parseKey(generateKey())

  it('extracts the key ID', () => {
    const encrypted = encrypt('test', key, 'my-key-v2')
    expect(getKeyId(encrypted)).toBe('my-key-v2')
  })

  it('throws on invalid format', () => {
    expect(() => getKeyId('invalid')).toThrow('Invalid encrypted value format')
  })
})
