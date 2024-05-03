import { vitePlugin as remix } from '@remix-run/dev'
import { installGlobals } from '@remix-run/node'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

installGlobals()

export default defineConfig({
  plugins: [
    remix({
      ssr: true,
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: [
      '@saas-js/slingshot',
      '@saas-js/slingshot/**/*',
      '@saas-js/slingshot-aws',
      '@saas-js/slingshot-react',
    ],
  },
  ssr: {
    target: 'node',
    noExternal: [
      '@saas-js/slingshot',
      '@saas-js/slingshot/**/*',
      '@saas-js/slingshot-aws',
      '@saas-js/slingshot-react',
    ],
  },
})
