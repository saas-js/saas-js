import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['@saas-js', 'sjs'],
  },
  ssr: {
    resolve: {
      conditions: ['@saas-js', 'sjs'],
    },
  },
  test: {
    environment: 'node',
    server: {
      deps: {
        // Resolve workspace packages from source via the custom conditions
        // instead of Node's default (stale dist) resolution.
        inline: ['drizzle-crud', '@saas-js/conditions'],
      },
    },
  },
})
