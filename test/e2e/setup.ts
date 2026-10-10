// End-to-end tests run the real SDK against the KetaPay staging API with sandbox keys. They are skipped
// unless these are set (CI reads them from Infisical, project ketapay-node, environment staging):
//
//   KETAPAY_E2E_BASE_URL          staging API base URL, e.g. https://<staging>/v1   (required)
//   KETAPAY_E2E_SECRET_KEY        sk_test_ key of the e2e organisation                (required)
//   KETAPAY_E2E_OTHER_SECRET_KEY  sk_test_ key of a second organisation, for isolation tests
//   KETAPAY_E2E_LIVE_SECRET_KEY   sk_live_ key on staging, for the live-key refusal test
//   KETAPAY_E2E_WEBHOOK_URL       an HTTPS URL that answers 200, for webhook delivery tests
//
// Every run uses fresh buyer and seller emails, so runs never collide. In the sandbox every one-time code
// is 123456 and no message is sent.
import { KetaPay, type CheckoutSessionCreateParams, type Escrow, type EventType } from '../../src/index.js'

export const env = {
  baseUrl: process.env.KETAPAY_E2E_BASE_URL,
  key: process.env.KETAPAY_E2E_SECRET_KEY,
  otherKey: process.env.KETAPAY_E2E_OTHER_SECRET_KEY,
  liveKey: process.env.KETAPAY_E2E_LIVE_SECRET_KEY,
  webhookUrl: process.env.KETAPAY_E2E_WEBHOOK_URL,
}
export const configured = Boolean(env.baseUrl && env.key)
export const SANDBOX_CODE = '123456'

export const ketapay = (apiKey = env.key!) => new KetaPay({ apiKey, baseUrl: env.baseUrl, maxRetries: 1 })

const runId = Date.now().toString(36)
let counter = 0

/** A fresh buyer and seller for one test. */
export function people() {
  counter++
  return {
    buyer: { email: `buyer+${runId}-${counter}@e2e.ketapay.test`, name: 'E2E Buyer' },
    seller: { email: `seller+${runId}-${counter}@e2e.ketapay.test`, name: 'E2E Seller' },
  }
}

/** Signs a customer in with the sandbox code and returns their customer token. */
export async function tokenFor(email: string): Promise<string> {
  const k = ketapay()
  const session = await k.customerSessions.create({ email })
  return (await k.customerSessions.verify(session.id, SANDBOX_CODE)).token
}

export function sessionParams(
  who = people(),
  overrides: Partial<CheckoutSessionCreateParams> = {},
): CheckoutSessionCreateParams {
  return {
    amount: 1_500_000,
    category: 'services',
    title: 'E2E website build',
    description: 'Three-page site, built by the e2e suite to test escrow flows.',
    milestones: [
      { title: 'Design', amount: 500_000 },
      { title: 'Build', amount: 1_000_000 },
    ],
    buyer: who.buyer,
    seller: who.seller,
    release: { method: 'buyer_confirms' },
    external_reference: `e2e_${runId}_${counter}`,
    ...overrides,
  }
}

/** Creates a checkout session, pays it with the test helper and returns the funded escrow. */
export async function fundedEscrow(overrides: Partial<CheckoutSessionCreateParams> = {}) {
  const who = people()
  const k = ketapay()
  const session = await k.checkoutSessions.create(sessionParams(who, overrides))
  const paid = await k.testHelpers.checkoutSessions.pay(session.id)
  const escrow = await k.escrows.retrieve(paid.escrow_id!)
  return { escrow, session: paid, buyer: who.buyer.email, seller: who.seller.email }
}

/** Events of a type whose object is (or belongs to) the given escrow. */
export async function eventsFor(escrow: Escrow, type: EventType) {
  const page = await ketapay().events.list({ type, limit: 100 })
  return page.data.filter((e) => {
    const obj = e.data.object as { id?: string; escrow_id?: string }
    return obj.id === escrow.id || obj.escrow_id === escrow.id
  })
}

export const first = (escrow: Escrow) => escrow.milestones[0]!
