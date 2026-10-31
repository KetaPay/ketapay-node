// Test data. Every call returns fresh people, so tests never share state and can run in any order.
import type { CheckoutSessionCreateParams } from '../../../src/index.js'
import { RUN_ID } from './env.js'

let counter = 0

export function people() {
  counter++
  return {
    buyer: { email: `buyer+${RUN_ID}-${counter}@e2e.ketapay.test`, name: 'E2E Buyer' },
    seller: { email: `seller+${RUN_ID}-${counter}@e2e.ketapay.test`, name: 'E2E Seller' },
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
