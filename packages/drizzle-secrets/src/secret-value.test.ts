import { describe, expect, it } from 'vitest'

import { SecretValue, expose } from './secret-value'

describe('SecretValue', () => {
  const sv = new SecretValue('sk-live-abcdef1234')

  it('masks in toJSON (JSON.stringify)', () => {
    const json = JSON.stringify({ token: sv })
    expect(json).toBe('{"token":"••••1234"}')
    expect(json).not.toContain('sk-live')
  })

  it('masks in toString (template literals)', () => {
    expect(`token: ${sv}`).toBe('token: ••••1234')
  })

  it('masks in valueOf', () => {
    expect(sv.valueOf()).toBe('••••1234')
  })

  it('masks in console-style inspect', () => {
    const inspectFn = sv[
      Symbol.for('nodejs.util.inspect.custom') as never
    ] as () => string
    expect(inspectFn.call(sv)).toBe('SecretValue(••••1234)')
  })

  it('masks via Symbol.toPrimitive', () => {
    expect(sv[Symbol.toPrimitive]()).toBe('••••1234')
  })

  it('exposes the masked property', () => {
    expect(sv.masked).toBe('••••1234')
  })

  it('masks short values completely', () => {
    const short = new SecretValue('abc')
    expect(short.toJSON()).toBe('••••')
    expect(short.masked).toBe('••••')
  })

  it('does not expose the raw value through any standard path', () => {
    const str = String(sv)
    const json = JSON.parse(JSON.stringify(sv))
    const concat = '' + sv

    expect(str).not.toContain('sk-live')
    expect(json).not.toContain('sk-live')
    expect(concat).not.toContain('sk-live')
  })

  it('exposes the raw value only via _unsafeUnwrap', () => {
    expect(sv._unsafeUnwrap()).toBe('sk-live-abcdef1234')
  })
})

describe('expose', () => {
  it('unwraps a SecretValue', () => {
    const sv = new SecretValue('my-secret')
    expect(expose(sv)).toBe('my-secret')
  })

  it('passes through a plain string', () => {
    expect(expose('plain-string')).toBe('plain-string')
  })
})
