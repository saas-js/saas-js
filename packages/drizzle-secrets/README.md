# drizzle-secrets

Encrypted columns for [Drizzle ORM](https://orm.drizzle.team), with masked
reads by default.

Values are encrypted with AES-256-GCM on write. When you read them back you
get `••••1234` by default, so a stray `console.log(row)` or
`Response.json(row)` doesn't leak the plaintext.

- 🔐 AES-256-GCM, with a fresh IV for every write
- 🙈 Masked reads by default, with configurable masking
- 🧯 `SecretValue` stays masked in `JSON.stringify`, `console.log`, and
  template strings. Only `expose()` returns the plaintext.
- 🔁 Key IDs stored in every ciphertext, for zero-downtime key rotation
- 🧩 Reads existing plaintext rows, so you can adopt it incrementally
- 🛠️ CLI to generate keys and encrypt or decrypt values

## Install

```bash
npm install drizzle-secrets
npx drizzle-secrets generate-key # → ENCRYPTION_KEY
```

## Usage

```ts
import { pgTable, text } from 'drizzle-orm/pg-core'
import { createDrizzleSecret, expose } from 'drizzle-secrets/drizzle'

const secret = createDrizzleSecret(process.env.ENCRYPTION_KEY!)

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey(),
  apiKey: secret('api_key'), // reads as '••••1234'
  refreshToken: secret('refresh_token', { mode: 'decrypt' }), // SecretValue
})

const [row] = await db.select().from(integrations)

row.apiKey // '••••1234'
const token = expose(row.refreshToken) // plaintext
```

### Read modes

| Mode                 | Read returns            |
| -------------------- | ----------------------- |
| `'masked'` (default) | `'••••1234'`            |
| `'decrypt'`          | `SecretValue(••••1234)` |
| `'encrypted'`        | `'enc$v1$...'`          |

### Masking

Values of 12+ characters show their last 4 (`••••1234`); shorter values
such as PINs are fully masked (`••••`). Configure it for every column, per
column, or with your own function:

```ts
const secret = createDrizzleSecret(process.env.ENCRYPTION_KEY!, {
  mask: { visible: 4, minLength: 12, placeholder: '••••' }, // defaults
})

pgTable('accounts', {
  pin: secret('pin', { mask: { visible: 0 } }), // never reveal anything
  card: secret('card', { mask: { minLength: 8, placeholder: '**** ' } }),
  webhook: secret('webhook', { mask: (v) => `whsec_…${v.slice(-2)}` }),
})
```

> Don't write a masked read back to the database. Saving `'••••1234'`
> encrypts the mask in place of the real secret.

### Key rotation

```ts
const secret = createDrizzleSecret({
  keys: {
    v1: process.env.ENCRYPTION_KEY_V1!,
    v2: process.env.ENCRYPTION_KEY_V2!,
  },
  currentKeyId: 'v2',
})

if (secret.secrets.needsRotation(ciphertext)) {
  ciphertext = secret.secrets.rotate(ciphertext)
}
```

### Without Drizzle

```ts
import { createSecrets } from 'drizzle-secrets'

const secrets = createSecrets(process.env.ENCRYPTION_KEY!)
const encrypted = secrets.encrypt('sk-abc123')
secrets.decrypt(encrypted) // 'sk-abc123'
```

Postgres only for now (`drizzle-orm/pg-core`, stored as `text`).

## Documentation

https://saas-js.com/packages/drizzle-secrets/docs

## License

Apache-2.0
