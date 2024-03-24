export default {
  semi: false,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  importOrder: [
    '^react$',
    '^react-dom$',
    '<THIRD_PARTY_MODULES>',
    '^@saas-js/(.*)$',
    '^#.(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
}
