import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: [
    '../packages/**/*.stories.@(ts|tsx|mdx)',
    '../examples/**/*.stories.@(ts|tsx|mdx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        conditions: ['@saas-js', 'sjs'],
      },
    })
  },
}

export default config
