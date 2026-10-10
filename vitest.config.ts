import { readFileSync } from 'node:fs'
import { configDefaults, defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

export default defineConfig({
  define: { __SDK_VERSION__: JSON.stringify(version) },
  test: {
    include: ['test/**/*.test.ts'],
    // Contract tests need the Prism mock; `npm run test:contract` starts it and sets KETAPAY_MOCK_URL.
    // E2E tests need the staging API; they run when KETAPAY_E2E_BASE_URL is set (npm run test:e2e).
    exclude: [
      ...configDefaults.exclude,
      ...(process.env.KETAPAY_MOCK_URL ? [] : ['test/contract/**']),
      ...(process.env.KETAPAY_E2E_BASE_URL ? [] : ['test/e2e/**']),
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/generated/**', 'src/**/index.ts', 'src/**/types.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      // Just below today's numbers, so coverage can only go up. Raise them as tests are added.
      thresholds: { lines: 89, statements: 87, branches: 84, functions: 93 },
    },
  },
})
