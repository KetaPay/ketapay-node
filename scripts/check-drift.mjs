// [SPEC-005] Fails when src/generated no longer matches the spec snapshot (types edited by hand or not regenerated).
import { execSync } from 'node:child_process'

execSync('npm run --silent generate', { stdio: 'inherit' })
try {
  execSync('git diff --exit-code -- src/generated', { stdio: 'inherit' })
  console.log('generated types match the spec')
} catch {
  console.error('src/generated is out of date: run `npm run generate` and commit the result.')
  process.exit(1)
}
