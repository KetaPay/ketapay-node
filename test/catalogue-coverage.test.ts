// Every scenario in the shared SDK test catalogue (spec/test-catalogue.md, synced from the
// documentation repo) must have at least one test tagged with its ID, and no test may carry an ID the
// catalogue doesn't have. Adding a scenario to the catalogue fails this test until it is covered here.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// IDs look like SEC-002 or E2E-014: a letter, then letters or digits, a dash and three digits.
const ID_PATTERN = '[A-Z][A-Z0-9]{1,4}-\\d{3}'

function catalogueIds(): Map<string, string> {
  const ids = new Map<string, string>()
  for (const line of readFileSync('spec/test-catalogue.md', 'utf8').split('\n')) {
    const row = line.match(new RegExp(`^\\| (${ID_PATTERN}) \\| (\\w+) \\| (.+) \\|$`))
    if (row) ids.set(row[1]!, `${row[2]}: ${row[3]}`)
  }
  return ids
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesUnder(path) : /\.(ts|mjs)$/.test(name) ? [path] : []
  })
}

/** IDs tagged in square brackets in test names and in the scripts that run package checks. */
function taggedIds(): Map<string, string[]> {
  const tagged = new Map<string, string[]>()
  for (const file of [...filesUnder('test'), ...filesUnder('scripts')]) {
    for (const [, tag] of readFileSync(file, 'utf8').matchAll(new RegExp(`\\[(${ID_PATTERN})\\]`, 'g'))) {
      tagged.set(tag!, [...(tagged.get(tag!) ?? []), file])
    }
  }
  return tagged
}

const catalogue = catalogueIds()
const tagged = taggedIds()

describe('test catalogue coverage', () => {
  it('reads the catalogue', () => {
    expect(catalogue.size).toBeGreaterThan(50)
    expect(catalogue.has('E2E-001')).toBe(true)
  })

  it('[SPEC-006] has a tagged test for every scenario in the catalogue', () => {
    const missing = [...catalogue.keys()].filter((id) => !tagged.has(id))
    expect(
      missing,
      `Write tests tagged with: ${missing.map((id) => `${id} (${catalogue.get(id)})`).join('; ')}`,
    ).toEqual([])
  })

  it('[SPEC-006] tags no test with an ID the catalogue does not have', () => {
    const unknown = [...tagged.keys()].filter((id) => !catalogue.has(id))
    expect(unknown, `Not in the catalogue: ${unknown.join(', ')}`).toEqual([])
  })
})
