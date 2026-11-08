import { describe, expect, it } from 'vitest'
import { InvalidRequestError, PermissionError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { fundedEscrow, tokenFor } from '../support/flows.js'
import { served } from '../support/served.js'

// A platform decides a dispute between two of its customers, and only once one of them raised it
describe.skipIf(!configured)('e2e: platform rulings', () => {
  it.skipIf(!served('disputes', 'rulings'))(
    '[E2E-043] a platform splits a dispute its buyer raised: part refunded, the rest released',
    async () => {
      const { escrow, buyer } = await fundedEscrow()
      const k = ketapay()
      const dispute = await k.disputes.create(
        escrow.id,
        { reason: 'damaged', description: 'The screen arrived cracked in the box.' },
        { customerToken: await tokenFor(buyer) },
      )
      const refund = Math.floor(escrow.amount * 0.3)
      const action = await k.disputes.resolve(dispute.id, {
        outcome: 'split',
        refund_amount: refund,
        reason: 'Cracked screen: our policy returns 30% for cosmetic damage.',
      })
      expect([action.object, action.action, action.status, action.refund_amount, action.dispute_id]).toEqual([
        'money_action',
        'ruling_split',
        'executed',
        refund,
        dispute.id,
      ])
      const resolved = await k.disputes.retrieve(dispute.id)
      expect([resolved.status, resolved.outcome, resolved.resolved_by, resolved.refunded_amount]).toEqual([
        'resolved',
        'partially_refunded',
        'platform',
        refund,
      ])
    },
  )

  it.skipIf(!served('disputes', 'rulings'))(
    '[E2E-044] no dispute, no ruling: a refund is refused, and a split giving the buyer everything too',
    async () => {
      const { escrow, buyer } = await fundedEscrow()
      const k = ketapay()
      await expect(
        k.escrows.refund(escrow.id, { reason: 'The platform wants to step in early.' }),
      ).rejects.toMatchObject({ code: 'dispute_required' })
      await expect(
        k.escrows.refund(escrow.id, { reason: 'The platform wants to step in early.' }),
      ).rejects.toBeInstanceOf(PermissionError)

      const dispute = await k.disputes.create(
        escrow.id,
        { reason: 'not_received', description: 'Nothing has arrived after two weeks.' },
        { customerToken: await tokenFor(buyer) },
      )
      const tooMuch = k.disputes.resolve(dispute.id, {
        outcome: 'split',
        refund_amount: escrow.amount,
        reason: 'Trying to give the buyer everything.',
      })
      await expect(tooMuch).rejects.toBeInstanceOf(InvalidRequestError)
      await expect(tooMuch).rejects.toMatchObject({ param: 'refund_amount' })
      expect((await k.escrows.retrieve(escrow.id)).status).toBe('disputed')
      expect((await k.disputes.retrieve(dispute.id)).status).toBe('open')
    },
  )
})
