import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: { context: '#storybook-root' },
  },
}

export default preview
