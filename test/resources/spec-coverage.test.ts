// Every operation in the spec must have an SDK method that sends exactly the method and path the spec
// defines. Adding an endpoint to the spec (and syncing it here) fails this test until the SDK covers it,
// which is how every KetaPay SDK stays in step with the API. See SDK_STANDARDS.md in the spec folder.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { KetaPay } from '../../src/index.js'
import { client, mockFetch } from '../helpers.js'

type Call = (k: KetaPay) => PromiseLike<unknown>
const t = { customerToken: 't' }
const ids = { id: 'x1', milestone_id: 'm1' }

/** operationId -> the SDK call that implements it. */
const calls: Record<string, Call> = {
  // Checkout sessions
  createCheckoutSession: (k) =>
    k.checkoutSessions.create({
      amount: 1,
      title: 't',
      description: 'twenty characters long',
      buyer: { email: 'a@b.co' },
      seller: { phone: '+2348012345678' },
    }),
  listCheckoutSessions: (k) => k.checkoutSessions.list(),
  getCheckoutSession: (k) => k.checkoutSessions.retrieve(ids.id),
  cancelCheckoutSession: (k) => k.checkoutSessions.cancel(ids.id),
  createCheckoutSessionBankTransfer: (k) => k.checkoutSessions.bankTransfer(ids.id, t),
  // Customer sessions
  createCustomerSession: (k) => k.customerSessions.create({ email: 'a@b.co' }),
  verifyCustomerSession: (k) => k.customerSessions.verify(ids.id, '123456'),
  // Escrows and milestones
  listEscrows: (k) => k.escrows.list(),
  getEscrow: (k) => k.escrows.retrieve(ids.id),
  cancelEscrow: (k) => k.escrows.cancel(ids.id, undefined, t),
  flagEscrow: (k) => k.escrows.flag(ids.id, { reason: 'banned_seller' }),
  deliverMilestone: (k) => k.escrows.milestones.deliver(ids.id, ids.milestone_id, {}, t),
  releaseMilestone: (k) => k.escrows.milestones.release(ids.id, ids.milestone_id, { release_code: '123456' }),
  getMilestoneReleaseCode: (k) => k.escrows.milestones.releaseCode(ids.id, ids.milestone_id, t),
  // Disputes and chargebacks
  openDispute: (k) => k.disputes.create(ids.id, { reason: 'damaged', description: 'Arrived cracked' }, t),
  listEscrowDisputes: (k) => k.disputes.listForEscrow(ids.id),
  getDispute: (k) => k.disputes.retrieve(ids.id),
  concedeDispute: (k) => k.disputes.concede(ids.id, t),
  withdrawDispute: (k) => k.disputes.withdraw(ids.id, t),
  submitDisputeEvidence: (k) => k.disputes.submitEvidence(ids.id, { statement: 'Photos attached here' }, t),
  listDisputeEvidence: (k) => k.disputes.listEvidence(ids.id, t),
  listEscrowChargebacks: (k) => k.chargebacks.listForEscrow(ids.id),
  getChargeback: (k) => k.chargebacks.retrieve(ids.id),
  submitChargebackEvidence: (k) => k.chargebacks.submitEvidence(ids.id, { statement: 'Courier receipt' }, t),
  // Files
  uploadFile: (k) => k.files.create({ file: new Uint8Array([1]), filename: 'a.pdf', purpose: 'delivery' }),
  // Payouts
  listBanks: (k) => k.banks.list(),
  createPayoutAccount: (k) => k.payoutAccounts.create({ bank_code: '057', account_number: '0123456789' }, t),
  confirmPayoutAccount: (k) => k.payoutAccounts.confirm(ids.id, '123456', t),
  listPayoutAccounts: (k) => k.payoutAccounts.list(t),
  deletePayoutAccount: (k) => k.payoutAccounts.del(ids.id, t),
  // Webhook endpoints and events
  createWebhookEndpoint: (k) =>
    k.webhookEndpoints.create({ url: 'https://example.com/hooks', enabled_events: ['escrow.funded'] }),
  listWebhookEndpoints: (k) => k.webhookEndpoints.list(),
  getWebhookEndpoint: (k) => k.webhookEndpoints.retrieve(ids.id),
  updateWebhookEndpoint: (k) => k.webhookEndpoints.update(ids.id, { status: 'enabled' }),
  deleteWebhookEndpoint: (k) => k.webhookEndpoints.del(ids.id),
  testWebhookEndpoint: (k) => k.webhookEndpoints.test(ids.id, 'escrow.funded'),
  rotateWebhookSecret: (k) => k.webhookEndpoints.rotateSecret(ids.id),
  listEvents: (k) => k.events.list(),
  getEvent: (k) => k.events.retrieve(ids.id),
  // Sandbox
  testPayCheckoutSession: (k) => k.testHelpers.checkoutSessions.pay(ids.id),
  testSimulateEscrow: (k) => k.testHelpers.escrows.simulate(ids.id, { action: 'deliver' }),
}

/** operationId -> method and path, read from the spec snapshot. */
function specOperations(): Map<string, { method: string; path: string }> {
  const ops = new Map<string, { method: string; path: string }>()
  let inPaths = false
  let path = ''
  let method = ''
  for (const line of readFileSync('spec/v1.yaml', 'utf8').split('\n')) {
    if (/^\S/.test(line)) inPaths = line.startsWith('paths:')
    if (!inPaths) continue
    const p = line.match(/^ {2}(\/\S*):\s*$/)
    if (p) path = p[1]!
    const m = line.match(/^ {4}(get|post|put|patch|delete):\s*$/)
    if (m) method = m[1]!.toUpperCase()
    const op = line.match(/^ {6}operationId:\s*(\w+)/)
    if (op) ops.set(op[1]!, { method, path })
  }
  return ops
}

const spec = specOperations()

describe('spec coverage', () => {
  it('reads the operations from the spec', () => {
    expect(spec.size).toBeGreaterThan(30)
  })

  it('[SPEC-001] has an SDK method for every operation in the spec', () => {
    const missing = [...spec.keys()].filter((op) => !(op in calls))
    expect(missing, `Add these to the SDK (and to this table): ${missing.join(', ')}`).toEqual([])
  })

  it('[SPEC-001] has no SDK method for an operation the spec no longer has', () => {
    const stale = Object.keys(calls).filter((op) => !spec.has(op))
    expect(stale, `Not in the spec anymore: ${stale.join(', ')}`).toEqual([])
  })

  it.each([...spec.entries()].filter(([op]) => op in calls))(
    '[SPEC-002] %s sends the spec method and path',
    async (op, def) => {
      const { fetch, calls: sent } = mockFetch({ body: {} })
      await calls[op]!(client(fetch))
      const expected = def.path.replace(/\{(\w+)\}/g, (_, name: string) => ids[name as keyof typeof ids] ?? name)
      expect(sent[0]!.method).toBe(def.method)
      expect(new URL(sent[0]!.url).pathname).toBe(`/v1${expected}`)
    },
  )
})
