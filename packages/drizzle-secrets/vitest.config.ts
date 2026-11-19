import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['@saas-js'],
  },
  test: {
    environment: 'node',
  },
})
