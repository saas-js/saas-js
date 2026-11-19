# drizzle-secrets

## 0.2.0

### Minor Changes

- 4ae671b: Configurable masking, and short secrets are no longer partially revealed.
  - **Breaking default:** values shorter than 12 characters are now fully
    masked (`••••`). Previously anything over 4 characters showed its last 4,
    so a 5-character PIN like `12345` read as `••••2345`.
  - New `mask` option on `createDrizzleSecret(key, { mask })` (default for every
    column) and on `secret(name, { mask })` (per column), also accepted by
    `new SecretValue(value, mask)`. Pass `{ visible, minLength, placeholder }`
    or a function `(plaintext) => string`.
  - `mask`, `DEFAULT_MASK`, `Mask` and `MaskOptions` are exported from
    `drizzle-secrets`.

## 0.1.0

### Minor Changes

- Initial release: encrypted columns for Drizzle ORM.
  - `createDrizzleSecret(key)` returns a `secret(name, { mode })` column builder
    that encrypts with AES-256-GCM on write. Reads are masked (`••••1234`) by
    default, or return a `SecretValue` (`mode: 'decrypt'`) that stays masked in
    logs, JSON, and template strings until you call `expose()`, or the raw
    ciphertext (`mode: 'encrypted'`).
  - Multiple keys with a `currentKeyId`: every ciphertext records its key ID, so
    old keys keep decrypting and `needsRotation()` / `rotate()` re-encrypt rows
    with the current key.
  - Plaintext values already in the table are still readable, so existing
    columns can switch over incrementally.
  - `drizzle-secrets` CLI: `generate-key`, `encrypt`, and `decrypt`.
