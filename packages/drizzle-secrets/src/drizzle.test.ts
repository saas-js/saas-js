import { beforeAll, describe, expect, it } from 'vitest'

import { generateKey, isEncrypted } from './crypto'
import { SecretValue, createDrizzleSecret, expose, mask } from './drizzle'
import type { SecretColumn } from './drizzle'

const key = generateKey()
let secret: SecretColumn

beforeAll(() => {
  secret = createDrizzleSecret(key)
})

function getMappers(
  name: string,
  options?: { mode?: 'masked' | 'decrypt' | 'encrypted' },
) {
  const col = secret(name, options)
  // @ts-expect-error - accessing protected config for testing
  const params = col.config.customTypeParams as {
    toDriver: (value: string) => string
    fromDriver: (value: string) => string | SecretValue
  }
  return params
}

describe('mask', () => {
  it('masks a value showing last 4 chars', () => {
    expect(mask('sk-live-abcdef1234')).toBe('••••1234')
  })

  it('returns only dots for short values', () => {
    expect(mask('abc')).toBe('••••')
    expect(mask('abcd')).toBe('••••')
  })

  it('fully masks values shorter than 12 characters by default', () => {
    expect(mask('12345')).toBe('••••')
    expect(mask('hunter2')).toBe('••••')
    expect(mask('abcdefghijk')).toBe('••••') // 11
    expect(mask('abcdefghijkl')).toBe('••••ijkl') // 12
  })

  it('never reveals more than the configured number of characters', () => {
    expect(mask('sk-live-abcdef1234', { visible: 2 })).toBe('••••34')
    expect(mask('sk-live-abcdef1234', { visible: 0 })).toBe('••••')
    expect(mask('abcd', { visible: 4, minLength: 0 })).toBe('••••')
  })

  it('supports minLength and placeholder', () => {
    expect(mask('12345', { minLength: 5 })).toBe('••••2345')
    expect(
      mask('4242424242424242', { minLength: 8, placeholder: '**** ' }),
    ).toBe('**** 4242')
  })

  it('accepts a custom mask function', () => {
    expect(mask('sk-live-abcdef1234', (v) => `[${v.length} chars]`)).toBe(
      '[18 chars]',
    )
  })
})

describe('mask configuration', () => {
  function mappers(col: unknown) {
    // @ts-expect-error - accessing protected config for testing
    return col.config.customTypeParams as {
      toDriver: (value: string) => string
      fromDriver: (value: string) => string | SecretValue
    }
  }

  it('applies the factory default to every column', () => {
    const s = createDrizzleSecret(key, { mask: { visible: 0 } })
    const { toDriver, fromDriver } = mappers(s('col'))
    expect(fromDriver(toDriver('sk-live-abcdef1234'))).toBe('••••')
  })

  it('lets a column override the factory default', () => {
    const s = createDrizzleSecret(key, { mask: { visible: 0 } })
    const { toDriver, fromDriver } = mappers(
      s('col', { mask: { visible: 4, placeholder: '…' } }),
    )
    expect(fromDriver(toDriver('sk-live-abcdef1234'))).toBe('…1234')
  })

  it('uses the mask for SecretValue in decrypt mode', () => {
    const s = createDrizzleSecret(key, { mask: (v) => `${v.slice(0, 3)}…` })
    const { toDriver, fromDriver } = mappers(s('col', { mode: 'decrypt' }))
    const value = fromDriver(toDriver('sk-live-abcdef1234')) as SecretValue
    expect(String(value)).toBe('sk-…')
    expect(JSON.stringify({ value })).toBe('{"value":"sk-…"}')
    expect(expose(value)).toBe('sk-live-abcdef1234')
  })
})

describe('createDrizzleSecret', () => {
  it('accepts a string key', () => {
    const s = createDrizzleSecret(generateKey())
    const { toDriver } = getMappers('col')
    expect(isEncrypted(toDriver('test'))).toBe(true)
  })

  it('accepts a SecretsConfig', () => {
    const s = createDrizzleSecret({
      keys: { v1: generateKey() },
      currentKeyId: 'v1',
    })
    expect(s.secrets).toBeDefined()
  })

  it('exposes the underlying secrets instance', () => {
    expect(secret.secrets).toBeDefined()
    const encrypted = secret.secrets.encrypt('test')
    expect(secret.secrets.decrypt(encrypted)).toBe('test')
  })
})

