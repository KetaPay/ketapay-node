import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, env } from '../support/env.js'
import { people, sessionParams } from '../support/fixtures.js'
import { first, fundedEscrow, tokenFor } from '../support/flows.js'

describe.skipIf(!configured)('e2e: the business sells its own goods', () => {
  it('[E2E-025] no seller makes the business the seller; it delivers with its key, the buyer releases', async () => {
    const who = people()
    const k = ketapay()
    const session = await k.checkoutSessions.create(sessionParams(who, { seller: undefined }))
    expect(session.seller).toMatchObject({ type: 'business', name: expect.any(String) })

    const paid = await k.testHelpers.checkoutSessions.pay(session.id)
    let escrow = await k.escrows.retrieve(paid.escrow_id!)
    const buyer = { customerToken: await tokenFor(who.buyer.email) }
    for (const m of escrow.milestones) {
      const delivered = await k.escrows.milestones.deliver(escrow.id, m.id, { note: 'Shipped' })
      expect(delivered.milestones.find((d) => d.id === m.id)!.status).toBe('delivered')
      escrow = await k.escrows.milestones.release(escrow.id, m.id, {}, buyer)
    }
    expect(escrow.status).toBe('completed')
    expect(escrow.seller).toEqual(session.seller)
  })

  it("[E2E-026] refuses commission on the business's own sale", async () => {
    await expect(
      ketapay().checkoutSessions.create(sessionParams(people(), { seller: undefined, commission: { rate_bps: 200 } })),
    ).rejects.toMatchObject({ code: 'commission_not_allowed' })
  })

  it("[E2E-027] refuses to deliver a sale between customers without the seller's token", async () => {
    const { escrow } = await fundedEscrow()
    await expect(ketapay().escrows.milestones.deliver(escrow.id, first(escrow).id, {})).rejects.toMatchObject({
      code: 'customer_token_required',
    })
  })

  it('[E2E-028] refunds an own sale with the key alone, and the money action can be read back', async () => {
    const who = people()
    const k = ketapay()
    const session = await k.checkoutSessions.create(sessionParams(who, { seller: undefined }))
    const paid = await k.testHelpers.checkoutSessions.pay(session.id)
    const action = await k.escrows.refund(paid.escrow_id!, { reason: 'Out of stock, agreed with the customer.' })
    expect([action.object, action.action, action.status]).toEqual(['money_action', 'refund', 'executed'])
    expect((await k.escrows.retrieve(paid.escrow_id!)).status).toBe('refunded')
    expect(await k.moneyActions.retrieve(action.id)).toEqual(action)
  })

  it.skipIf(!env.restrictedKey)(
    '[E2E-029] a key without escrows:manage cannot refund, and the escrow stays funded',
    async () => {
      const who = people()
      const k = ketapay()
      const session = await k.checkoutSessions.create(sessionParams(who, { seller: undefined }))
      const paid = await k.testHelpers.checkoutSessions.pay(session.id)
      await expect(
        ketapay(env.restrictedKey!).escrows.refund(paid.escrow_id!, {
          reason: 'Out of stock, agreed with the customer.',
        }),
      ).rejects.toMatchObject({ code: 'missing_scope' })
      expect((await k.escrows.retrieve(paid.escrow_id!)).status).toBe('active')
    },
  )
})
