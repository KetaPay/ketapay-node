// Copies the public spec from the documentation repo, which is its source of truth.
// Usage: npm run sync-spec [-- path/to/v1.yaml]   (defaults to ../documentation/openapi/public/v1.yaml)
import { copyFileSync, existsSync } from 'node:fs'

const source = process.argv[2] ?? '../documentation/openapi/public/v1.yaml'
if (!existsSync(source)) {
  console.error(`Spec not found at ${source}`)
  process.exit(1)
}
copyFileSync(source, 'spec/v1.yaml')
console.log(`Copied ${source} -> spec/v1.yaml. Now run: npm run generate && npm test && npm run test:contract`)
