export interface MaskOptions {
  /**
   * Number of trailing characters to reveal, e.g. `4` → `••••1234`.
   * `0` never reveals anything. Defaults to `4`.
   */
  visible?: number
  /**
   * Secrets shorter than this are fully masked, so short values like PINs
   * never leak most of their characters. Defaults to `12`.
   */
  minLength?: number
  /** Replaces the hidden part of the value. Defaults to `'••••'`. */
  placeholder?: string
}

/**
 * How a secret is masked: options for the built-in masker, or your own
 * function that receives the plaintext and returns the display value.
 */
export type Mask = MaskOptions | ((value: string) => string)

export const DEFAULT_MASK: Required<MaskOptions> = {
  visible: 4,
  minLength: 12,
  placeholder: '••••',
}

/**
 * Masks a plaintext value for display.
 *
 * With the defaults, values of 12+ characters show their last 4
 * (`••••1234`) and anything shorter is fully masked (`••••`).
 *
 * @example
 * ```ts
 * mask('sk-live-abcdef1234') // '••••1234'
 * mask('12345')              // '••••'
 * mask('sk-live-abcdef1234', { visible: 0 }) // '••••'
 * mask('4242424242424242', { visible: 4, minLength: 8, placeholder: '**** ' })
 * // '**** 4242'
 * ```
 */
function mask(value: string, options?: Mask): string {
  if (typeof options === 'function') {
    return options(value)
  }

  const { visible, minLength, placeholder } = { ...DEFAULT_MASK, ...options }
  const reveal = Math.max(0, Math.floor(visible))

  if (reveal === 0 || value.length < minLength || value.length <= reveal) {
    return placeholder
  }

  return placeholder + value.slice(-reveal)
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
 * All other paths return a masked representation (`••••xxxx` by default,
 * configurable with a {@link Mask}):
 *
 * - `JSON.stringify(secretValue)` → `"••••xxxx"`
 * - `console.log(secretValue)` → `SecretValue(••••xxxx)`
 * - `` `token: ${secretValue}` `` → `"token: ••••xxxx"`
 */
export class SecretValue {
  readonly #value: string
  readonly masked: string

  constructor(value: string, options?: Mask) {
    this.#value = value
    this.masked = mask(value, options)
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
