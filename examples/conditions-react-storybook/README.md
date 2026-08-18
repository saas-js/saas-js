# Conditions React Storybook

Real Chakra UI and shadcn adapters for `@saas-js/conditions-react`. Both use
`src/shared/definition.ts`, the same sample contacts, and the same headless
controller behavior.

Stories are loaded by the workspace Storybook at the repository root:

```sh
bun storybook
bun run build-storybook
```

UI dependencies are intentionally confined to this private workspace.
