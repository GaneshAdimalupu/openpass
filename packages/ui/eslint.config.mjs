import { nextJsConfig } from '@openpass/eslint-config/next'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]
