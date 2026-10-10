import { readFileSync } from 'node:fs'
import { configDefaults, defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

export default defineConfig({
  define: { __SDK_VERSION__: JSON.stringify(version) },
  test: {
    include: ['test/**/*.test.ts'],
    // Contract tests need the Prism mock; `npm run test:contract` starts it and sets KETAPAY_MOCK_URL.
    exclude: process.env.KETAPAY_MOCK_URL ? configDefaults.exclude : [...configDefaults.exclude, 'test/contract/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/generated/**', 'src/**/index.ts', 'src/**/types.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      // Just below today's numbers, so coverage can only go up. Raise them as tests are added.
      thresholds: { lines: 85, statements: 85, branches: 82, functions: 80 },
    },
  },
})
