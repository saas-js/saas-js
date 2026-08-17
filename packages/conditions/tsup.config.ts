import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es2022',
  tsconfig: 'tsconfig.json',
  entry: ['src/index.ts'],
  dts: {
    resolve: true,
  },
  clean: true,
  sourcemap: false,
  external: ['@tanstack/store'],
  format: ['esm', 'cjs'],
})
