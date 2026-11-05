// Test data. Every call returns fresh people, so tests never share state and can run in any order.
import { randomUUID } from 'node:crypto'
import type { CheckoutSessionCreateParams } from '../../../src/index.js'
import { RUN_ID } from './env.js'

// Vitest loads this module once per test file, so the counter restarts in each file while CI's
// RUN_ID stays the same. The file id keeps people from two files from being the same account.
const FILE_ID = randomUUID().slice(0, 8)
let counter = 0

export function people() {
  counter++
  const id = `${RUN_ID}-${FILE_ID}-${counter}`
  return {
    buyer: { email: `buyer+${id}@e2e.ketapay.test`, name: 'E2E Buyer' },
    seller: { email: `seller+${id}@e2e.ketapay.test`, name: 'E2E Seller' },
  }
}

export type People = ReturnType<typeof people>

/** A valid two-milestone services deal, tagged with the run id for cleanup. */
export function sessionParams(
  who: People = people(),
  overrides: Partial<CheckoutSessionCreateParams> = {},
): CheckoutSessionCreateParams {
  return {
    amount: 1_500_000,
    title: 'E2E website build',
    description: 'Three-page site, built by the e2e suite to test escrow flows.',
    milestones: [
      { title: 'Design', amount: 500_000 },
      { title: 'Build', amount: 1_000_000 },
    ],
    buyer: who.buyer,
    seller: who.seller,
    release: { method: 'buyer_confirms' },
    external_reference: `${RUN_ID}-${counter}`,
    metadata: { e2e_run: RUN_ID },
    ...overrides,
  }
}
