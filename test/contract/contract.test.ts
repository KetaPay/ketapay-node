// Runs real SDK calls against a Prism mock built from spec/v1.yaml with request validation on.
// Any request the spec doesn't allow fails here. Run with `npm run test:contract`.
import { describe, expect, it } from 'vitest'
import { KetaPay } from '../../src/index.js'

const baseUrl = process.env.KETAPAY_MOCK_URL
const ids = {
  session: '2c9a7f4e-1b3d-4e6a-8f2c-5d7b9e1a3c60',
  escrow: '3b1f6c2e-8d4a-4e7b-9c1d-2a5f8e6b7c90',
  milestone: '7c2e9a41-3b5d-4f6e-8a1c-9d0b2e4f6a83',
  dispute: '8e2f4a6c-1d3b-4c7e-9a5f-0b2d4f6a8c13',
  file: '5d8f2b1a-7c3e-4a9d-b6f0-2e4c8a1b3d57',
  endpoint: '1f2e3d4c-5b6a-4789-8a9b-0c1d2e3f4a5b',
}
const customer = { customerToken: 'ctk_test_contract' }

describe.skipIf(!baseUrl)('contract: SDK requests match the spec', () => {
  const k = new KetaPay({ apiKey: 'sk_test_contract', baseUrl, maxRetries: 0 })

  it('creates a checkout session with milestones, images and both contacts', async () => {
    const session = await k.checkoutSessions.create({
      amount: 150_000_000,
      category: 'services',
      title: 'Company website',
      description: 'Five-page marketing site with blog, built on Next.js.',
      images: [{ url: 'https://cdn.example.com/1.jpg' }],
      attachments: [{ name: 'Brief.pdf', file: ids.file }],
      milestones: [
        { title: 'Design', amount: 40_000_000 },
        { title: 'Build', amount: 110_000_000 },
      ],
      buyer: { email: 'ada@example.com', phone: '+2348012345678' },
      seller: { email: 'tunde@example.com' },
      release: { method: 'buyer_confirms', auto_release_hours: 168 },
      commission: { rate_bps: 1000 },
      external_reference: 'proj_4471',
    })
    expect(session.object).toBe('checkout_session')
  })

  it('reads and lists', async () => {
    expect((await k.checkoutSessions.retrieve(ids.session)).object).toBe('checkout_session')
    expect((await k.escrows.retrieve(ids.escrow)).object).toBe('escrow')
    expect((await k.escrows.list({ status: 'active', limit: 10 })).object).toBe('list')
    expect((await k.events.list({ type: 'escrow.funded' })).object).toBe('list')
    expect((await k.banks.list()).object).toBe('list')
  })

  it('runs the customer flow', async () => {
    await k.customerSessions.create({ email: 'ada@example.com' })
    await k.customerSessions.verify(ids.session, '123456')
    await k.checkoutSessions.bankTransfer(ids.session, customer)
    await k.escrows.milestones.deliver(ids.escrow, ids.milestone, { note: 'Designs ready' }, customer)
    await k.escrows.milestones.release(ids.escrow, ids.milestone, {}, customer)
    await k.escrows.milestones.release(ids.escrow, ids.milestone, { release_code: '731045' })
    await k.escrows.milestones.releaseCode(ids.escrow, ids.milestone, customer)
  })

  it('runs disputes and evidence', async () => {
    await k.files.create(
      { file: new TextEncoder().encode('img'), filename: 'photo.jpg', purpose: 'dispute_evidence' },
      customer,
    )
    await k.disputes.create(
      ids.escrow,
      { reason: 'not_as_agreed', description: 'Wrong colours used throughout', milestone_id: ids.milestone },
      customer,
    )
    await k.disputes.submitEvidence(ids.dispute, { statement: 'See the brand guide', files: [ids.file] }, customer)
    await k.disputes.concede(ids.dispute, customer)
    await k.disputes.withdraw(ids.dispute, customer)
    expect((await k.disputes.listForEscrow(ids.escrow)).object).toBe('list')
  })

  it('manages payout accounts and webhook endpoints', async () => {
    await k.payoutAccounts.create({ bank_code: '057', account_number: '0123456789' }, customer)
    await k.payoutAccounts.confirm(ids.endpoint, '123456', customer)
    const endpoint = await k.webhookEndpoints.create({
      url: 'https://example.com/hooks',
      enabled_events: ['escrow.funded'],
    })
    expect(endpoint.secret).toMatch(/^whsec_/)
    await k.webhookEndpoints.update(ids.endpoint, { status: 'enabled' })
    await k.webhookEndpoints.test(ids.endpoint, 'escrow.funded')
    await k.webhookEndpoints.rotateSecret(ids.endpoint)
  })

  it('drives the sandbox', async () => {
    await k.testHelpers.checkoutSessions.pay(ids.session, { method: 'card' })
    await k.testHelpers.escrows.simulate(ids.escrow, { action: 'deliver', milestone_id: ids.milestone })
  })
})
