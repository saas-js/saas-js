---
'drizzle-secrets': minor
---

Initial release: encrypted columns for Drizzle ORM.

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
