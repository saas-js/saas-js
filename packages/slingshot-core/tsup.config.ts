import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/client.ts',
    'src/next/index.ts',
    'src/remix-node/index.ts',
    'src/aws-lambda/index.ts',
  ],
  splitting: false,
  sourcemap: false,
  minify: true,
  clean: true,
  format: 'esm',
})
