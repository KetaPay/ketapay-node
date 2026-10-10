// Copies the bundled public spec from the documentation repo (its source of truth) into spec/v1.yaml,
// with a header marking it as generated and a hash of its contents, so hand edits fail CI.
// Usage: npm run sync-spec [-- path/to/dist/v1.yaml]
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const source = process.argv[2] ?? '../documentation/openapi/public/dist/v1.yaml'
if (!existsSync(source)) {
  console.error(`Bundled spec not found at ${source}. Run \`npm run public:bundle\` in the documentation repo.`)
  process.exit(1)
}
const body = readFileSync(source, 'utf8')
const hash = createHash('sha256').update(body).digest('hex')
const header = [
  '# GENERATED: do not edit. Bundled from documentation/openapi/public and copied by `npm run sync-spec`.',
  `# sha256: ${hash}`,
  '',
  '',
].join('\n')
writeFileSync('spec/v1.yaml', header + body)
console.log(`Copied ${source} -> spec/v1.yaml. Now run: npm run generate && npm test && npm run test:contract`)
