import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  minify: true,
  clean: true,
  format: 'esm',
})
