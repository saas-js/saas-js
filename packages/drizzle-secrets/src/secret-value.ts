const MASK = '••••'

function mask(value: string): string {
  if (value.length <= 4) {
    return MASK
  }
  return MASK + value.slice(-4)
}

/**
 * An opaque wrapper around a secret string. Prevents accidental leaking
 * through JSON serialization, logging, or template literals.
 *
 * The raw value is only accessible via `expose()`:
 *
 * ```ts
 * import { expose } from 'drizzle-secrets'
 *
 * const token = expose(row.accessToken) // explicit opt-in
 * ```
 *
 * All other paths return a masked representation (`••••xxxx`):
 *
 * - `JSON.stringify(secretValue)` → `"••••xxxx"`
 * - `console.log(secretValue)` → `SecretValue(••••xxxx)`
 * - `` `token: ${secretValue}` `` → `"token: ••••xxxx"`
 */
export class SecretValue {
  readonly #value: string
  readonly masked: string

  constructor(value: string) {
    this.#value = value
    this.masked = mask(value)
  }

  /** @internal — use `expose()` instead. Named to discourage casual use. */
  _unsafeUnwrap(): string {
    return this.#value
  }

  toJSON(): string {
    return this.masked
  }

  toString(): string {
    return this.masked
  }

  valueOf(): string {
    return this.masked
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `SecretValue(${this.masked})`
  }

  [Symbol.toPrimitive](): string {
    return this.masked
  }
}

/**
 * Extracts the raw value from a `SecretValue`, or returns the string as-is.
 * This is the only sanctioned way to access the plaintext.
 *
 * @example
 * ```ts
 * import { expose } from 'drizzle-secrets'
 *
 * // In your GitHub service — you intentionally need the real token
 * const token = expose(row.accessToken)
 * octokit = new Octokit({ auth: token })
 * ```
 */
export function expose(value: SecretValue | string): string {
  if (value instanceof SecretValue) {
    return value._unsafeUnwrap()
  }
  return value
}

export { mask }
