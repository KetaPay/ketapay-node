import { describe, expect, it } from 'vitest'
import { ConflictError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { first, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured)('e2e: disputes', () => {
  it.skipIf(!served('disputes', 'files'))(
    '[E2E-009] dispute with uploaded evidence, seller concedes: resolved and refunded',
    async () => {
      const { escrow, buyer, seller } = await fundedEscrow()
      const k = ketapay()
      const buyerToken = await tokenFor(buyer)
      const file = await k.files.create(
        {
          file: new TextEncoder().encode('%PDF-1.4 evidence'),
          filename: 'evidence.pdf',
          contentType: 'application/pdf',
          purpose: 'dispute_evidence',
        },
        { customerToken: buyerToken },
      )
      const dispute = await k.disputes.create(
        escrow.id,
        { reason: 'not_received', description: 'Nothing was delivered by the due date.', files: [file.id] },
        { customerToken: buyerToken },
      )
      expect(dispute.status).toBe('open')
      expect((await k.disputes.listEvidence(dispute.id, { customerToken: buyerToken })).data.length).toBeGreaterThan(0)
      const resolved = await k.disputes.concede(dispute.id, { customerToken: await tokenFor(seller) })
      expect(resolved.status).toBe('resolved')
      expect(resolved.resolved_by).toBe('seller')
      await eventually(async () => expect((await k.escrows.retrieve(escrow.id)).status).toBe('refunded'))
    },
  )

  it.skipIf(!served('disputes'))(
    '[E2E-030] an escalated dispute is under review and can no longer be settled',
    async () => {
      const { escrow, buyer, seller } = await fundedEscrow()
      const k = ketapay()
      const buyerToken = { customerToken: await tokenFor(buyer) }
      const dispute = await k.disputes.create(
        escrow.id,
        { reason: 'not_as_agreed', description: 'The work does not match the brief at all.' },
        buyerToken,
      )
      const escalated = await k.disputes.escalate(dispute.id, buyerToken)
      expect([escalated.status, escalated.outcome]).toEqual(['under_review', null])
      await expect(k.disputes.concede(dispute.id, { customerToken: await tokenFor(seller) })).rejects.toMatchObject({
        code: 'escrow_under_review',
      })
      expect((await k.escrows.retrieve(escrow.id)).status).toBe('disputed')
    },
  )

  it.skipIf(!served('disputes'))('[E2E-021] an open dispute blocks the normal release', async () => {
    const { escrow, buyer, seller } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    await k.escrows.milestones.deliver(escrow.id, m.id, {}, { customerToken: await tokenFor(seller) })
    const buyerToken = await tokenFor(buyer)
    await k.disputes.create(
      escrow.id,
      { milestone_id: m.id, reason: 'not_as_agreed', description: 'Not what the brief asked for.' },
      { customerToken: buyerToken },
    )
    const err = await k.escrows.milestones
      .release(escrow.id, m.id, {}, { customerToken: buyerToken })
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ConflictError)
    expect(err).toMatchObject({ code: 'dispute_open' })
  })
})
