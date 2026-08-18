import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['@saas-js', 'sjs'],
  },
  test: {
    environment: 'node',
  },
})
