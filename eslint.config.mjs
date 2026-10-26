import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/next-env.d.ts', 'apps/api/src/generated/**', 'docs/handoff/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    settings: { next: { rootDir: 'apps/web/' } },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs['core-web-vitals'].rules },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/consistent-type-imports': 'error' },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@rielia/database', '@rielia/database/*', '@rielia/api', '@rielia/api/*', '@prisma/*', '**/apps/api/**', '**/packages/database/**'], message: 'The web consumes public contracts and HTTP, not backend internals.' }],
      }],
    },
  },
  {
    files: ['packages/mcp-local/src/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@nestjs/*', '@prisma/*', '@rielia/api', '@rielia/api/*', '@rielia/database', '@rielia/database/*', '**/apps/**', '**/database/**'] }] },
  },
  {
    files: ['packages/contracts/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@nestjs/*', '@prisma/*', '@rielia/api', '@rielia/database'] }] },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', Request: 'readonly', Response: 'readonly', AbortSignal: 'readonly', AbortController: 'readonly', fetch: 'readonly' } },
  },
];
