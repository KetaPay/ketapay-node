import { describe, expect, it } from 'vitest'
import type { KetaPay } from '../../src/index.js'
import { client, mockFetch } from '../helpers.js'

const t = { customerToken: 't' }
type Case = [string, (k: KetaPay) => PromiseLike<unknown>, 'GET' | 'POST' | 'DELETE', string]

const cases: Case[] = [
  [
    'checkout bank transfer',
    (k) => k.checkoutSessions.bankTransfer('cs1', t),
    'POST',
    '/checkout_sessions/cs1/bank_transfer',
  ],
  ['customer verify', (k) => k.customerSessions.verify('cus1', '123456'), 'POST', '/customer_sessions/cus1/verify'],
  [
    'milestone deliver',
    (k) => k.escrows.milestones.deliver('e1', 'm1', { note: 'Done' }, t),
    'POST',
    '/escrows/e1/milestones/m1/deliver',
  ],
  [
    'milestone release',
    (k) => k.escrows.milestones.release('e1', 'm1', { release_code: '123456' }),
    'POST',
    '/escrows/e1/milestones/m1/release',
  ],
  [
    'release code',
    (k) => k.escrows.milestones.releaseCode('e1', 'm1', t),
    'GET',
    '/escrows/e1/milestones/m1/release_code',
  ],
  ['escrow cancel', (k) => k.escrows.cancel('e1', undefined, t), 'POST', '/escrows/e1/cancel'],
  ['escrow flag', (k) => k.escrows.flag('e1', { reason: 'banned_seller' }), 'POST', '/escrows/e1/flag'],
  [
    'open dispute',
    (k) => k.disputes.create('e1', { reason: 'damaged', description: 'Screen arrived cracked' }, t),
    'POST',
    '/escrows/e1/disputes',
  ],
  ['escrow disputes', (k) => k.disputes.listForEscrow('e1'), 'GET', '/escrows/e1/disputes'],
  ['withdraw dispute', (k) => k.disputes.withdraw('d1', t), 'POST', '/disputes/d1/withdraw'],
  [
    'submit evidence',
    (k) => k.disputes.submitEvidence('d1', { statement: 'Photos attached here' }, t),
    'POST',
    '/disputes/d1/evidence',
  ],
  ['chargebacks', (k) => k.chargebacks.listForEscrow('e1'), 'GET', '/escrows/e1/chargebacks'],
  [
    'chargeback evidence',
    (k) => k.chargebacks.submitEvidence('cb1', { statement: 'Courier receipt' }, t),
    'POST',
    '/chargebacks/cb1/evidence',
  ],
  ['banks', (k) => k.banks.list(), 'GET', '/banks'],
  [
    'confirm payout account',
    (k) => k.payoutAccounts.confirm('pa1', '123456', t),
    'POST',
    '/payout_accounts/pa1/confirm',
  ],
  ['delete payout account', (k) => k.payoutAccounts.del('pa1', t), 'DELETE', '/payout_accounts/pa1'],
  ['update endpoint', (k) => k.webhookEndpoints.update('we1', { status: 'enabled' }), 'POST', '/webhook_endpoints/we1'],
  ['test endpoint', (k) => k.webhookEndpoints.test('we1', 'escrow.funded'), 'POST', '/webhook_endpoints/we1/test'],
  ['rotate secret', (k) => k.webhookEndpoints.rotateSecret('we1'), 'POST', '/webhook_endpoints/we1/rotate_secret'],
  ['event', (k) => k.events.retrieve('ev1'), 'GET', '/events/ev1'],
  ['sandbox pay', (k) => k.testHelpers.checkoutSessions.pay('cs1'), 'POST', '/test_helpers/checkout_sessions/cs1/pay'],
  [
    'sandbox simulate',
    (k) => k.testHelpers.escrows.simulate('e1', { action: 'deliver', milestone_id: 'm1' }),
    'POST',
    '/test_helpers/escrows/e1/simulate',
  ],
]

describe('routes', () => {
  it.each(cases)('%s', async (_name, call, method, path) => {
    const { fetch, calls } = mockFetch({ body: {} })
    await call(client(fetch))
    expect(calls[0]!.method).toBe(method)
    expect(calls[0]!.url).toBe(`https://api.ketapay.com/v1${path}`)
  })

  it('sends one-time codes in the body', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).customerSessions.verify('cus_1', '123456')
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ code: '123456' })
  })
})
