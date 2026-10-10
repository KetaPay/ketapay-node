// E2E runs against the real staging API: longer timeouts, one retry for network blips, and files one
// at a time so the suite stays under the API's rate limits. Unit tests use vitest.config.ts.
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

export default defineConfig({
  define: { __SDK_VERSION__: JSON.stringify(version) },
  test: {
    include: ['test/e2e/**/*.e2e.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    retry: 1,
    fileParallelism: false,
  },
})
