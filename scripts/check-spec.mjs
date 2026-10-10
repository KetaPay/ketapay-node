// Fails when spec/v1.yaml was edited by hand: its contents must match the hash sync-spec wrote.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const text = readFileSync('spec/v1.yaml', 'utf8')
const match = text.match(/^# GENERATED: .*\n# sha256: ([0-9a-f]{64})\n\n/)
if (!match) {
  console.error('spec/v1.yaml has no GENERATED header. Update it with `npm run sync-spec`, never by hand.')
  process.exit(1)
}
const body = text.slice(match[0].length)
if (createHash('sha256').update(body).digest('hex') !== match[1]) {
  console.error('spec/v1.yaml was edited by hand. Change the spec in the documentation repo, then `npm run sync-spec`.')
  process.exit(1)
}
console.log('spec/v1.yaml matches its recorded hash')
