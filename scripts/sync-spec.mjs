// Copies the bundled public spec and the SDK test catalogue from the documentation repo (their source of
// truth) into spec/, each with a GENERATED header and a hash of its contents, so hand edits fail CI.
// Usage: npm run sync-spec [-- path/to/documentation/openapi/public]
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? '../documentation/openapi/public'
const files = [
  { from: join(dir, 'dist/v1.yaml'), to: 'spec/v1.yaml', comment: (s) => `# ${s}` },
  { from: join(dir, 'SDK_TEST_CATALOGUE.md'), to: 'spec/test-catalogue.md', comment: (s) => `<!-- ${s} -->` },
]
for (const { from, to, comment } of files) {
  if (!existsSync(from)) {
    console.error(`Not found: ${from}. Run \`npm run public:bundle\` in the documentation repo.`)
    process.exit(1)
  }
  const body = readFileSync(from, 'utf8')
  const hash = createHash('sha256').update(body).digest('hex')
  const header = [
    comment('GENERATED: do not edit. Copied from documentation/openapi/public by `npm run sync-spec`.'),
    comment(`sha256: ${hash}`),
    '',
    '',
  ].join('\n')
  writeFileSync(to, header + body)
  console.log(`Copied ${from} -> ${to}`)
}
console.log('Now run: npm run generate && npm test && npm run test:contract')
