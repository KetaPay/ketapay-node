// Packs the package exactly as npm would publish it, installs it in an empty project, then
// type-checks and runs it the way a customer would. Run after `npm run build`.
// [PKG-001] ESM import and CommonJS require  [PKG-002] types with TypeScript 5.0 and current
// [PKG-003] only dist, LICENSE, README  [PKG-004] CI runs this on every supported Node (18 to 24)
// [PKG-006] reported version equals package.json  [PKG-007] no runtime dependencies
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve('.')
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const dir = mkdtempSync(join(tmpdir(), 'ketapay-smoke-'))
const run = (cmd, args, cwd = dir) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()

try {
  const [{ filename, files }] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', dir], root))
  const shipped = files.map((f) => f.path).sort()
  const unexpected = shipped.filter((p) => !/^(dist\/|LICENSE$|README\.md$|package\.json$)/.test(p))
  if (unexpected.length) throw new Error(`Package would ship unexpected files: ${unexpected.join(', ')}`)

  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'smoke', private: true }))
  run('npm', ['install', '--no-audit', '--no-fund', join(dir, filename), 'typescript@5.0.4'])
  const installed = JSON.parse(readFileSync(join(dir, 'node_modules/@ketapay/node/package.json'), 'utf8'))
  if (installed.dependencies && Object.keys(installed.dependencies).length) {
    throw new Error(`Package must have no runtime dependencies: ${Object.keys(installed.dependencies).join(', ')}`)
  }

  writeFileSync(
    join(dir, 'esm.mjs'),
    `import KetaPay, { InvalidRequestError, VERSION, generateTestSignatureHeader, verifyWebhook } from '@ketapay/node'
const k = new KetaPay({ apiKey: 'sk_test_smoke', fetch: async () => new Response('{"id":"e1"}', { headers: { 'KetaPay-Request-Id': 'req_1' } }) })
const { data, requestId } = await k.escrows.retrieve('e1').withResponse()
if (data.id !== 'e1' || requestId !== 'req_1') throw new Error('request failed')
const body = '{"id":"evt_1"}'
const event = await verifyWebhook(body, await generateTestSignatureHeader(body, 'whsec_x'), 'whsec_x')
if (event.id !== 'evt_1') throw new Error('webhook verify failed')
if (VERSION !== '${version}') throw new Error('VERSION is ' + VERSION + ', expected ${version}')
if (typeof InvalidRequestError !== 'function') throw new Error('errors not exported')
console.log('esm ok')
`,
  )
  writeFileSync(
    join(dir, 'cjs.cjs'),
    `const { KetaPay, verifyWebhook, ConflictError } = require('@ketapay/node')
if (typeof new KetaPay('sk_test_smoke').checkoutSessions.create !== 'function') throw new Error('client broken')
if (typeof verifyWebhook !== 'function' || typeof ConflictError !== 'function') throw new Error('exports broken')
console.log('cjs ok')
`,
  )
  writeFileSync(
    join(dir, 'types.mts'),
    `import KetaPay, { type CheckoutSessionCreateParams, type Escrow } from '@ketapay/node'
const params: CheckoutSessionCreateParams = { amount: 1, title: 't', description: 'twenty characters long', buyer: { email: 'a@b.co' }, seller: { phone: '+2348012345678' } }
// @ts-expect-error a party needs an email or a phone
const bad: CheckoutSessionCreateParams = { ...params, buyer: { name: 'x' } }
const escrow: Promise<Escrow> = Promise.resolve(new KetaPay('sk_test_x').escrows.retrieve('e1'))
export { bad, escrow }
`,
  )
  writeFileSync(
    join(dir, 'types.cts'),
    `import { KetaPay } from '@ketapay/node'
export const livemode: boolean = new KetaPay('sk_test_x').livemode
`,
  )

  console.log(run('node', ['esm.mjs']).trim())
  console.log(run('node', ['cjs.cjs']).trim())
  const compilers = [
    ['current', join(root, 'node_modules', 'typescript', 'bin', 'tsc')],
    ['5.0', join(dir, 'node_modules', 'typescript', 'bin', 'tsc')],
  ]
  for (const [tsVersion, tsc] of compilers)
    for (const [module, moduleResolution, files] of [
      ['nodenext', 'nodenext', ['types.mts', 'types.cts']],
      ['esnext', 'bundler', ['types.mts']],
    ]) {
      const compilerOptions = {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        lib: ['es2022', 'dom'],
        types: [],
        module,
        moduleResolution,
      }
      writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions, files }))
      try {
        execFileSync('node', [tsc, '-p', 'tsconfig.json'], { cwd: dir, stdio: 'pipe' })
      } catch (err) {
        throw new Error(
          `Types failed with TypeScript ${tsVersion}, moduleResolution ${moduleResolution}:\n${err.stdout}`,
        )
      }
      console.log(`types ok (TypeScript ${tsVersion}, moduleResolution ${moduleResolution})`)
    }
  console.log(`smoke test passed for ${filename} on Node ${process.versions.node}: ${shipped.length} files`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
