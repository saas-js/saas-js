---
'drizzle-secrets': minor
---

Configurable masking, and short secrets are no longer partially revealed.

- **Breaking default:** values shorter than 12 characters are now fully
  masked (`••••`). Previously anything over 4 characters showed its last 4,
  so a 5-character PIN like `12345` read as `••••2345`.
- New `mask` option on `createDrizzleSecret(key, { mask })` (default for every
  column) and on `secret(name, { mask })` (per column), also accepted by
  `new SecretValue(value, mask)`. Pass `{ visible, minLength, placeholder }`
  or a function `(plaintext) => string`.
- `mask`, `DEFAULT_MASK`, `Mask` and `MaskOptions` are exported from
  `drizzle-secrets`.
