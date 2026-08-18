import type { Config } from 'tailwindcss'

import exampleConfig from './examples/conditions-react-storybook/tailwind.config.ts'

export default {
  ...exampleConfig,
  content: [
    './packages/*/src/**/*.{ts,tsx}',
    './examples/*/src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
  ],
} satisfies Config
