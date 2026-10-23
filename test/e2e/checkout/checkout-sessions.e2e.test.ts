import { describe, expect, it } from 'vitest'
import { InvalidRequestError, PermissionError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { people, sessionParams } from '../support/fixtures.js'
import { tokenFor } from '../support/flows.js'
import { served } from '../support/served.js'

describe.skipIf(!configured)('e2e: checkout sessions', () => {
  it('[E2E-001] creates a session with milestones, images and both contacts, with correct fees', async () => {
    const who = people()
    const session = await ketapay().checkoutSessions.create(
      sessionParams(
        { buyer: { ...who.buyer, phone: '+2348012345678' } as typeof who.buyer, seller: who.seller },
        { images: [{ url: 'https://ketapay.com/logo.png' }] },
      ),
    )
    expect(session.status).toBe('open')
    expect(session.url).toMatch(/^https:\/\//)
    expect(session.milestones).toHaveLength(2)
    expect(session.images).toHaveLength(1)
    expect(session.fees.buyer_total).toBe(session.fees.amount + session.fees.buyer_fee + session.fees.buyer_vat)
    expect(session.fees.seller_payout).toBe(session.fees.amount - session.fees.seller_fee - session.fees.commission)
  })

  it.skipIf(!served('bank_transfer'))(
    "[E2E-003] returns bank transfer details for the buyer's token, and refuses someone else's",
    async () => {
      const who = people()
      const k = ketapay()
      const session = await k.checkoutSessions.create(sessionParams(who))
      const details = await k.checkoutSessions.bankTransfer(session.id, {
        customerToken: await tokenFor(who.buyer.email),
      })
      expect(details.account_number).toMatch(/^\d{10}$/)
      expect(details.amount).toBe(session.fees.buyer_total)
      await expect(
        k.checkoutSessions.bankTransfer(session.id, { customerToken: await tokenFor(who.seller.email) }),
      ).rejects.toBeInstanceOf(PermissionError)
    },
  )

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
