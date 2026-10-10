import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'src/generated'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // The SDK must run on edge runtimes (Vercel Edge, Cloudflare Workers, Deno, Bun): Web APIs only.
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['node:*'], message: 'Use Web APIs so the SDK runs on edge runtimes.' }] },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Buffer', message: 'Use Uint8Array and TextEncoder/TextDecoder.' },
        { name: 'require', message: 'ESM only in src.' },
      ],
    },
  },
)
