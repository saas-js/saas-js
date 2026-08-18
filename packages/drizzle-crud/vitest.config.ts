import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['sjs'],
  },
  test: {
    environment: 'node',
  },
})
