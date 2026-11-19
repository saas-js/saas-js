import { describe, expect, it } from 'vitest'

import { generateKey, getKeyId } from './crypto'
import { Secrets, createSecrets } from './secrets'

describe('createSecrets (single key)', () => {
  const key = generateKey()
  const secrets = createSecrets(key)

  it('encrypts and decrypts a value', () => {
    const encrypted = secrets.encrypt('my-api-key')
    const decrypted = secrets.decrypt(encrypted)
    expect(decrypted).toBe('my-api-key')
  })

  it('uses "default" as the key ID', () => {
    const encrypted = secrets.encrypt('test')
    expect(getKeyId(encrypted)).toBe('default')
  })

  it('identifies encrypted values', () => {
    const encrypted = secrets.encrypt('test')
    expect(secrets.isEncrypted(encrypted)).toBe(true)
    expect(secrets.isEncrypted('plain-text')).toBe(false)
  })
})

describe('createSecrets (multi-key)', () => {
  const keyV1 = generateKey()
  const keyV2 = generateKey()

  it('encrypts with the current key', () => {
    const secrets = createSecrets({
      keys: { v1: keyV1, v2: keyV2 },
      currentKeyId: 'v2',
    })

    const encrypted = secrets.encrypt('test')
    expect(getKeyId(encrypted)).toBe('v2')
  })

  it('decrypts values from any known key', () => {
    const secretsV1 = createSecrets({
      keys: { v1: keyV1 },
      currentKeyId: 'v1',
    })
    const encryptedWithV1 = secretsV1.encrypt('old-secret')

    const secretsBoth = createSecrets({
      keys: { v1: keyV1, v2: keyV2 },
      currentKeyId: 'v2',
    })
    expect(secretsBoth.decrypt(encryptedWithV1)).toBe('old-secret')
  })

  it('throws when decrypting with an unknown key ID', () => {
    const secrets = createSecrets({
      keys: { v2: keyV2 },
      currentKeyId: 'v2',
    })

    const secretsV1 = createSecrets({
      keys: { v1: keyV1 },
      currentKeyId: 'v1',
    })
    const encryptedWithV1 = secretsV1.encrypt('secret')

    expect(() => secrets.decrypt(encryptedWithV1)).toThrow('Unknown key ID')
  })
})

describe('key rotation', () => {
  const keyV1 = generateKey()
  const keyV2 = generateKey()

  const secretsV1 = createSecrets({
    keys: { v1: keyV1 },
    currentKeyId: 'v1',
  })

  const secretsBoth = createSecrets({
    keys: { v1: keyV1, v2: keyV2 },
    currentKeyId: 'v2',
  })

  it('detects values needing rotation', () => {
    const encrypted = secretsV1.encrypt('secret')
    expect(secretsBoth.needsRotation(encrypted)).toBe(true)
  })

  it('does not flag values already on current key', () => {
    const encrypted = secretsBoth.encrypt('secret')
    expect(secretsBoth.needsRotation(encrypted)).toBe(false)
  })

  it('rotates a value to the current key', () => {
    const encrypted = secretsV1.encrypt('rotate-me')
    const rotated = secretsBoth.rotate(encrypted)

    expect(getKeyId(rotated)).toBe('v2')
    expect(secretsBoth.decrypt(rotated)).toBe('rotate-me')
  })

  it('returns unchanged if already on current key', () => {
    const encrypted = secretsBoth.encrypt('already-current')
    const rotated = secretsBoth.rotate(encrypted)
    expect(rotated).toBe(encrypted)
  })
})

describe('Secrets constructor validation', () => {
  it('throws if currentKeyId is not in keys', () => {
    expect(
      () =>
        new Secrets({
          keys: { v1: generateKey() },
          currentKeyId: 'v2',
        }),
    ).toThrow('currentKeyId "v2" not found')
  })

  it('throws if a key is not 32 bytes', () => {
    const badKey = Buffer.alloc(16).toString('base64')
    expect(
      () =>
        new Secrets({
          keys: { v1: badKey },
          currentKeyId: 'v1',
        }),
    ).toThrow('must be 32 bytes')
  })
})
