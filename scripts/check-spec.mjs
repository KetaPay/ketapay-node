// [SPEC-004] Fails when a synced file was edited by hand: its contents must match the hash sync-spec wrote.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

let failed = false
for (const file of ['spec/v1.yaml', 'spec/test-catalogue.md']) {
  const text = readFileSync(file, 'utf8')
  const match = text.match(/^(?:# |<!-- )GENERATED: .*\n(?:# |<!-- )sha256: ([0-9a-f]{64})(?: -->)?\n\n/)
  if (!match) {
    console.error(`${file} has no GENERATED header. Update it with \`npm run sync-spec\`, never by hand.`)
    failed = true
    continue
  }
  const body = text.slice(match[0].length)
  if (createHash('sha256').update(body).digest('hex') !== match[1]) {
    console.error(`${file} was edited by hand. Change it in the documentation repo, then \`npm run sync-spec\`.`)
    failed = true
    continue
  }
  console.log(`${file} matches its recorded hash`)
}
process.exit(failed ? 1 : 0)
