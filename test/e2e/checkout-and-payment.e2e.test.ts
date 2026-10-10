import { describe, expect, it } from 'vitest'
import { InvalidRequestError, PermissionError } from '../../src/index.js'
import { configured, eventsFor, fundedEscrow, ketapay, people, sessionParams, tokenFor } from './setup.js'

describe.skipIf(!configured)('e2e: checkout and payment', () => {
  it('[E2E-001] creates a checkout session with milestones, images and both contacts', async () => {
    const who = people()
    const session = await ketapay().checkoutSessions.create(
      sessionParams(
        { buyer: { ...who.buyer, phone: '+2348012345678' } as typeof who.buyer, seller: who.seller },
        { images: [{ url: 'https://picsum.photos/seed/ketapay/600/400.jpg' }] },
      ),
    )
    expect(session.status).toBe('open')
    expect(session.url).toMatch(/^https:\/\//)
    expect(session.milestones).toHaveLength(2)
    expect(session.images).toHaveLength(1)
    expect(session.fees.buyer_total).toBe(session.fees.amount + session.fees.buyer_fee + session.fees.buyer_vat)
    expect(session.fees.seller_payout).toBe(session.fees.amount - session.fees.seller_fee - session.fees.commission)
  })

  it('[E2E-002] sends a customer code and exchanges the sandbox code for a token', async () => {
    const { buyer } = people()
    const k = ketapay()
    const session = await k.customerSessions.create({ email: buyer.email })
    expect(session.status).toBe('code_sent')
    expect(session.channel).toBe('email')
    const token = await k.customerSessions.verify(session.id, '123456')
    expect(token.token).toMatch(/^ctk_test_/)
    expect(new Date(token.expires_at).getTime()).toBeGreaterThan(Date.now())
  })

  it("[E2E-003] returns bank transfer details for the buyer's token, and refuses someone else's", async () => {
    const who = people()
    const k = ketapay()
    const session = await k.checkoutSessions.create(sessionParams(who))
    const details = await k.checkoutSessions.bankTransfer(session.id, {
      customerToken: await tokenFor(who.buyer.email),
    })
    expect(details.account_number).toMatch(/^\d{10}$/)
    expect(details.amount).toBe(session.fees.buyer_total)
    const sellerToken = await tokenFor(who.seller.email)
    await expect(k.checkoutSessions.bankTransfer(session.id, { customerToken: sellerToken })).rejects.toBeInstanceOf(
      PermissionError,
    )
  })

  it('[E2E-004] pays with the test helper: escrow funded, session complete, escrow.funded recorded', async () => {
    const { escrow, session } = await fundedEscrow()
    expect(session.status).toBe('complete')
    expect(escrow.status).toBe('active')
    expect(escrow.milestones.every((m) => m.status === 'funded')).toBe(true)
    expect(await eventsFor(escrow, 'escrow.funded')).toHaveLength(1)
  })

  it('[E2E-015] replays the same idempotency key, and refuses it with a different body', async () => {
    const k = ketapay()
    const params = sessionParams()
    const key = `e2e-${Date.now()}`
    const a = await k.checkoutSessions.create(params, { idempotencyKey: key })
    const b = await k.checkoutSessions.create(params, { idempotencyKey: key })
    expect(b.id).toBe(a.id)
    await expect(
      k.checkoutSessions.create({ ...params, title: 'Different' }, { idempotencyKey: key }),
    ).rejects.toMatchObject({ code: 'idempotency_key_reused' })
  })

  it('[E2E-016] responses carry a request id and rate-limit headers', async () => {
    const { response, requestId } = await ketapay().escrows.list({ limit: 1 }).withResponse()
    expect(requestId).toBeTruthy()
    for (const h of ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']) {
      expect(response.headers.get(h), h).toBeTruthy()
    }
  })

  it('[E2E-022] refuses invalid input with the right param', async () => {
    const k = ketapay()
    const cases: [object, string][] = [
      [{ buyer: { name: 'No contact' } }, 'buyer'],
      [{ milestones: [{ title: 'Only part', amount: 1 }] }, 'milestones'],
      [{ description: 'Too short' }, 'description'],
    ]
    for (const [override, param] of cases) {
      const err = await k.checkoutSessions.create({ ...sessionParams(), ...override } as never).catch((e: unknown) => e)
      expect(err, param).toBeInstanceOf(InvalidRequestError)
      expect((err as InvalidRequestError).param ?? '', param).toContain(param)
    }
  })
})
