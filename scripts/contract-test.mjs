// Starts a Prism mock from spec/v1.yaml (request validation on), runs the contract tests against it,
// then stops it. Exits with the tests' exit code.
import { spawn } from 'node:child_process'

const port = process.env.PRISM_PORT ?? '4010'
const url = `http://127.0.0.1:${port}`
const prism = spawn('npx', ['prism', 'mock', 'spec/v1.yaml', '--port', port, '--errors'], { stdio: 'ignore' })

async function waitForPrism() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(url)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error('Prism did not start')
}

let code = 1
try {
  await waitForPrism()
  // Extra arguments go to vitest, e.g. reporters for CI.
  const tests = spawn('npx', ['vitest', 'run', 'test/contract', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, KETAPAY_MOCK_URL: url },
  })
  code = await new Promise((resolve) => tests.on('exit', resolve))
} finally {
  prism.kill()
}
process.exit(code ?? 1)