describe('toDriver (encrypt)', () => {
  it('encrypts the value regardless of mode', () => {
    for (const mode of ['masked', 'decrypt', 'encrypted'] as const) {
      const { toDriver } = getMappers('col', { mode })
      const encrypted = toDriver('my-secret')
      expect(isEncrypted(encrypted)).toBe(true)
    }
  })

  it('handles SecretValue input (re-insert from a read)', () => {
    const { toDriver } = getMappers('col', { mode: 'decrypt' })
    const sv = new SecretValue('my-secret')
    const encrypted = toDriver(sv as unknown as string)
    expect(isEncrypted(encrypted)).toBe(true)
  })

  it('passes through already-encrypted values', () => {
    const { toDriver } = getMappers('col')
    const alreadyEncrypted = secret.secrets.encrypt('test')
    const result = toDriver(alreadyEncrypted)
    expect(result).toBe(alreadyEncrypted)
  })
})

describe('fromDriver — mode: masked (default)', () => {
  it('returns masked value by default', () => {
    const { toDriver, fromDriver } = getMappers('col')
    const encrypted = toDriver('sk-live-abcdef1234')
    expect(fromDriver(encrypted)).toBe('••••1234')
  })

  it('masks unencrypted values too (migration compat)', () => {
    const { fromDriver } = getMappers('col')
    expect(fromDriver('old-plain-token')).toBe('••••oken')
  })

  it('returns a plain string, not SecretValue', () => {
    const { toDriver, fromDriver } = getMappers('col')
    const result = fromDriver(toDriver('test'))
    expect(result).toBeTypeOf('string')
    expect(result).not.toBeInstanceOf(SecretValue)
  })
})

describe('fromDriver — mode: decrypt', () => {
  it('returns a SecretValue, not a plain string', () => {
    const { toDriver, fromDriver } = getMappers('col', { mode: 'decrypt' })
    const encrypted = toDriver('sk-live-abcdef1234')
    const result = fromDriver(encrypted)
    expect(result).toBeInstanceOf(SecretValue)
  })

  it('masks when serialized to JSON', () => {
    const { toDriver, fromDriver } = getMappers('col', { mode: 'decrypt' })
    const result = fromDriver(toDriver('sk-live-abcdef1234'))
    const json = JSON.stringify({ token: result })
    expect(json).toBe('{"token":"••••1234"}')
    expect(json).not.toContain('sk-live')
  })

  it('masks in template literals', () => {
    const { toDriver, fromDriver } = getMappers('col', { mode: 'decrypt' })
    const result = fromDriver(toDriver('sk-live-abcdef1234'))
    expect(`${result}`).toBe('••••1234')
  })

  it('exposes the real value only via expose()', () => {
    const { toDriver, fromDriver } = getMappers('col', { mode: 'decrypt' })
    const result = fromDriver(toDriver('sk-live-abcdef1234'))
    expect(expose(result)).toBe('sk-live-abcdef1234')
  })

  it('handles unencrypted values (migration compat)', () => {
    const { fromDriver } = getMappers('col', { mode: 'decrypt' })
    const result = fromDriver('old-plain-token')
    expect(result).toBeInstanceOf(SecretValue)
    expect(expose(result)).toBe('old-plain-token')
  })
})

describe('fromDriver — mode: encrypted', () => {
  it('returns the raw ciphertext unchanged', () => {
    const { toDriver, fromDriver } = getMappers('col', { mode: 'encrypted' })
    const encrypted = toDriver('my-secret')
    expect(fromDriver(encrypted)).toBe(encrypted)
    expect(isEncrypted(fromDriver(encrypted) as string)).toBe(true)
  })
})

describe('SQL type', () => {
  it('maps to text in Postgres', () => {
    const col = secret('test_col')
    // @ts-expect-error - accessing protected config for testing
    expect(col.config.customTypeParams.dataType()).toBe('text')
  })
})
