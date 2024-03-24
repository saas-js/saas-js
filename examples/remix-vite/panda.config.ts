import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,

  presets: ['@pandacss/preset-base', '@park-ui/panda-preset'],

  jsxFramework: 'react',

  outExtension: 'js',

  include: ['./app/**/*.{js,jsx,ts,tsx}'],
  exclude: [],

  theme: {
    extend: {},
  },

  outdir: 'app/styled-system',
})
